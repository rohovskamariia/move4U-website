import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

let sheetId: string | null = process.env["GOOGLE_SHEET_ID"] ?? null;

const HEADERS = [
  "Timestamp",
  "Service",
  "Name",
  "Phone",
  "Pickup Address",
  "Drop-off Address",
  "Van Size",
  "Help Option",
  "Estimated Price (£)",
  "Date",
  "Notes",
  "Preferred Contact Method",
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

// Writes the "Preferred Contact Method" header to L1 on the existing sheet
// if it hasn't been written yet this session. Safe to call on every startup.
async function patchContactMethodHeader(id: string): Promise<void> {
  if (headerPatched) return;
  try {
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!L1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [["Preferred Contact Method"]] }),
      },
    );
    logger.info("Patched Preferred Contact Method header in column L");
  } catch (err) {
    logger.warn({ err }, "Could not patch column L header — continuing");
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
  await patchContactMethodHeader(id);
  const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const values = [
    [
      timestamp,
      row.service,
      row.name,
      row.phone,
      row.pickup,
      row.dropoff,
      row.vanSize,
      row.helpOption,
      row.estimatedPrice,
      row.date,
      row.notes,
      row.contactMethod,
    ],
  ];

  await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${id}/values/Bookings!A:L:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );

  logger.info({ name: row.name, service: row.service }, "Booking appended to Google Sheets");
}
