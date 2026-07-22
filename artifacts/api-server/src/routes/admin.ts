// ============================================================
// ADMIN ROUTES — /api/admin/*
// ============================================================
// Protected by X-Admin-Key header (checked against ADMIN_PASSWORD env var).
// Default password is "move4u-admin" — set ADMIN_PASSWORD env var to change it.
//
// Routes:
//   GET  /api/admin/bookings               — list all bookings from Google Sheets
//   PUT  /api/admin/bookings/:ref          — update admin fields for a booking
//   POST /api/admin/bookings/:ref/payment-link — create Stripe Checkout Session
// ============================================================

import { Router, type Request, type Response, type NextFunction } from "express";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stripe = require("stripe").default ?? require("stripe");
import { getAllBookings, updateBookingAdmin, getBookingByRef, writeAuditLog, permanentDeleteBooking, type BookingRecord } from "../lib/sheets";
import { editBookingMessage, sendBookingUpdateNotification, sendInvoiceCreatedNotification, sendOrEditPaymentsTopic, sendCompletedJobsTopic, type TelegramBooking } from "../lib/telegram";
import { sendEmail } from "../lib/email";
import { logger } from "../lib/logger";

const adminRouter = Router();

const ADMIN_KEY = process.env["ADMIN_PASSWORD"] ?? "move4u-admin";
if (!process.env["ADMIN_PASSWORD"]) {
  logger.warn("ADMIN_PASSWORD env var not set — using default 'move4u-admin' (change this in production)");
}

// SITE_URL is the production domain customers see. We default to the
// canonical brand domain so payment-success / cancel redirects never leak
// a *.replit.app URL to a customer. SITE_URL can still be overridden for
// staging / preview deployments via the env var.
const SITE_URL = process.env["SITE_URL"] ?? "https://move4u.uk";
if (!process.env["SITE_URL"]) {
  logger.warn(
    "SITE_URL env var is not set — Stripe redirect URLs will use the default 'https://move4u.uk'. " +
    "Override SITE_URL only for staging / preview deployments."
  );
}

// Feature flag — set ENABLE_STRIPE_INVOICES=true in env to re-enable.
// Default is false: the /invoice endpoint returns 503 and no invoice is ever created.
const ENABLE_STRIPE_INVOICES = (process.env["ENABLE_STRIPE_INVOICES"] ?? "false").toLowerCase() === "true";

// ── Telegram helpers ──────────────────────────────────────────
// Fields whose changes are payment-status-only and should silently
// edit the existing Telegram booking message rather than send a new one.
const PAYMENT_ONLY_FIELDS = new Set(["paymentStatus", "agreedQuote", "depositAmount", "paymentLink"]);

// Convert a BookingRecord into a TelegramBooking payload, with optional overrides.
function toTelegramPayload(booking: BookingRecord, overrides: Partial<TelegramBooking> = {}): TelegramBooking {
  const agreedNum  = parseFloat(booking.agreedQuote);
  const depositNum = parseFloat(booking.depositAmount);
  const remaining  = !isNaN(agreedNum) && !isNaN(depositNum) && agreedNum > 0
    ? String(Math.max(0, agreedNum - depositNum).toFixed(2))
    : "";

  return {
    bookingReference:  booking.bookingReference,
    service:           booking.service,
    name:              booking.name,
    phone:             booking.phone,
    contactMethod:     booking.contactMethod,
    pickup:            booking.pickup,
    pickupDetails:     "",
    dropoff:           booking.dropoff,
    dropoffDetails:    "",
    extraAddress:      "",
    vanSize:           booking.vanSize,
    helpOption:        booking.helpOption,
    peopleCount:       "",
    estimatedPrice:    booking.estimatedPrice,
    estimatedTime:     booking.duration ?? "",
    preferredDate:     booking.date,
    timeWindow:        booking.timeWindow,
    wasteAddons:       "",
    uploadedFiles:     booking.photoUrls ?? "",
    notes:             booking.notes,
    driverNotes:       booking.driverNotes,
    bookingStatus:     booking.bookingStatus,
    paymentStatus:     booking.paymentStatus,
    confirmedDate:     booking.confirmedDate,
    confirmedTime:     booking.confirmedTime,
    agreedQuote:       booking.agreedQuote,
    depositAmount:     booking.depositAmount,
    remainingBalance:  remaining,
    adminExtraStops:   booking.adminExtraStops,
    adminExtraCharges: booking.adminExtraCharges,
    ...overrides,
  };
}

