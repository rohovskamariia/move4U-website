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

// Must match the deployed domain. Set SITE_URL env var to override.
// Do NOT fall back to REPLIT_DEV_DOMAIN — that is the dev-preview URL.
const SITE_URL = process.env["SITE_URL"] ?? "https://move4u.uk";

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
  /** Optional ordered list of intermediate route stops between pickup and drop-off. */
  extraStops?:      string[];
  vanSize:          string;
  helpOption:       string;
  peopleCount:      string;
  estimatedPrice:   string;
  estimatedTime:    string;
  preferredDate:    string;
  timeWindow:       string;
  wasteAddons:      string;
  uploadedFiles:    string; // comma-separated photo serving URLs
  notes:            string;
  // Status fields — optional for new bookings, required for edits
  bookingStatus?:  string;
  paymentStatus?:  string;
  confirmedDate?:  string;
  confirmedTime?:  string;
  // Price breakdown — optional, surfaced when available
  duration?:         string;
  hourlyRate?:       string;
  baseCharge?:       string;
  stairsCharge?:     string;
  extraStopCharge?:  string;
  congestionCharge?: string;
  outsideM25Charge?: string;
  // Admin-edit context
  agreedQuote?:        string;
  depositAmount?:      string;
  remainingBalance?:   string;
  changedFields?:      string[];
  // Admin-managed extra stops/charges (JSON strings)
  adminExtraStops?:   string;
  adminExtraCharges?: string;
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
    b.pickup        ? `📍 Pickup: ${b.pickup}`                   : null,
    b.pickupDetails ? `   ↳ ${b.pickupDetails}`                  : null,
    // Extra stops — render between pickup and final destination so the
    // Telegram message reads as the actual route order.
    ...(() => {
      const stops = (b.extraStops ?? [])
        .map((s) => (s ?? "").trim())
        .filter(Boolean);
      // Backward compat: if the array is empty but the legacy single
      // field carries content, parse it back into stops.
      if (stops.length === 0 && b.extraAddress?.trim()) {
        const parts = b.extraAddress
          .split(/[;|]|\d+\.\s*/g)
          .map((s) => s.trim())
          .filter(Boolean);
        stops.push(...parts);
      }
      if (stops.length === 0) return [];
      const header = `📍 Extra stops (${stops.length}):`;
      const rows   = stops.map((s, i) => `   ${i + 1}. ${s}`);
      return [header, ...rows];
    })(),
    b.dropoff       ? `📍 Final destination: ${b.dropoff}`       : null,
    b.dropoffDetails? `   ↳ ${b.dropoffDetails}`                 : null,
    "",
    line("Van",            b.vanSize),
    line("Help",           b.helpOption),
    line("People/helpers", b.peopleCount),
    line("Estimated price",b.estimatedPrice),
    line("Estimated time", b.estimatedTime),
    // Price breakdown block — only shown when breakdown fields are present
    ...(() => {
      const bd: string[] = [];
      if (b.duration)         bd.push(`Duration: ${b.duration}`);
      if (b.hourlyRate)       bd.push(`Hourly rate: ${b.hourlyRate}`);
      if (b.baseCharge)       bd.push(`Base charge: ${b.baseCharge}`);
      if (b.stairsCharge)     bd.push(`Stairs/floor: +${b.stairsCharge}`);
      if (b.extraStopCharge)  bd.push(`Extra stop fees: +${b.extraStopCharge}`);
      if (b.congestionCharge) bd.push(`Congestion charge: +${b.congestionCharge}`);
      if (b.outsideM25Charge) bd.push(`Outside M25 (est.): +${b.outsideM25Charge}`);
      if (b.agreedQuote)      bd.push(`Agreed quote: £${b.agreedQuote}`);
      if (b.depositAmount)    bd.push(`Deposit: £${b.depositAmount}`);
      if (b.remainingBalance) bd.push(`Remaining balance: £${b.remainingBalance}`);
      if (bd.length === 0) return [];
      return ["", "💰 Breakdown:", ...bd.map((l) => `   ${l}`)];
    })(),
    "",
    line("Preferred date", b.preferredDate),
    line("Time window",    b.timeWindow),
    "",
    line("Waste add-ons",  b.wasteAddons),
    line("Notes",          b.notes),
    "",
    // Photo links — each on its own line, fully qualified with the site URL
    ...(() => {
      if (!b.uploadedFiles?.trim()) return [];
      const photoUrls = b.uploadedFiles.split(",").map((u) => u.trim()).filter(Boolean);
      if (photoUrls.length === 0) return [];
      const photoLines = photoUrls.map((url, i) => {
        const fullUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
        return `📷 Photo ${i + 1}: ${fullUrl}`;
      });
      return ["", `🖼 Photos (${photoUrls.length}):`, ...photoLines];
    })(),
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

