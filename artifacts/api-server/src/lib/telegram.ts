// ============================================================
// TELEGRAM NOTIFICATIONS
// ============================================================
// sendBookingNotification — sends the full new-booking message,
//   returns the Telegram message_id so it can be stored and edited later.
//
// editBookingMessage — edits an existing message when status changes.
//
// sendDepositNotification — short fallback if no stored message_id.
// ============================================================

import { logger } from "./logger";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const CHAT_ID   = process.env["TELEGRAM_CHAT_ID"];

const SITE_URL =
  process.env["SITE_URL"] ??
  (process.env["REPLIT_DEV_DOMAIN"]
    ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
    : "https://move4u.replit.app");

export const ADMIN_PANEL_URL = `${SITE_URL}/admin/bookings`;

// ── Shared message shape ──────────────────────────────────────

export interface TelegramBooking {
  bookingReference: string;
  service:          string;
  name:             string;
  phone:            string;
  contactMethod:    string;
  pickup:           string;
  pickupDetails:    string;
  dropoff:          string;
  dropoffDetails:   string;
  extraAddress:     string;
  vanSize:          string;
  helpOption:       string;
  peopleCount:      string;
  estimatedPrice:   string;
  estimatedTime:    string;
  preferredDate:    string;
  timeWindow:       string;
  wasteAddons:      string;
  uploadedFiles:    string;
  notes:            string;
  // Status fields — optional for new bookings, required for edits
  bookingStatus?:  string;
  paymentStatus?:  string;
  confirmedDate?:  string;
  confirmedTime?:  string;
}

// ── Message builder ───────────────────────────────────────────

function line(label: string, value: string | undefined): string | null {
  return value?.trim() ? `${label}: ${value.trim()}` : null;
}

function buildMessage(b: TelegramBooking): string {
  const status  = b.bookingStatus || "New";
  const payment = b.paymentStatus || "Unpaid";
  const payIcon = (payment.toLowerCase().includes("paid")) ? "✅" : "⏳";

  const parts: (string | null)[] = [
    `🚚 New Booking — ${b.bookingReference}`,
    "",
    line("Service",    b.service),
    line("Name",       b.name),
    line("Phone",      b.phone),
    line("Contact via",b.contactMethod),
    "",
    b.pickup        ? `📍 From: ${b.pickup}`                     : null,
    b.pickupDetails ? `   ↳ ${b.pickupDetails}`                  : null,
    b.dropoff       ? `📍 To: ${b.dropoff}`                      : null,
    b.dropoffDetails? `   ↳ ${b.dropoffDetails}`                 : null,
    b.extraAddress  ? `📍 Extra stop: ${b.extraAddress}`         : null,
    "",
    line("Van",            b.vanSize),
    line("Help",           b.helpOption),
    line("People/helpers", b.peopleCount),
    line("Estimated price",b.estimatedPrice),
    line("Estimated time", b.estimatedTime),
    "",
    line("Preferred date", b.preferredDate),
    line("Time window",    b.timeWindow),
    "",
    line("Waste add-ons",  b.wasteAddons),
    line("Notes",          b.notes),
    "",
    `📋 Status: ${status}  |  ${payIcon} Payment: ${payment}`,
    (b.confirmedDate)
      ? `📅 Confirmed: ${b.confirmedDate}${b.confirmedTime ? " at " + b.confirmedTime : ""}`
      : null,
    "",
    `🔗 Admin panel: ${ADMIN_PANEL_URL}`,
  ];

  // Collapse consecutive blank lines; strip leading/trailing blanks
  const lines = parts
    .filter((l): l is string => l !== null)
    .reduce<string[]>((acc, l) => {
      if (l === "" && acc.at(-1) === "") return acc;
      acc.push(l);
      return acc;
    }, []);

  while (lines.at(-1) === "") lines.pop();
  while (lines[0]  === "") lines.shift();

  return lines.join("\n");
}

// ── Low-level Telegram helpers ────────────────────────────────

// Sends a new message. Returns message_id on success, null on any failure.
async function tgSend(text: string): Promise<number | null> {
  if (!BOT_TOKEN || !CHAT_ID) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, "Telegram sendMessage failed");
      return null;
    }
    const data = (await res.json()) as { result?: { message_id?: number } };
    return data.result?.message_id ?? null;
  } catch (err) {
    logger.error({ err }, "Telegram sendMessage threw an error");
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────

// Sends the full booking notification.
// Returns the Telegram message_id so callers can store it for later edits.
// Returns null if Telegram is not configured or the send failed.
export async function sendBookingNotification(b: TelegramBooking): Promise<number | null> {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.warn("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skipping booking notification");
    return null;
  }

  const text = buildMessage(b);
  const messageId = await tgSend(text);

  if (messageId !== null) {
    logger.info(
      { ref: b.bookingReference, name: b.name, messageId },
      "Telegram booking notification sent",
    );
  } else {
    logger.warn(
      { ref: b.bookingReference },
      "Telegram booking notification failed — no message_id returned",
    );
  }

  return messageId;
}

// Edits an existing Telegram message (e.g. when booking status or payment changes).
// Pass the same booking data but with updated status fields.
// Returns true on success or if content was already identical.
export async function editBookingMessage(
  messageId: number,
  b: TelegramBooking,
): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false;

  const text = buildMessage(b);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    CHAT_ID,
          message_id: messageId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      // "message is not modified" is not a real error
      if (body.includes("message is not modified")) {
        logger.info({ messageId, ref: b.bookingReference }, "Telegram message already up-to-date");
        return true;
      }
      logger.warn(
        { status: res.status, body, messageId, ref: b.bookingReference },
        "Telegram editMessageText failed — falling through",
      );
      return false;
    }

    logger.info({ messageId, ref: b.bookingReference }, "Telegram message edited successfully");
    return true;
  } catch (err) {
    logger.error({ err, messageId }, "Telegram editMessageText threw an error");
    return false;
  }
}

// Short fallback notification for deposit payments when no stored message_id is available.
export async function sendDepositNotification(
  bookingRef: string,
  amount: string,
  name: string,
): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.warn("Telegram env vars not set — skipping deposit notification");
    return;
  }

  const text = `💰 Deposit received — ${bookingRef} | ${amount} | ${name}`;
  const id   = await tgSend(text);

  if (id !== null) {
    logger.info({ bookingRef, amount, name }, "Telegram deposit notification sent");
  }
}