// Edit the stored Telegram booking message in-place.
// Returns true on success, false if no message ID is stored or the edit failed.
async function tryEditTelegramMessage(
  booking: BookingRecord,
  overrides: Partial<TelegramBooking> = {},
): Promise<boolean> {
  const msgId = booking.telegramMessageId ? parseInt(booking.telegramMessageId, 10) : NaN;
  if (isNaN(msgId)) return false;
  return editBookingMessage(msgId, toTelegramPayload(booking, overrides));
}

// Lazily initialise Stripe — only if STRIPE_SECRET_KEY is set
function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Stripe as any)(key) as InstanceType<typeof Stripe>;
}

// ── Auth middleware ───────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ── No-cache middleware (admin routes must never return 304) ──
// Express checks If-None-Match / If-Modified-Since independently of
// Cache-Control, so removing those request headers is the only way to
// guarantee Express never short-circuits with 304 Not Modified.
adminRouter.use((req: Request, res: Response, next: NextFunction): void => {
  delete req.headers["if-none-match"];
  delete req.headers["if-modified-since"];
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  next();
});

// ── GET /api/admin/bookings ───────────────────────────────────
adminRouter.get("/admin/bookings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const all = await getAllBookings();
    const showDeleted = (req.query as Record<string, string>)["deleted"] === "true";
    const bookings = showDeleted
      ? all.filter((b) => b.isDeleted === "true")
      : all.filter((b) => b.isDeleted !== "true");
    res.json({ bookings });
  } catch (err) {
    logger.error({ err }, "Failed to load bookings for admin panel");
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// ── PUT /api/admin/bookings/:ref ──────────────────────────────
adminRouter.put("/admin/bookings/:ref", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;
  const fields = req.body as Record<string, string>;

  // Extract notify flag BEFORE building the allowed update — not a storable field.
  // notify=true → "Save & Notify Driver" → send Telegram after save.
  // notify=false/absent → "Save Changes" → silent save only.
  const shouldNotify = fields.notify === "true" || (fields.notify as unknown) === true;

  // Only allow known fields through
  const allowed: (keyof typeof fields)[] = [
    "bookingStatus", "paymentStatus",
    "agreedQuote", "depositAmount",
    "confirmedDate", "confirmedTime",
    "driverNotes", "paymentLink",
    "notes", "pickup", "dropoff",
    "duration",
    "adminExtraStops", "adminExtraCharges",
    // Editable booking core fields
    "service", "vanSize", "helpOption",
  ];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }
  // timeWindow from request → preferredTime in BookingAdminUpdate (column X)
  if (fields["timeWindow"] !== undefined) update["preferredTime"] = fields["timeWindow"];

  // Deposit-lock: if agreedQuote changes but depositAmount is NOT explicitly sent,
  // strip it so the existing deposit in Sheets is never overwritten.
  if ("agreedQuote" in update && !("depositAmount" in fields)) {
    delete update["depositAmount"];
  }

  try {
    // Read old booking BEFORE update so we can diff old vs new for audit log
    const oldBooking = await getBookingByRef(bookingRef).catch(() => null);

    const found = await updateBookingAdmin(bookingRef, update);
    if (!found) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json({ success: true });

    // Fire-and-forget: audit log + optional Telegram notification
    ;(async () => {
      try {
        const booking = await getBookingByRef(bookingRef);
        if (!booking) return;

        const changedFields = Object.keys(update).filter(
          (k) => k !== "telegramMessageId" && k !== "paymentLink",
        );

        // 1. Audit log — always, regardless of notify flag
        if (changedFields.length > 0 && oldBooking) {
          const auditEntries = changedFields.map((key) => ({
            bookingRef,
            fieldChanged: key,
            oldValue: (oldBooking as unknown as Record<string, string>)[key] ?? "—",
            newValue: String(update[key] ?? ""),
            changedBy: "Admin",
          }));
          await writeAuditLog(auditEntries);
        }

        // 2. Telegram — depends on what changed
        if (shouldNotify) {
          // "Save & Notify Driver" → send a new full driver update message
          const agreedNum  = parseFloat(booking.agreedQuote);
          const depositNum = parseFloat(booking.depositAmount);
          const remaining  = !isNaN(agreedNum) && !isNaN(depositNum) && agreedNum > 0
            ? String(Math.max(0, agreedNum - depositNum).toFixed(2))
            : "";

          await sendBookingUpdateNotification({
            bookingReference:  booking.bookingReference,
            service:           update.service    ?? booking.service,
            name:              booking.name,
            phone:             booking.phone,
            contactMethod:     booking.contactMethod,
            pickup:            update.pickup     ?? booking.pickup,
            pickupDetails:     "",
            dropoff:           update.dropoff    ?? booking.dropoff,
            dropoffDetails:    "",
            extraAddress:      "",
            vanSize:           update.vanSize    ?? booking.vanSize,
            helpOption:        update.helpOption ?? booking.helpOption,
            peopleCount:       "",
            estimatedPrice:    booking.estimatedPrice,
            estimatedTime:     update.duration   ?? booking.duration ?? "",
            preferredDate:     booking.date,
            timeWindow:        update.preferredTime ?? booking.timeWindow,
            wasteAddons:       "",
            uploadedFiles:     "",
            notes:             update.notes      ?? booking.notes,
            driverNotes:       update.driverNotes ?? booking.driverNotes,
            bookingStatus:     update.bookingStatus  ?? booking.bookingStatus,
            paymentStatus:     update.paymentStatus  ?? booking.paymentStatus,
            confirmedDate:     update.confirmedDate  ?? booking.confirmedDate,
            confirmedTime:     update.confirmedTime  ?? booking.confirmedTime,
            agreedQuote:       update.agreedQuote    ?? booking.agreedQuote,
            depositAmount:     booking.depositAmount,
            remainingBalance:  remaining,
            changedFields,
            adminExtraStops:   update.adminExtraStops   ?? booking.adminExtraStops,
            adminExtraCharges: update.adminExtraCharges ?? booking.adminExtraCharges,
          });
          // Completed Jobs topic: fire a copy when status is now Completed
          if (booking.bookingStatus === "Completed") {
            await sendCompletedJobsTopic(toTelegramPayload(booking));
          }
        } else if (Object.keys(update).some((k) => PAYMENT_ONLY_FIELDS.has(k))) {
          // Silent save with payment-field changes → edit existing Main message, and
          // send/edit the Payments forum topic message.
          const edited = await tryEditTelegramMessage(booking);
          if (!edited) {
            logger.info({ bookingRef }, "No Telegram message ID stored — skipping silent payment edit (Main)");
          }
          // Payments topic: send or edit
          const existingPaymentsMsgId = booking.telegramPaymentsMessageId
            ? parseInt(booking.telegramPaymentsMessageId, 10)
            : null;
          const newPaymentsMsgId = await sendOrEditPaymentsTopic(
            toTelegramPayload(booking),
            existingPaymentsMsgId,
          );
          if (newPaymentsMsgId != null && String(newPaymentsMsgId) !== booking.telegramPaymentsMessageId) {
            await updateBookingAdmin(bookingRef, { telegramPaymentsMessageId: String(newPaymentsMsgId) });
          }
        }
      } catch (err) {
        logger.error({ err, bookingRef }, "Post-save admin notifications failed");
      }
    })();
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to update booking via admin panel");
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ── Soft delete / restore / permanent delete ──────────────────
// Define /permanent BEFORE /:ref so Express matches it first.

adminRouter.delete("/admin/bookings/:ref/permanent", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;
  try {
    const removed = await permanentDeleteBooking(bookingRef);
    if (!removed) {
      res.status(404).json({ error: "Booking not found or could not be deleted" });
      return;
    }
    logger.info({ bookingRef }, "Booking permanently deleted by admin");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to permanently delete booking");
    res.status(500).json({ error: "Failed to permanently delete booking" });
  }
});

adminRouter.delete("/admin/bookings/:ref", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;
  try {
    const booking = await getBookingByRef(bookingRef);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    await updateBookingAdmin(bookingRef, {
      isDeleted:             "true",
      deletedAt:             new Date().toISOString(),
      deletedBy:             "admin",
      previousBookingStatus: booking.bookingStatus,
    });
    logger.info({ bookingRef }, "Booking soft-deleted by admin");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to soft-delete booking");
    res.status(500).json({ error: "Failed to soft-delete booking" });
  }
});

