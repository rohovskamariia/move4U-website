import { Router } from "express";
import { appendBooking, updateBookingAdmin } from "../lib/sheets";
import { sendBookingNotification } from "../lib/telegram";
import { logger } from "../lib/logger";

const bookingsRouter = Router();

bookingsRouter.post("/bookings", async (req, res) => {
  try {
    const {
      service = "",
      name = "",
      phone = "",
      contactMethod = "",
      pickup = "",
      pickupDetails = "",
      dropoff = "",
      dropoffDetails = "",
      extraAddress = "",
      vanSize = "",
      helpOption = "",
      peopleCount = "",
      estimatedPrice = "",
      estimatedTime = "",
      date = "",
      timeWindow = "",
      wasteAddons = "",
      uploadedFiles = "", // comma-separated photo serving URLs (e.g. /api/storage/objects/...)
      notes = "",
    } = req.body as Record<string, string>;

    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }

    // 1. Save to Google Sheets — returns the generated booking reference
    const bookingReference = await appendBooking({
      service, name, phone, contactMethod,
      pickup, dropoff, vanSize, helpOption,
      estimatedPrice, date, notes,
    });

    // 2. Respond immediately — don't block on photo storage or Telegram
    res.json({ success: true, bookingReference });

    // 3. If photos were uploaded, save their URLs to column W (fire-and-forget)
    if (uploadedFiles) {
      updateBookingAdmin(bookingReference, { photoUrls: uploadedFiles }).catch((err) =>
        logger.error({ err, bookingReference }, "Failed to save photo URLs to Sheets"),
      );
    }

    // 4. Send Telegram notification, then store the returned message_id in Sheets
    //    so future status/payment changes can EDIT the same message rather than
    //    sending a new one. All failures are logged but do not affect the response.
    sendBookingNotification({
      bookingReference,
      service, name, phone, contactMethod,
      pickup, pickupDetails,
      dropoff, dropoffDetails,
      extraAddress, vanSize, helpOption,
      peopleCount, estimatedPrice, estimatedTime,
      preferredDate: date, timeWindow,
      wasteAddons, uploadedFiles, notes,
      bookingStatus: "New",
      paymentStatus: "Unpaid",
    })
      .then(async (messageId) => {
        if (messageId !== null) {
          try {
            await updateBookingAdmin(bookingReference, {
              telegramMessageId: String(messageId),
            });
            logger.info(
              { bookingReference, messageId },
              "Telegram message ID saved to Sheets",
            );
          } catch (err) {
            logger.error({ err, bookingReference }, "Failed to save Telegram message ID");
          }
        }
      })
      .catch((err) => {
        logger.error({ err, bookingReference }, "Telegram booking notification failed");
      });

  } catch (err) {
    logger.error({ err }, "Failed to save booking");
    res.status(500).json({ error: "Failed to save booking" });
  }
});

export default bookingsRouter;
