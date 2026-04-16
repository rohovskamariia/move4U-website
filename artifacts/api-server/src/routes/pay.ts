// GET /api/pay/:ref
// Looks up the Stripe checkout URL stored in column U for a booking reference
// and returns it. The frontend /pay/:ref page calls this and immediately redirects
// the customer to the real Stripe session URL.
// The Stripe URL is never exposed in customer-facing messages — only the short
// /pay/:ref URL is shared.

import { Router, type Request, type Response } from "express";
import { getBookingByRef } from "../lib/sheets";
import { logger } from "../lib/logger";

const payRouter = Router();

payRouter.get("/pay/:ref", async (req: Request, res: Response) => {
  const bookingRef = decodeURIComponent(req.params.ref ?? "");

  if (!bookingRef) {
    res.status(400).json({ error: "Missing booking reference" });
    return;
  }

  try {
    const booking = await getBookingByRef(bookingRef);

    if (!booking) {
      logger.warn({ bookingRef }, "Pay redirect: booking not found");
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    if (!booking.paymentLink) {
      logger.warn({ bookingRef }, "Pay redirect: no payment link stored for booking");
      res.status(404).json({ error: "No payment link has been generated for this booking yet" });
      return;
    }

    logger.info({ bookingRef }, "Pay redirect: returning Stripe URL");
    res.json({ url: booking.paymentLink });
  } catch (err) {
    logger.error({ err, bookingRef }, "Pay redirect: failed to look up booking");
    res.status(500).json({ error: "Failed to look up payment link" });
  }
});

export default payRouter;
