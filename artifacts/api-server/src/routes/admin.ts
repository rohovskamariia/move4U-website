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
import { getAllBookings, updateBookingAdmin, getBookingByRef } from "../lib/sheets";
import { editBookingMessage } from "../lib/telegram";
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

// ── GET /api/admin/bookings ───────────────────────────────────
adminRouter.get("/admin/bookings", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const bookings = await getAllBookings();
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

  // Only allow known fields through
  const allowed: (keyof typeof fields)[] = [
    "bookingStatus", "paymentStatus",
    "agreedQuote", "depositAmount",
    "confirmedDate", "confirmedTime",
    "driverNotes", "paymentLink",
  ];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }

  try {
    const found = await updateBookingAdmin(bookingRef, update);
    if (!found) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json({ success: true });

    // If status or payment changed, edit the existing Telegram message (fire-and-forget)
    const statusChanged = "bookingStatus" in update || "paymentStatus" in update
      || "confirmedDate" in update || "confirmedTime" in update;

    if (statusChanged) {
      (async () => {
        try {
          const booking = await getBookingByRef(bookingRef);
          if (!booking?.telegramMessageId) return;
          const msgId = parseInt(booking.telegramMessageId, 10);
          if (isNaN(msgId)) return;

          await editBookingMessage(msgId, {
            bookingReference: booking.bookingReference,
            service:          booking.service,
            name:             booking.name,
            phone:            booking.phone,
            contactMethod:    booking.contactMethod,
            pickup:           booking.pickup,
            pickupDetails:    "",
            dropoff:          booking.dropoff,
            dropoffDetails:   "",
            extraAddress:     "",
            vanSize:          booking.vanSize,
            helpOption:       booking.helpOption,
            peopleCount:      "",
            estimatedPrice:   booking.estimatedPrice,
            estimatedTime:    "",
            preferredDate:    booking.date,
            timeWindow:       booking.timeWindow,
            wasteAddons:      "",
            uploadedFiles:    "",
            notes:            booking.notes,
            // Use incoming fields where provided, fall back to stored values
            bookingStatus: update.bookingStatus ?? booking.bookingStatus,
            paymentStatus: update.paymentStatus ?? booking.paymentStatus,
            confirmedDate: update.confirmedDate ?? booking.confirmedDate,
            confirmedTime: update.confirmedTime ?? booking.confirmedTime,
          });
        } catch (err) {
          logger.error({ err, bookingRef }, "Failed to update Telegram message after admin status change");
        }
      })();
    }
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to update booking via admin panel");
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ── POST /api/admin/bookings/:ref/invoice ────────────────────
// Creates a Stripe Invoice (deposit / full / remaining balance).
// Email is optional: if present the invoice is sent; if absent the
// hosted URL is returned for manual copy/paste.
adminRouter.post("/admin/bookings/:ref/invoice", requireAdmin, async (req: Request, res: Response) => {
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

    // Telegram notification (fire-and-forget)
    ;(async () => {
      try {
        const { sendInvoiceCreatedNotification } = await import("../lib/telegram");
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

  const { depositAmount = "", agreedQuote = "", customerName = "" } = req.body as Record<string, string>;

  const depositNum = parseFloat(depositAmount);
  if (!depositAmount || isNaN(depositNum) || depositNum <= 0) {
    res.status(400).json({ error: "A valid deposit amount is required to generate a payment link" });
    return;
  }

  const depositPence = Math.round(depositNum * 100); // Stripe expects pence

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
              name: `Booking Deposit — ${bookingRef}`,
              description: customerName
                ? `Move4U deposit for ${customerName}. Agreed quote: £${agreedQuote}`
                : `Move4U deposit. Agreed quote: £${agreedQuote}`,
            },
            unit_amount: depositPence,
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

    logger.info({ bookingRef, depositPence }, "Stripe Checkout Session created for booking");
    res.json({ paymentLink });
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to create Stripe Checkout Session");
    res.status(500).json({ error: "Failed to generate payment link" });
  }
});

export default adminRouter;
