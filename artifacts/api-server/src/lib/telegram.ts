import { logger } from "./logger";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const CHAT_ID = process.env["TELEGRAM_CHAT_ID"];

export interface TelegramBooking {
  service: string;
  name: string;
  phone: string;
  contactMethod: string;
  pickup: string;
  pickupDetails: string;
  dropoff: string;
  dropoffDetails: string;
  extraAddress: string;
  vanSize: string;
  helpOption: string;
  peopleCount: string;
  estimatedPrice: string;
  estimatedTime: string;
  preferredDate: string;
  timeWindow: string;
  wasteAddons: string;
  uploadedFiles: string;
  notes: string;
}

function buildMessage(b: TelegramBooking): string {
  const line = (label: string, value: string): string | null =>
    value.trim() ? `${label}: ${value.trim()}` : null;

  const parts: (string | null)[] = [
    "🚚 New Booking",
    "",
    line("Service", b.service),
    line("Name", b.name),
    line("Phone", b.phone),
    line("Contact via", b.contactMethod),
    "",
    line("Pickup", b.pickup),
    line("Pickup details", b.pickupDetails),
    "",
    line("Drop-off", b.dropoff),
    line("Drop-off details", b.dropoffDetails),
    "",
    line("Extra address", b.extraAddress),
    "",
    line("Van", b.vanSize),
    line("Help", b.helpOption),
    line("People/helpers", b.peopleCount),
    "",
    line("Estimated price", b.estimatedPrice),
    line("Estimated time", b.estimatedTime),
    "",
    line("Preferred date", b.preferredDate),
    line("Preferred time", b.timeWindow),
    "",
    line("Waste add-ons", b.wasteAddons),
    line("Pictures", b.uploadedFiles),
    line("Notes", b.notes),
  ];

  const lines = parts
    .filter((l): l is string => l !== null)
    .reduce<string[]>((acc, l) => {
      if (l === "" && acc.at(-1) === "") return acc;
      acc.push(l);
      return acc;
    }, []);

  while (lines.at(-1) === "") lines.pop();
  while (lines[0] === "") lines.shift();

  return lines.join("\n");
}

export async function sendBookingNotification(b: TelegramBooking): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.warn("Telegram env vars not set — skipping notification");
    return;
  }

  const text = buildMessage(b);
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
