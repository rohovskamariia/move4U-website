import { Router } from "express";
import { appendBooking } from "../lib/sheets";
import { logger } from "../lib/logger";

const bookingsRouter = Router();

bookingsRouter.post("/bookings", async (req, res) => {
  try {
    const {
      service = "",
      name = "",
      phone = "",
      pickup = "",
      dropoff = "",
      vanSize = "",
      helpOption = "",
      estimatedPrice = "",
      date = "",
      notes = "",
    } = req.body as Record<string, string>;

    if (!name || !phone) {
      res.status(400).json({ error: "name and phone are required" });
      return;
    }

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

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to save booking to Google Sheets");
    res.status(500).json({ error: "Failed to save booking" });
  }
});

export default bookingsRouter;