adminRouter.post("/admin/bookings/:ref/restore", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;
  try {
    const booking = await getBookingByRef(bookingRef);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    await updateBookingAdmin(bookingRef, {
      isDeleted:             "false",
      deletedAt:             "",
      deletedBy:             "",
      previousBookingStatus: "",
    });
    logger.info({ bookingRef }, "Booking restored by admin");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to restore booking");
    res.status(500).json({ error: "Failed to restore booking" });
  }
});

// ── POST /api/admin/bookings/:ref/invoice ────────────────────
// Creates a Stripe Invoice (deposit / full / remaining balance).
// Email is optional: if present the invoice is sent; if absent the
// hosted URL is returned for manual copy/paste.
adminRouter.post("/admin/bookings/:ref/invoice", requireAdmin, async (req: Request, res: Response) => {
  if (!ENABLE_STRIPE_INVOICES) {
    res.status(503).json({ error: "Invoice feature is currently disabled (ENABLE_STRIPE_INVOICES=false)" });
    return;
  }

  const bookingRef = req.params.ref as string;

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "STRIPE_SECRET_KEY not configured" });
    return;
  }

  const {
    invoiceType = "",
    agreedQuote = "",
    depositAmount = "",
    customerName = "",
    customerEmail = "",
    customerPhone = "",
    pickup = "",
    dropoff = "",
    serviceType = "",
  } = req.body as Record<string, string>;

  if (!["deposit", "full", "remaining"].includes(invoiceType)) {
    res.status(400).json({ error: "invoiceType must be deposit, full, or remaining" });
    return;
  }

  const agreedNum = parseFloat(agreedQuote);
  if ((invoiceType === "full" || invoiceType === "remaining") && (!agreedQuote || isNaN(agreedNum))) {
    res.status(400).json({ error: "Please enter Agreed Quote first." });
    return;
  }

  // Compute deposit: use provided value or 30 % of agreed quote
  const depositNum = depositAmount && !isNaN(parseFloat(depositAmount))
    ? parseFloat(depositAmount)
    : agreedQuote ? Math.round(agreedNum * 0.30 * 100) / 100 : 0;

  let amountNum: number;
  let lineLabel: string;
  if (invoiceType === "deposit") {
    if (!depositNum) {
      res.status(400).json({ error: "Cannot determine deposit amount. Enter Agreed Quote or Deposit Amount." });
      return;
    }
    amountNum = depositNum;
    lineLabel = `Move4U Booking ${bookingRef} — Deposit`;
  } else if (invoiceType === "full") {
    amountNum = agreedNum;
    lineLabel = `Move4U Booking ${bookingRef} — Full payment`;
  } else {
    amountNum = Math.max(0, agreedNum - depositNum);
    lineLabel = `Move4U Booking ${bookingRef} — Remaining balance`;
  }

  const amountPence = Math.round(amountNum * 100);
  if (amountPence <= 0) {
    res.status(400).json({ error: "Invoice amount must be greater than £0." });
    return;
  }

  const remainingBalance = agreedQuote ? Math.max(0, agreedNum - depositNum).toFixed(2) : "—";

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = stripe as any;

    // Find or create Stripe customer
    let customerId: string;
    if (customerEmail) {
      const existing = await s.customers.list({ email: customerEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id as string;
      } else {
        const cust = await s.customers.create({
          ...(customerName && { name: customerName }),
          email: customerEmail,
          ...(customerPhone && { phone: customerPhone }),
          metadata: { booking_reference: bookingRef },
        });
        customerId = cust.id as string;
      }
    } else {
      const cust = await s.customers.create({
        ...(customerName && { name: customerName }),
        ...(customerPhone && { phone: customerPhone }),
        metadata: { booking_reference: bookingRef },
      });
      customerId = cust.id as string;
    }

    // Create invoice
    const invoice = await s.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 14,
      description: [
        `Booking: ${bookingRef}`,
        serviceType && `Service: ${serviceType}`,
        pickup && `From: ${pickup}`,
        dropoff && `To: ${dropoff}`,
      ].filter(Boolean).join(" | "),
      metadata: {
        booking_reference: bookingRef,
        invoice_type: invoiceType,
        agreed_quote: agreedQuote || "—",
        deposit_amount: depositNum.toFixed(2),
        remaining_balance: remainingBalance,
      },
    });

    // Add line item
    await s.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: amountPence,
      currency: "gbp",
      description: lineLabel,
    });

    // Finalize
    const finalized = await s.invoices.finalizeInvoice(invoice.id);
    const hostedUrl: string = finalized.hosted_invoice_url ?? "";

    // Send by email if available
    let emailSent = false;
    if (customerEmail) {
      try {
        await s.invoices.sendInvoice(invoice.id);
        emailSent = true;
      } catch (sendErr) {
        logger.warn({ sendErr, invoiceId: invoice.id }, "sendInvoice failed — invoice finalized but not emailed");
      }
    }

    // Persist to Sheets
    const paymentStatus = emailSent ? "Invoice sent" : "Invoice created";
    await updateBookingAdmin(bookingRef, {
      invoiceId: invoice.id as string,
      invoiceUrl: hostedUrl,
      invoiceType,
      paymentStatus,
    });

    // Telegram: edit the existing booking message to reflect invoice status,
    // falling back to a separate invoice notification if no message ID is stored.
    ;(async () => {
      try {
        const booking = await getBookingByRef(bookingRef);
        const edited = booking ? await tryEditTelegramMessage(booking, { paymentStatus }) : false;
        if (!edited) {
          await sendInvoiceCreatedNotification({
            bookingRef,
            invoiceType,
            amountFormatted: `£${amountNum.toFixed(2)}`,
            customerName,
            agreedQuote: agreedQuote ? `£${agreedNum.toFixed(2)}` : "—",
            depositAmount: `£${depositNum.toFixed(2)}`,
            remainingBalance: agreedQuote ? `£${remainingBalance}` : "—",
            paymentStatus,
            invoiceUrl: hostedUrl,
            emailSent,
          });
        }
        // Payments topic: send or edit
        if (booking) {
          const existingPaymentsMsgId = booking.telegramPaymentsMessageId
            ? parseInt(booking.telegramPaymentsMessageId, 10)
            : null;
          const newPaymentsMsgId = await sendOrEditPaymentsTopic(
            toTelegramPayload(booking, { paymentStatus }),
            existingPaymentsMsgId,
          );
          if (newPaymentsMsgId != null && String(newPaymentsMsgId) !== booking.telegramPaymentsMessageId) {
            await updateBookingAdmin(bookingRef, { telegramPaymentsMessageId: String(newPaymentsMsgId) });
          }
        }
      } catch (err) {
        logger.warn({ err, bookingRef }, "Invoice Telegram notification failed");
      }
    })();

    logger.info({ bookingRef, invoiceType, amountPence, emailSent }, "Stripe invoice created");
    res.json({ invoiceId: invoice.id, invoiceUrl: hostedUrl, emailSent, paymentStatus });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to create Stripe invoice");
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// ── POST /api/admin/bookings/:ref/payment-link ────────────────
// Creates a unique Stripe Checkout Session for a specific booking.
// The booking reference is passed as client_reference_id AND metadata
// so the webhook can match it.
adminRouter.post("/admin/bookings/:ref/payment-link", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "STRIPE_SECRET_KEY not configured — add it to your environment secrets" });
    return;
  }

  const {
    depositAmount = "",
    agreedQuote   = "",
    customerName  = "",
    paymentType   = "deposit",
  } = req.body as Record<string, string>;

  const validTypes = ["deposit", "remaining", "full"] as const;
  const pType: "deposit" | "remaining" | "full" = validTypes.includes(
    paymentType as (typeof validTypes)[number],
  )
    ? (paymentType as "deposit" | "remaining" | "full")
    : "deposit";

  const depositNum = parseFloat(depositAmount) || 0;
  const agreedNum  = parseFloat(agreedQuote)   || 0;

  let amountNum: number;
  let productName: string;
  let productDesc: string;

  if (pType === "full") {
    if (agreedNum <= 0) {
      res.status(400).json({ error: "Enter an agreed quote before generating a full-payment link." });
      return;
    }
    amountNum   = agreedNum;
    productName = `Full Payment — ${bookingRef}`;
    productDesc = customerName
      ? `Move4U full payment for ${customerName}. Total: £${agreedNum.toFixed(2)}`
      : `Move4U full payment. Total: £${agreedNum.toFixed(2)}`;
  } else if (pType === "remaining") {
    if (agreedNum <= 0) {
      res.status(400).json({ error: "Enter an agreed quote before generating a remaining-balance link." });
      return;
    }
    if (depositNum <= 0) {
      res.status(400).json({ error: "Enter a deposit amount before generating a remaining-balance link." });
      return;
    }
    amountNum = Math.max(0, agreedNum - depositNum);
    if (amountNum <= 0) {
      res.status(400).json({ error: "Remaining balance is zero — the deposit already covers the full agreed quote." });
      return;
    }
    productName = `Remaining Balance — ${bookingRef}`;
    productDesc = customerName
      ? `Move4U remaining balance for ${customerName}. Total: £${agreedNum.toFixed(2)}, deposit paid: £${depositNum.toFixed(2)}`
      : `Move4U remaining balance. Total: £${agreedNum.toFixed(2)}, deposit paid: £${depositNum.toFixed(2)}`;
  } else {
    // deposit (default)
    if (depositNum <= 0) {
      res.status(400).json({ error: "A valid deposit amount is required to generate a payment link." });
      return;
    }
    amountNum   = depositNum;
    productName = `Booking Deposit — ${bookingRef}`;
    productDesc = customerName
      ? `Move4U deposit for ${customerName}. Agreed quote: £${agreedQuote}`
      : `Move4U deposit. Agreed quote: £${agreedQuote}`;
  }

  const amountPence = Math.round(amountNum * 100); // Stripe expects pence

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (stripe as any).checkout.sessions.create({
      mode: "payment",
      client_reference_id: bookingRef,                   // used by webhook to match booking
      metadata: { booking_reference: bookingRef },        // redundant but explicit
      customer_email: undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: amountPence,
          },
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a Stripe template variable — it is replaced
      // with the real session ID at redirect time (not a JS template literal).
      success_url: `${SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/pay/${bookingRef}`,
      // Show only card payments (which automatically includes Apple Pay on Safari
      // and Google Pay on Chrome/Android via Stripe's wallet detection).
      // This removes Klarna, Link, Amazon Pay, etc.
      payment_method_types: ["card"],
    });

    const paymentLink: string = session.url ?? "";

    // Persist the link and update statuses in Google Sheets
    await updateBookingAdmin(bookingRef, {
      paymentLink,
      paymentStatus: "Payment link ready",
    });

    logger.info({ bookingRef, pType, amountPence }, "Stripe Checkout Session created for booking");
    res.json({ paymentLink });

    // Edit the existing Telegram booking message to show "Payment link ready" (fire-and-forget)
    ;(async () => {
      try {
        const booking = await getBookingByRef(bookingRef);
        if (!booking) return;
        const edited = await tryEditTelegramMessage(booking, {
          paymentStatus: "Payment link ready",
        });
        if (!edited) {
          logger.info({ bookingRef }, "payment-link: no Telegram message ID — skipping Main edit");
        }
        // Payments topic: send or edit
        const existingPaymentsMsgId = booking.telegramPaymentsMessageId
          ? parseInt(booking.telegramPaymentsMessageId, 10)
          : null;
        const newPaymentsMsgId = await sendOrEditPaymentsTopic(
          toTelegramPayload(booking, { paymentStatus: "Payment link ready" }),
          existingPaymentsMsgId,
        );
        if (newPaymentsMsgId != null && String(newPaymentsMsgId) !== booking.telegramPaymentsMessageId) {
          await updateBookingAdmin(bookingRef, { telegramPaymentsMessageId: String(newPaymentsMsgId) });
        }
      } catch (err) {
        logger.warn({ err, bookingRef }, "payment-link: Telegram notification failed");
      }
    })();
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to create Stripe Checkout Session");
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