// ── Invoice notifications ──────────────────────────────────────

export interface InvoiceCreatedPayload {
  bookingRef: string;
  invoiceType: string;
  amountFormatted: string;
  customerName: string;
  agreedQuote: string;
  depositAmount: string;
  remainingBalance: string;
  paymentStatus: string;
  invoiceUrl: string;
  emailSent: boolean;
}

export async function sendInvoiceCreatedNotification(p: InvoiceCreatedPayload): Promise<void> {
  const typeLabel = p.invoiceType === "deposit" ? "Deposit"
    : p.invoiceType === "full" ? "Full payment" : "Remaining balance";

  const lines = [
    `🧾 Invoice created — ${p.bookingRef}`,
    `Type: ${typeLabel}`,
    `Amount: ${p.amountFormatted}`,
    p.customerName ? `Customer: ${p.customerName}` : null,
    `Agreed Quote: ${p.agreedQuote}`,
    `Deposit: ${p.depositAmount}`,
    `Remaining: ${p.remainingBalance}`,
    `Payment Status: ${p.paymentStatus}`,
    p.emailSent ? "📧 Invoice sent by email" : "⚠️ No email — copy link to send manually",
    p.invoiceUrl ? `🔗 Invoice: ${p.invoiceUrl}` : null,
    `🔗 Admin panel: ${ADMIN_PANEL_URL}`,
  ].filter((l): l is string => l !== null).join("\n");

  const { botToken, chatId } = getCredentials();
  if (!botToken || !chatId) return;
  await tgSend(lines);
}

export interface InvoicePaymentPayload {
  bookingRef: string;
  invoiceType: string;
  amountFormatted: string;
  agreedQuote: string;
  depositAmount: string;
  remainingBalance: string;
  paymentStatus: string;
  paid: boolean; // true = paid, false = failed
}

export async function sendInvoicePaymentNotification(p: InvoicePaymentPayload): Promise<void> {
  const typeLabel = p.invoiceType === "deposit" ? "Deposit"
    : p.invoiceType === "full" ? "Full payment" : "Remaining balance";
  const icon = p.paid ? "✅" : "❌";
  const event = p.paid ? "Invoice paid" : "Invoice payment failed";

  const lines = [
    `${icon} ${event} — ${p.bookingRef}`,
    `Type: ${typeLabel}`,
    `Amount: ${p.amountFormatted}`,
    `Agreed Quote: ${p.agreedQuote}`,
    `Deposit: ${p.depositAmount}`,
    `Remaining: ${p.remainingBalance}`,
    `Payment Status: ${p.paymentStatus}`,
    `🔗 Admin panel: ${ADMIN_PANEL_URL}`,
  ].join("\n");

  const { botToken, chatId } = getCredentials();
  if (!botToken || !chatId) return;
  await tgSend(lines);
}

