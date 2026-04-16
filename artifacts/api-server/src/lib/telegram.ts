// ============================================================
// TELEGRAM NOTIFICATIONS
// ============================================================
// sendBookingNotification — sends the full new-booking message,
//   returns the Telegram message_id so it can be stored and edited later.
//
// editBookingMessage — edits an existing message when status changes.
//
// sendDepositNotification — short fallback if no stored message_id.
//
// testTelegram — sends a one-line test message; used by GET /api/test-telegram.
// ============================================================

import { logger } from "./logger";

// ── Read credentials lazily (inside each function) so that env vars set after
// module load are always picked up correctly. Never read at module scope.
function getCredentials(): { botToken: string | undefined; chatId: string | undefined } {
  return {
    botToken: process.env["TELEGRAM_BOT_TOKEN"],
    chatId:   process.env["TELEGRAM_CHAT_ID"],
  };
}

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

export interface TgSendResult {
  ok: boolean;
  messageId: number | null;
  httpStatus: number | null;
  responseBody: string | null;
  error: string | null;
}

// Sends a new message. Returns a rich result object for debugging.
async function tgSend(text: string): Promise<TgSendResult> {
  const { botToken, chatId } = getCredentials();

  logger.info(
    {
      botTokenPresent: !!botToken,
      chatIdPresent:   !!chatId,
      chatId:          chatId ?? "(not set)",
    },
    "tgSend: starting Telegram sendMessage",
  );

  if (!botToken) {
    logger.error("tgSend: TELEGRAM_BOT_TOKEN is not set — cannot send");
    return { ok: false, messageId: null, httpStatus: null, responseBody: null, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  if (!chatId) {
    logger.error("tgSend: TELEGRAM_CHAT_ID is not set — cannot send");
    return { ok: false, messageId: null, httpStatus: null, responseBody: null, error: "TELEGRAM_CHAT_ID not set" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );

    const responseBody = await res.text();
    logger.info(
      { httpStatus: res.status, responseBody },
      "tgSend: received Telegram API response",
    );

    if (!res.ok) {
      logger.error(
        { httpStatus: res.status, responseBody },
        "tgSend: Telegram API returned non-OK status",
      );
      return { ok: false, messageId: null, httpStatus: res.status, responseBody, error: `Telegram API error ${res.status}: ${responseBody}` };
    }

    let parsed: { result?: { message_id?: number } };
    try {
      parsed = JSON.parse(responseBody) as typeof parsed;
    } catch {
      logger.error({ responseBody }, "tgSend: failed to parse Telegram response JSON");
      return { ok: false, messageId: null, httpStatus: res.status, responseBody, error: "Failed to parse response JSON" };
    }

    const messageId = parsed.result?.message_id ?? null;
    logger.info({ messageId }, "tgSend: message sent successfully");
    return { ok: true, messageId, httpStatus: res.status, responseBody, error: null };

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "tgSend: fetch threw an exception");
    return { ok: false, messageId: null, httpStatus: null, responseBody: null, error: errMsg };
  }
}

// ── Public API ────────────────────────────────────────────────

// Sends the full booking notification.
// Returns the Telegram message_id so callers can store it for later edits.
// Returns null if Telegram is not configured or the send failed.
export async function sendBookingNotification(b: TelegramBooking): Promise<number | null> {
  const { botToken, chatId } = getCredentials();

  logger.info(
    {
      ref:             b.bookingReference,
      botTokenPresent: !!botToken,
      chatIdPresent:   !!chatId,
      chatId:          chatId ?? "(not set)",
    },
    "sendBookingNotification: called",
  );

  if (!botToken || !chatId) {
    logger.warn(
      {
        botTokenPresent: !!botToken,
        chatIdPresent:   !!chatId,
      },
      "sendBookingNotification: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping",
    );
    return null;
  }

  const text = buildMessage(b);
  const result = await tgSend(text);

  if (result.ok && result.messageId !== null) {
    logger.info(
      { ref: b.bookingReference, name: b.name, messageId: result.messageId },
      "sendBookingNotification: Telegram booking notification sent",
    );
  } else {
    logger.warn(
      { ref: b.bookingReference, error: result.error, responseBody: result.responseBody },
      "sendBookingNotification: Telegram booking notification failed",
    );
  }

  return result.messageId;
}

// Sends a plain test message. Returns the full result for caller to inspect.
export async function testTelegram(): Promise<TgSendResult> {
  const { botToken, chatId } = getCredentials();

  logger.info(
    {
      botTokenPresent: !!botToken,
      chatIdPresent:   !!chatId,
      chatId:          chatId ?? "(not set)",
    },
    "testTelegram: called",
  );

  if (!botToken || !chatId) {
    const error = !botToken && !chatId
      ? "Both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are missing"
      : !botToken
        ? "TELEGRAM_BOT_TOKEN is missing"
        : "TELEGRAM_CHAT_ID is missing";
    logger.error({ botTokenPresent: !!botToken, chatIdPresent: !!chatId }, `testTelegram: ${error}`);
    return { ok: false, messageId: null, httpStatus: null, responseBody: null, error };
  }

  return tgSend("✅ Telegram test message from Move4U");
}

// Edits an existing Telegram message (e.g. when booking status or payment changes).
// Pass the same booking data but with updated status fields.
// Returns true on success or if content was already identical.
export async function editBookingMessage(
  messageId: number,
  b: TelegramBooking,
): Promise<boolean> {
  const { botToken, chatId } = getCredentials();
  if (!botToken || !chatId) return false;

  const text = buildMessage(b);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/editMessageText`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    chatId,
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
  const { botToken, chatId } = getCredentials();
  if (!botToken || !chatId) {
    logger.warn("Telegram env vars not set — skipping deposit notification");
    return;
  }

  const result = await tgSend(`💰 Deposit received — ${bookingRef} | ${amount} | ${name}`);
  if (result.ok) {
    logger.info({ bookingRef, amount, name }, "Telegram deposit notification sent");
  }
}
