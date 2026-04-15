import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

let sheetId: string | null = process.env["GOOGLE_SHEET_ID"] ?? null;

const HEADERS = [
  "Timestamp",           // A
  "Service",             // B
  "Name",                // C
  "Phone",               // D
  "Pickup Address",      // E
  "Drop-off Address",    // F
  "Van Size",            // G
  "Help Option",         // H
  "Estimated Price (£)", // I
  "Date",                // J
  "Notes",               // K
  "Preferred Contact Method", // L
  "Booking Status",      // M
  "Payment Status",      // N
  "Booking Reference",   // O
];

async function createSheet(): Promise<string> {
  const res = await connectors.proxy("google-sheet", "/v4/spreadsheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      properties: { title: "Move4U Bookings" },
      sheets: [
        {
          properties: { title: "Bookings" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: HEADERS.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0.486, green: 0.231, blue: 0.929 },
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  const data = (await res.json()) as { spreadsheetId: string; spreadsheetUrl: string };
  logger.info(`Created Move4U Bookings sheet: ${data.spreadsheetUrl}`);
  logger.info(`Set GOOGLE_SHEET_ID=${data.spreadsheetId} to reuse this sheet after restarts`);
  return data.spreadsheetId;
}

let headerPatched = false;

async function ensureSheet(): Promise<string> {
  if (!sheetId) {
    sheetId = await createSheet();
    headerPatched = true; // fresh sheet already has correct headers
  }
  return sheetId;
}

// Writes new column headers (L–O) to the existing live sheet on first use each session.
// Uses a single range write so it's one API call and is safe to run repeatedly.
async function patchNewHeaders(id: string): Promise<void> {
  if (headerPatched) return;
  try {
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!L1:O1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [["Preferred Contact Method", "Booking Status", "Payment Status", "Booking Reference"]],
        }),
      },
    );
    logger.info("Patched column headers L–O on existing sheet");
  } catch (err) {
    logger.warn({ err }, "Could not patch column headers — continuing");
  }
  headerPatched = true;
}

export interface BookingRow {
  service: string;
  name: string;
  phone: string;
  contactMethod: string;
  pickup: string;
  dropoff: string;
  vanSize: string;
  helpOption: string;
  estimatedPrice: string;
  date: string;
  notes: string;
}

export async function appendBooking(row: BookingRow): Promise<void> {
  const id = await ensureSheet();
  await patchNewHeaders(id);
  const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const values = [
    [
      timestamp,        // A – Timestamp
      row.service,      // B – Service
      row.name,         // C – Name
      row.phone,        // D – Phone
      row.pickup,       // E – Pickup Address
      row.dropoff,      // F – Drop-off Address
      row.vanSize,      // G – Van Size
      row.helpOption,   // H – Help Option
      row.estimatedPrice, // I – Estimated Price (£)
      row.date,         // J – Date
      row.notes,        // K – Notes
      row.contactMethod,  // L – Preferred Contact Method
      "New",            // M – Booking Status
      "Unpaid",         // N – Payment Status
      "",               // O – Booking Reference (set later)
    ],
  ];

  await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${id}/values/Bookings!A:O:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );

  logger.info({ name: row.name, service: row.service }, "Booking appended to Google Sheets");
}
