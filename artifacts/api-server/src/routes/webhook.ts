// ============================================================
// STRIPE WEBHOOK — /api/stripe-webhook
// ============================================================
// Receives Stripe events after a customer completes payment.
//
// Setup in Stripe Dashboard:
//   Endpoint URL: https://<your-domain>/api/stripe-webhook
//   Event to listen for: checkout.session.completed
//
// Required environment variable:
//   STRIPE_WEBHOOK_SECRET — the signing secret from Stripe Dashboard
//   (Developers → Webhooks → your endpoint → Signing secret)
// ============================================================

import express, { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { updatePaymentStatus, updateBookingAdmin, getBookingByRef } from "../lib/sheets";
import { editBookingMessage, sendDepositNotification, sendInvoicePaymentNotification, sendOrEditPaymentsTopic, type TelegramBooking } from "../lib/telegram";
import { logger } from "../lib/logger";

export const webhookRouter = Router();

const WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"] ?? "";

// Verifies the Stripe-Signature header using HMAC-SHA256.
// https://docs.stripe.com/webhooks#verify-manually
function verifyStripeSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const parts = signature.split(",");
  const tPart = parts.find((p) => p.startsWith("t="));
  const sigParts = parts.filter((p) => p.startsWith("v1="));

  if (!tPart || sigParts.length === 0) return false;

  const timestamp = tPart.slice(2);
  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  return sigParts.some((s) => {
    const sig = s.slice(3); // strip "v1=" prefix
    try {
      const sigBuf = Buffer.from(sig, "hex");
      const expBuf = Buffer.from(expected, "hex");
      if (sigBuf.length !== expBuf.length) return false;
      return timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  });
}

// Minimal type for the Stripe event shape used here
interface StripeCheckoutSession {
  client_reference_id?: string | null;
  amount_total?: number | null;
  customer_details?: { name?: string | null; email?: string | null } | null;
}

interface StripeInvoice {
  id?: string;
  metadata?: Record<string, string>;
  amount_paid?: number;
  amount_due?: number;
}

interface StripeEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { object: StripeCheckoutSession & StripeInvoice & Record<string, any> };
}