// ── POST /api/admin/bookings/:ref/send-confirmation ──────────────────────────
// Sends a booking confirmation email from info@move4u.uk via Zoho SMTP,
// then records the send in Google Sheets and the audit log.
adminRouter.post("/admin/bookings/:ref/send-confirmation", requireAdmin, async (req: Request, res: Response) => {
  const bookingRef = req.params.ref as string;
  const {
    subject = `Updated Booking Confirmation — ${bookingRef}`,
    sentTo  = "",
    body    = "",
  } = req.body as Record<string, string>;

  const sentAt = new Date().toISOString();

  if (!sentTo.trim()) {
    res.status(400).json({ error: "No recipient email address provided" });
    return;
  }

  try {
    // Send the email via Zoho SMTP
    const emailResult = await sendEmail({ to: sentTo, subject, text: body });

    if (!emailResult.sent) {
      logger.warn({ bookingRef, sentTo, error: emailResult.error }, "Confirmation email failed to send");
      res.status(502).json({ error: emailResult.error ?? "Failed to send email" });
      return;
    }

    // Record the successful send in Sheets and audit log
    await updateBookingAdmin(bookingRef, {
      confirmationSent:    "Yes",
      confirmationSentAt:  sentAt,
      confirmationSubject: subject,
      confirmationSentBy:  "Admin",
    });

    await writeAuditLog([{
      bookingRef,
      fieldChanged: "Confirmation Email",
      oldValue:     "Not sent",
      newValue:     `Sent — Subject: ${subject} | To: ${sentTo}`,
      changedBy:    "Admin",
    }]);

    logger.info({ bookingRef, subject, sentTo }, "Confirmation email sent via Zoho SMTP");
    res.json({ success: true, emailSent: true, sentAt });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to send confirmation email");
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

export default adminRouter;
