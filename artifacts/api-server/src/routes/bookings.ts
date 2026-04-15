import { Router } from "express";
import { appendBooking } from "../lib/sheets";
import { sendBookingNotification } from "../lib/telegram";
import { logger } from "../lib/logger";

const bookingsRouter = Router();

bookingsRouter.post("/bookings", async (req, res) => {
  try {
    const {
      service = "",
      name = "",
      phone = "",
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
      uploadedFiles = "",
      notes = "",
    } = req.body as Record<string, string>;

    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }

    // Save to Google Sheets — unchanged
    await appendBooking({
      service,
      name,
      phone,
      pickup,
      dropoff,
      vanSize,
      helpOption,
      estimatedPrice,
      date,
      notes,
    });

    // Send Telegram notification — failure does not block response
    sendBookingNotification({
      service,
      name,
      phone,
      pickup,
      pickupDetails,
      dropoff,
      dropoffDetails,
      extraAddress,
      vanSize,
      helpOption,
      peopleCount,
      estimatedPrice,
      estimatedTime,
      preferredDate: date,
      timeWindow,
      wasteAddons,
      uploadedFiles,
      notes,
    }).catch((err) => {
      logger.error({ err }, "Telegram notification failed");
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to save booking");
    res.status(500).json({ error: "Failed to save booking" });
  }
});

export default bookingsRouter;