// express.raw() is applied here (not globally) so only this route receives a Buffer body.
// All other /api/* routes continue to use express.json() normally.
webhookRouter.post("/stripe-webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  // ── Signature verification ─────────────────────────────────
  if (WEBHOOK_SECRET) {
    if (!signature) {
      logger.warn("Stripe webhook received without stripe-signature header");
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }
    if (!verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET)) {
      logger.warn("Stripe webhook signature verification failed — request rejected");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
  } else {
    logger.warn(
      "STRIPE_WEBHOOK_SECRET not set — skipping signature verification (unsafe for production)",
    );
  }

  // ── Parse event ────────────────────────────────────────────
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  logger.info({ type: event.type }, "Stripe webhook event received");

  // ── Handle checkout.session.completed ─────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingRef = session.client_reference_id?.trim() ?? "";
    const amountTotal = session.amount_total ?? 0;
    const customerName = session.customer_details?.name?.trim() || "Customer";
    const depositFormatted = `£${(amountTotal / 100).toFixed(2)}`;

    logger.info(
      { bookingRef, amountTotal, customerName },
      "checkout.session.completed — processing deposit",
    );

    if (!bookingRef) {
      logger.warn("No client_reference_id on Stripe event — skipping sheet/Telegram update");
      res.json({ received: true });
      return;
    }

    // Update Google Sheets: Payment Status → "Deposit paid"
    await updatePaymentStatus(bookingRef, "Deposit paid");

    // ── Telegram: edit existing message if possible, else short fallback ─────
    // Failure does NOT block the webhook response
    ;(async () => {
      try {
        const booking = await getBookingByRef(bookingRef);
        const msgId = booking?.telegramMessageId
          ? parseInt(booking.telegramMessageId, 10)
          : NaN;

        const depositPayload: TelegramBooking | null = booking ? {
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
          estimatedTime:    booking.duration ?? "",
          preferredDate:    booking.date,
          timeWindow:       booking.timeWindow,
          wasteAddons:      "",
          uploadedFiles:    "",
          notes:            booking.notes,
          bookingStatus:    booking.bookingStatus,
          paymentStatus:    "Deposit paid",
          confirmedDate:    booking.confirmedDate,
          confirmedTime:    booking.confirmedTime,
          agreedQuote:      booking.agreedQuote,
          depositAmount:    booking.depositAmount,
        } : null;

        if (depositPayload && !isNaN(msgId)) {
          // Edit the existing message to show updated payment status
          const edited = await editBookingMessage(msgId, depositPayload);
          if (!edited) {
            // Edit failed (e.g. message too old) — fall back to short notification
            await sendDepositNotification(bookingRef, depositFormatted, customerName);
          }
        } else {
          // No stored message ID — send short notification
          await sendDepositNotification(bookingRef, depositFormatted, customerName);
        }

        // Payments topic: send or edit (requires full booking data)
        if (booking && depositPayload) {
          const existingPaymentsMsgId = booking.telegramPaymentsMessageId
            ? parseInt(booking.telegramPaymentsMessageId, 10)
            : null;
          const newPaymentsMsgId = await sendOrEditPaymentsTopic(depositPayload, existingPaymentsMsgId);
          if (newPaymentsMsgId != null && String(newPaymentsMsgId) !== booking.telegramPaymentsMessageId) {
            await updateBookingAdmin(bookingRef, { telegramPaymentsMessageId: String(newPaymentsMsgId) });
          }
        }
      } catch (err) {
        logger.error({ err, bookingRef }, "Telegram payment notification failed");
      }
    })();
  }

  // ── Handle invoice.paid ───────────────────────────────────────
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const inv = event.data.object;
    const bookingRef = (inv.metadata?.["booking_reference"] ?? "").trim();
    const invoiceType = inv.metadata?.["invoice_type"] ?? "";
    const agreedQuote = inv.metadata?.["agreed_quote"] ?? "—";
    const depositAmount = inv.metadata?.["deposit_amount"] ?? "—";
    const remainingBalance = inv.metadata?.["remaining_balance"] ?? "—";
    const paid = event.type === "invoice.paid";
    const amountRaw = paid ? (inv.amount_paid ?? 0) : (inv.amount_due ?? 0);
    const amountFormatted = `£${(amountRaw / 100).toFixed(2)}`;

    logger.info({ type: event.type, bookingRef, invoiceType }, "Stripe invoice event received");

    if (!bookingRef) {
      logger.warn("No booking_reference in invoice metadata — skipping");
      res.json({ received: true });
      return;
    }

    const paymentStatus = !paid
      ? "Payment failed"
      : invoiceType === "deposit"
        ? "Deposit paid"
        : "Fully paid";

    await updateBookingAdmin(bookingRef, { paymentStatus });

    ;(async () => {
      try {
        // Try to edit the existing booking message first; fall back to a new
        // notification if no message ID is stored (e.g. older bookings).
        const booking = await getBookingByRef(bookingRef);
        const msgId = booking?.telegramMessageId
          ? parseInt(booking.telegramMessageId, 10)
          : NaN;

        let edited = false;
        if (booking && !isNaN(msgId)) {
          edited = await editBookingMessage(msgId, {
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
            bookingStatus:     booking.bookingStatus,
            paymentStatus,
            confirmedDate:     booking.confirmedDate,
            confirmedTime:     booking.confirmedTime,
            agreedQuote:       booking.agreedQuote,
            depositAmount:     booking.depositAmount,
            adminExtraStops:   booking.adminExtraStops,
            adminExtraCharges: booking.adminExtraCharges,
          });
        }

        if (!edited) {
          await sendInvoicePaymentNotification({
            bookingRef,
            invoiceType,
            amountFormatted,
            agreedQuote: agreedQuote !== "—" ? `£${agreedQuote}` : "—",
            depositAmount: depositAmount !== "—" ? `£${depositAmount}` : "—",
            remainingBalance: remainingBalance !== "—" ? `£${remainingBalance}` : "—",
            paymentStatus,
            paid,
          });
        }

        // Payments topic: send or edit
        if (booking) {
          const invoicePayload: TelegramBooking = {
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
            bookingStatus:     booking.bookingStatus,
            paymentStatus,
            confirmedDate:     booking.confirmedDate,
            confirmedTime:     booking.confirmedTime,
            agreedQuote:       booking.agreedQuote,
            depositAmount:     booking.depositAmount,
            adminExtraStops:   booking.adminExtraStops,
            adminExtraCharges: booking.adminExtraCharges,
          };
          const existingPaymentsMsgId = booking.telegramPaymentsMessageId
            ? parseInt(booking.telegramPaymentsMessageId, 10)
            : null;
          const newPaymentsMsgId = await sendOrEditPaymentsTopic(invoicePayload, existingPaymentsMsgId);
          if (newPaymentsMsgId != null && String(newPaymentsMsgId) !== booking.telegramPaymentsMessageId) {
            await updateBookingAdmin(bookingRef, { telegramPaymentsMessageId: String(newPaymentsMsgId) });
          }
        }
      } catch (err) {
        logger.error({ err, bookingRef }, "Invoice payment Telegram notification failed");
      }
    })();
  }

  res.json({ received: true });
});

export default webhookRouter;
