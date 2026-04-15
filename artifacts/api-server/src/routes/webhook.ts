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
import { updatePaymentStatus } from "../lib/sheets";
import { sendDepositNotification } from "../lib/telegram";
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

interface StripeEvent {
  type: string;
  data: { object: StripeCheckoutSession };
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

    // Send Telegram notification — failure does not block response
    sendDepositNotification(bookingRef, depositFormatted, customerName).catch((err) => {
      logger.error({ err }, "Telegram deposit notification failed");
    });
  }

  res.json({ received: true });
});

export default webhookRouter;
