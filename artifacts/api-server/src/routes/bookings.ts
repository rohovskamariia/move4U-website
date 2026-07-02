import { Router } from "express";
import { appendBooking, updateBookingByRow, updateBookingAdmin } from "../lib/sheets";
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
    const duration         = str("duration");
    const hourlyRate       = str("hourlyRate");
    const baseCharge       = str("baseCharge");
    const stairsCharge     = str("stairsCharge");
    const extraStopCharge  = str("extraStopCharge");
    const congestionCharge = str("congestionCharge");
    const outsideM25Charge = str("outsideM25Charge");

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

    // 1. Save to Google Sheets — appends a new row and returns BOTH the
    //    generated booking reference AND the exact 1-based sheet row that
    //    was assigned. The sheetRow is critical: every follow-up write
    //    below uses it directly, so photos / time-window / Telegram message
    //    ID can never land on the wrong booking even if a second submission
    //    arrived a millisecond later.
    const { bookingRef: bookingReference, sheetRow } = await appendBooking({
      service, name, phone, contactMethod,
      pickup, dropoff, vanSize, helpOption,
      estimatedPrice, date, notes,
    });

    // Debug trace — explicitly tie this submission's payload to the new
    // booking reference AND row so any cross-booking data leakage would
    // be obvious in the logs.
    logger.info(
      {
        bookingReference,
        sheetRow,
        name,
        phone,
        estimatedPrice,
        photoCount: uploadedFiles
          ? uploadedFiles.split(",").filter((u) => u.trim()).length
          : 0,
        extraStopsCount: extraStops.length,
      },
      "Booking received — data bound to this booking reference AND row only",
    );

    // 2. Respond immediately — don't block on photo storage or Telegram
    res.json({ success: true, bookingReference });

    // 3. Persist the customer's preferred time window to column X, plus any
    //    uploaded photo URLs to column W. Both are fire-and-forget — they
    //    must not block the customer's confirmation response. The append
    //    above only writes columns A:O, so anything outside that range is
    //    written here as a follow-up update.
    //
    //    We write BY ROW (not by ref lookup) so the photos/time-window
    //    cannot possibly be attached to a different booking, even in the
    //    extremely unlikely event of a duplicate ref.
    const followUp: Parameters<typeof updateBookingByRow>[1] = {};
    if (timeWindow)       followUp.preferredTime      = timeWindow;
    if (uploadedFiles)    followUp.photoUrls           = uploadedFiles;
    // Price breakdown + route detail columns AB–AM
    if (pickupDetails)    followUp.pickupFloorDetail   = pickupDetails;
    if (dropoffDetails)   followUp.dropoffFloorDetail  = dropoffDetails;
    if (extraStops[0])    followUp.extraStop1           = extraStops[0];
    if (extraStops[1])    followUp.extraStop2           = extraStops[1];
    if (extraStops[2])    followUp.extraStop3           = extraStops[2];
    if (duration)         followUp.duration             = duration;
    if (hourlyRate)       followUp.hourlyRate           = hourlyRate;
    if (baseCharge)       followUp.baseCharge           = baseCharge;
    if (stairsCharge)     followUp.stairsCharge         = stairsCharge;
    if (extraStopCharge)  followUp.extraStopCharge      = extraStopCharge;
    if (congestionCharge) followUp.congestionCharge     = congestionCharge;
    if (outsideM25Charge) followUp.outsideM25Charge     = outsideM25Charge;
    if (Object.keys(followUp).length > 0) {
      if (sheetRow >= 2) {
        updateBookingByRow(sheetRow, followUp).catch((err) =>
          logger.error({ err, bookingReference, sheetRow }, "Failed to save follow-up booking fields to Sheets (by row)"),
        );
      } else {
        // Fallback: append response didn't return a row — fall back to
        // ref-based lookup so we still try to save photos/time-window.
        logger.warn({ bookingReference }, "No sheetRow from append — falling back to ref lookup for follow-up");
        updateBookingAdmin(bookingReference, followUp).catch((err) =>
          logger.error({ err, bookingReference }, "Failed to save follow-up booking fields to Sheets (by ref)"),
        );
      }
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
            // Write by row — same safety reasoning as photo URLs above.
            if (sheetRow >= 2) {
              await updateBookingByRow(sheetRow, {
                telegramMessageId: String(messageId),
              });
            } else {
              await updateBookingAdmin(bookingReference, {
                telegramMessageId: String(messageId),
              });
            }
            logger.info(
              { bookingReference, sheetRow, messageId },
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
