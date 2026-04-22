import { Router } from "express";
import { appendBooking, updateBookingAdmin } from "../lib/sheets";
import { sendBookingNotification } from "../lib/telegram";
import { logger } from "../lib/logger";

const bookingsRouter = Router();

bookingsRouter.post("/bookings", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const str = (k: string): string =>
      typeof body[k] === "string" ? (body[k] as string) : "";
    const arr = (k: string): string[] =>
      Array.isArray(body[k])
        ? (body[k] as unknown[]).map((v) => String(v ?? "").trim()).filter(Boolean)
        : [];

    const service          = str("service");
    const name             = str("name");
    const phone            = str("phone");
    const email            = str("email");
    const rawContactMethod = str("contactMethod");
    const pickup           = str("pickup");
    const pickupDetails    = str("pickupDetails");
    const dropoff          = str("dropoff");
    const dropoffDetails   = str("dropoffDetails");
    const rawExtraAddress  = str("extraAddress");
    const extraStops       = arr("extraStops");
    const vanSize          = str("vanSize");
    const helpOption       = str("helpOption");
    const peopleCount      = str("peopleCount");
    const estimatedPrice   = str("estimatedPrice");
    const estimatedTime    = str("estimatedTime");
    const date             = str("date");
    const timeWindow       = str("timeWindow");
    const wasteAddons      = str("wasteAddons");
    const uploadedFiles    = str("uploadedFiles");
    const rawNotes         = str("notes");

    // Numbered, human-readable summary of intermediate route stops.
    // Used both in the Sheets notes column AND as the canonical extraAddress
    // string so any consumer that only reads one field still sees them.
    const extraStopsLine = extraStops.length > 0
      ? extraStops.map((s, i) => `${i + 1}. ${s}`).join(" | ")
      : rawExtraAddress;

    // Surface the email inside the existing contactMethod label and notes
    // so it shows up in Sheets and Telegram without a schema change.
    const contactMethod = email
      ? `${rawContactMethod || "Any"} — ${email}`
      : rawContactMethod;

    // Compose the Sheets `notes` column so it carries everything the team
    // needs without altering the spreadsheet schema:
    //   [Email:] [Extra stops: 1. ... | 2. ...] [free-form notes]
    const notesParts: string[] = [];
    if (email) notesParts.push(`Email: ${email}`);
    if (extraStops.length > 0) {
      notesParts.push(`Extra stops (${extraStops.length}): ${extraStopsLine}`);
    }
    if (rawNotes) notesParts.push(rawNotes);
    const notes = notesParts.join(" | ");

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

    // Debug trace — explicitly tie this submission's payload to the new
    // booking reference so any cross-booking data leakage is impossible to
    // miss in the logs (photo URLs, agreed price, customer name).
    logger.info(
      {
        bookingReference,
        name,
        phone,
        estimatedPrice,
        photoCount: uploadedFiles
          ? uploadedFiles.split(",").filter((u) => u.trim()).length
          : 0,
        extraStopsCount: extraStops.length,
      },
      "Booking received — data bound to this booking reference only",
    );

    // 2. Respond immediately — don't block on photo storage or Telegram
    res.json({ success: true, bookingReference });

    // 3. Persist the customer's preferred time window to column X, plus any
    //    uploaded photo URLs to column W. Both are fire-and-forget — they
    //    must not block the customer's confirmation response. The append
    //    above only writes columns A:O, so anything outside that range is
    //    written here as a follow-up update keyed by booking reference.
    const followUp: Parameters<typeof updateBookingAdmin>[1] = {};
    if (timeWindow) followUp.preferredTime = timeWindow;
    if (uploadedFiles) followUp.photoUrls = uploadedFiles;
    if (Object.keys(followUp).length > 0) {
      updateBookingAdmin(bookingReference, followUp).catch((err) =>
        logger.error({ err, bookingReference }, "Failed to save follow-up booking fields to Sheets"),
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
      extraAddress: extraStopsLine, extraStops,
      vanSize, helpOption,
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
