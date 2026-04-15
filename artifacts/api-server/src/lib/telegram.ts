import { logger } from "./logger";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const CHAT_ID = process.env["TELEGRAM_CHAT_ID"];

export interface TelegramBooking {
  service: string;
  name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  vanSize: string;
  helpOption: string;
  estimatedPrice: string;
  estimatedTime: string;
  preferredDate: string;
  timeWindow: string;
  notes: string;
}

export async function sendBookingNotification(b: TelegramBooking): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.warn("Telegram env vars not set — skipping notification");
    return;
  }

  const text = [
    "🚚 New Booking",
    "",
    `Service: ${b.service}`,
    `Name: ${b.name}`,
    `Phone: ${b.phone}`,
    `Pickup: ${b.pickup || "—"}`,
    `Drop-off: ${b.dropoff || "—"}`,
    `Van: ${b.vanSize || "—"}`,
    `Help: ${b.helpOption || "—"}`,
    `Estimated price: ${b.estimatedPrice || "—"}`,
    `Estimated time: ${b.estimatedTime || "—"}`,
    `Preferred date: ${b.preferredDate || "—"}`,
    `Preferred time: ${b.timeWindow || "—"}`,
    `Notes: ${b.notes || "—"}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }

  logger.info({ name: b.name, service: b.service }, "Telegram notification sent");
}