// ── Admin update notification ─────────────────────────────────
//
// Sends a NEW Telegram message (never edits the original) when an admin
// saves changes to a booking. Shows the full current booking state plus
// a summary of which fields changed.
export async function sendBookingUpdateNotification(b: TelegramBooking): Promise<void> {
  const { botToken, chatId } = getCredentials();
  if (!botToken || !chatId) return;

  const status  = b.bookingStatus || "New";
  const payment = b.paymentStatus || "Unpaid";
  const payIcon = payment.toLowerCase().includes("paid") ? "✅" : "⏳";

  const changedSummary = b.changedFields?.length
    ? `Changed: ${b.changedFields.join(", ")}`
    : "";

  // Parse admin-managed extra stops and charges (stored as JSON)
  type ExtraStop   = { address: string; charge: string; notes: string };
  type ExtraCharge = { type: string; amount: string; notes: string };
  const extraStops: ExtraStop[] = (() => {
    try { return JSON.parse(b.adminExtraStops || "[]") as ExtraStop[]; } catch { return []; }
  })().filter((s) => s.address);
  const extraCharges: ExtraCharge[] = (() => {
    try { return JSON.parse(b.adminExtraCharges || "[]") as ExtraCharge[]; } catch { return []; }
  })().filter((c) => c.type && c.amount);

  // Price breakdown
  const agreedNum  = parseFloat(b.agreedQuote || "0");
  const stopsTotal = extraStops.reduce((s, x) => s + parseFloat(x.charge || "0"), 0);
  const chargesTotal = extraCharges.reduce((s, x) => s + parseFloat(x.amount || "0"), 0);
  const base = agreedNum > 0 ? agreedNum - stopsTotal - chargesTotal : 0;

  const parts: (string | null)[] = [
    `✏️ Booking Updated — ${b.bookingReference}`,
    changedSummary ? `\n${changedSummary}` : null,
    "",
    line("Service", b.service),
    line("Name",    b.name),
    line("Phone",   b.phone),
    "",
    b.pickup  ? `📍 From: ${b.pickup}`  : null,
    // Extra stops between pickup and drop-off
    ...extraStops.map((s, i) =>
      `📍 Stop ${i + 1}: ${s.address}${s.charge ? ` (+£${s.charge})` : ""}${s.notes ? ` — ${s.notes}` : ""}`,
    ),
    b.dropoff ? `📍 To:   ${b.dropoff}` : null,
    "",
    line("Van",      b.vanSize),
    line("Help",     b.helpOption),
    b.estimatedTime ? `Duration: ${b.estimatedTime}` : null,
    "",
    // Price breakdown block
    ...(() => {
      const rows: string[] = [];
      if (agreedNum > 0) {
        rows.push("💰 Price breakdown:");
        if (base > 0)          rows.push(`   Base:         £${base.toFixed(2)}`);
        if (stopsTotal > 0)    rows.push(`   Extra stops:  £${stopsTotal.toFixed(2)}`);
        if (chargesTotal > 0)  rows.push(`   Extra charges:£${chargesTotal.toFixed(2)}`);
        rows.push(`   Agreed total: £${agreedNum.toFixed(2)}`);
        if (b.depositAmount)   rows.push(`   Deposit paid: £${parseFloat(b.depositAmount).toFixed(2)}`);
        if (b.remainingBalance) rows.push(`   Remaining:    £${parseFloat(b.remainingBalance).toFixed(2)}`);
      } else {
        if (b.depositAmount)    rows.push(`Deposit: £${b.depositAmount}`);
        if (b.remainingBalance) rows.push(`Remaining: £${b.remainingBalance}`);
      }
      // Extra charges detail
      if (extraCharges.length > 0) {
        rows.push("💸 Extra charges:");
        extraCharges.forEach((c) =>
          rows.push(`   ${c.type}: £${c.amount}${c.notes ? ` (${c.notes})` : ""}`),
        );
      }
      return rows.length ? ["", ...rows] : [];
    })(),
    "",
    `📋 Status: ${status}  |  ${payIcon} Payment: ${payment}`,
    b.confirmedDate
      ? `📅 Confirmed: ${b.confirmedDate}${b.confirmedTime ? " at " + b.confirmedTime : ""}`
      : null,
    b.notes ? `📝 Notes: ${b.notes}` : null,
    "",
    `🔗 Admin panel: ${ADMIN_PANEL_URL}`,
  ];

  const lines = parts
    .filter((l): l is string => l !== null)
    .reduce<string[]>((acc, l) => {
      if (l === "" && acc.at(-1) === "") return acc;
      acc.push(l);
      return acc;
    }, []);

  while (lines.at(-1) === "") lines.pop();
  while (lines[0]   === "") lines.shift();

  const result = await tgSend(lines.join("\n"));
  if (result.ok) {
    logger.info({ ref: b.bookingReference }, "Admin booking update notification sent to Telegram");
  } else {
    logger.warn({ ref: b.bookingReference, error: result.error }, "Admin update Telegram notification failed");
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
