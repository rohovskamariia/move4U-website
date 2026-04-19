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

// Writes column headers L–O to the existing live sheet on first use each session.
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

// Generates a unique sequential booking reference like MV4U-1001, MV4U-1002, …
//
// Strategy:
//   1. Read column O, parse every existing MV4U-#### value, find the MAX numeric
//      suffix and return max+1. This is robust against missing rows, blanks,
//      header rows, and rows without a reference.
//   2. Track the last-issued reference in this process so two simultaneous
//      submissions in the same Node process never collide between Sheets reads
//      and the eventual append (the Sheets read is eventually-consistent and
//      can lag the previous append by a few hundred ms).
//   3. Serialize calls through `inflightRefGen` so concurrent submissions
//      compute their refs one after the other, not in parallel.
//   4. If the Sheets read fails entirely, fall back to a timestamp+random
//      suffix that is guaranteed unique within the process.
let lastIssuedRefNumber = 0;
let inflightRefGen: Promise<string> = Promise.resolve("");

async function computeNextBookingRef(id: string): Promise<string> {
  try {
    const res = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!O:O`,
    );
    const data = (await res.json()) as { values?: string[][] };
    const rows = data.values ?? [];

    // Parse the trailing number from each MV4U-#### cell and take the max.
    let maxRef = 1000; // so the first booking becomes MV4U-1001
    for (const row of rows) {
      const cell = row?.[0];
      if (typeof cell !== "string") continue;
      const m = cell.match(/^MV4U-(\d+)$/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxRef) maxRef = n;
    }

    // Guarantee monotonic increase even if the Sheets read is stale relative
    // to a previous append from this process.
    const next = Math.max(maxRef + 1, lastIssuedRefNumber + 1);
    lastIssuedRefNumber = next;
    return `MV4U-${next}`;
  } catch (err) {
    logger.warn({ err }, "Could not read column O for booking reference — using fallback");
    // Fallback: timestamp-based reference, guaranteed unique within the process.
    const fallbackBase = Math.max(
      lastIssuedRefNumber + 1,
      1001 + (Math.floor(Date.now() / 1000) % 100000),
    );
    lastIssuedRefNumber = fallbackBase;
    return `MV4U-${fallbackBase}`;
  }
}

async function getNextBookingRef(id: string): Promise<string> {
  // Chain so concurrent calls run serially and never compute the same ref.
  const next = inflightRefGen.then(() => computeNextBookingRef(id));
  // Swallow rejections in the chain so one failure doesn't poison subsequent calls.
  inflightRefGen = next.catch(() => "");
  return next;
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

// Finds a row by booking reference (column O) and updates its Payment Status (column N).
// Returns true if the row was found and updated, false if not found.
export async function updatePaymentStatus(bookingRef: string, status: string): Promise<boolean> {
  try {
    const id = await ensureSheet();

    // Read all values in column O to find the matching row
    const res = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!O:O`,
    );
    const data = (await res.json()) as { values?: string[][] };
    const rows = data.values ?? [];

    // Find the 0-based array index of the booking reference
    const rowIndex = rows.findIndex((row) => row[0] === bookingRef);
    if (rowIndex === -1) {
      logger.warn({ bookingRef }, "Booking reference not found in sheet — cannot update payment status");
      return false;
    }

    // Convert to 1-based Sheets row number
    const sheetRow = rowIndex + 1;

    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!N${sheetRow}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[status]] }),
      },
    );

    logger.info({ bookingRef, status, sheetRow }, "Payment status updated in Google Sheets");
    return true;
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to update payment status in Google Sheets");
    return false;
  }
}

// ── Admin columns P–U ─────────────────────────────────────────────────────────

const ADMIN_HEADER_ROW = [
  "Agreed Quote",        // P
  "Deposit Amount",      // Q
  "Confirmed Date",      // R
  "Confirmed Time",      // S
  "Driver Notes",        // T
  "Payment Link",        // U
  "Telegram Message ID", // V
  "Photos",              // W
];

let adminHeaderPatched = false;

async function patchAdminHeaders(id: string): Promise<void> {
  if (adminHeaderPatched) return;
  try {
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!P1:W1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [ADMIN_HEADER_ROW] }),
      },
    );
    logger.info("Patched admin column headers P–W");
  } catch (err) {
    logger.warn({ err }, "Could not patch admin column headers — continuing");
  }
  adminHeaderPatched = true;
}

export interface BookingRecord {
  rowNumber: number; // 1-based sheet row number
  timestamp: string;
  service: string;
  name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  vanSize: string;
  helpOption: string;
  estimatedPrice: string;
  date: string;
  notes: string;
  contactMethod: string;
  bookingStatus: string;
  paymentStatus: string;
  bookingReference: string;
  // Admin fields
  agreedQuote: string;
  depositAmount: string;
  confirmedDate: string;
  confirmedTime: string;
  driverNotes: string;
  paymentLink: string;
  telegramMessageId: string; // V — stored so status updates can edit the same message
  photoUrls: string;         // W — comma-separated serving URLs for uploaded photos
}

export async function getAllBookings(): Promise<BookingRecord[]> {
  const id = await ensureSheet();
  await patchAdminHeaders(id);

  const res = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${id}/values/Bookings!A:W`,
  );
  const data = (await res.json()) as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length <= 1) return [];

  return rows
    .slice(1) // skip header
    .map((row, i) => ({
      rowNumber:         i + 2,
      timestamp:         row[0]  ?? "",
      service:           row[1]  ?? "",
      name:              row[2]  ?? "",
      phone:             row[3]  ?? "",
      pickup:            row[4]  ?? "",
      dropoff:           row[5]  ?? "",
      vanSize:           row[6]  ?? "",
      helpOption:        row[7]  ?? "",
      estimatedPrice:    row[8]  ?? "",
      date:              row[9]  ?? "",
      notes:             row[10] ?? "",
      contactMethod:     row[11] ?? "",
      bookingStatus:     row[12] ?? "",
      paymentStatus:     row[13] ?? "",
      bookingReference:  row[14] ?? "",
      agreedQuote:       row[15] ?? "",
      depositAmount:     row[16] ?? "",
      confirmedDate:     row[17] ?? "",
      confirmedTime:     row[18] ?? "",
      driverNotes:       row[19] ?? "",
      paymentLink:       row[20] ?? "",
      telegramMessageId: row[21] ?? "",
      photoUrls:         row[22] ?? "",
    }))
    .filter((b) => b.bookingReference)
    .reverse(); // newest first
}

export interface BookingAdminUpdate {
  bookingStatus?:     string;
  paymentStatus?:     string;
  agreedQuote?:       string;
  depositAmount?:     string;
  confirmedDate?:     string;
  confirmedTime?:     string;
  driverNotes?:       string;
  paymentLink?:       string;
  telegramMessageId?: string; // column V
  photoUrls?:         string; // column W — comma-separated photo serving URLs
}

// Updates admin-editable fields for a booking identified by its reference.
export async function updateBookingAdmin(
  bookingRef: string,
  fields: BookingAdminUpdate,
): Promise<boolean> {
  try {
    const id = await ensureSheet();

    // Locate row via column O
    const refRes = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!O:O`,
    );
    const refData = (await refRes.json()) as { values?: string[][] };
    const rowIndex = (refData.values ?? []).findIndex((r) => r[0] === bookingRef);
    if (rowIndex === -1) {
      logger.warn({ bookingRef }, "Booking not found for admin update");
      return false;
    }
    const sheetRow = rowIndex + 1;

    const c = (col: string) => `Bookings!${col}${sheetRow}`;
    const updates: Array<{ range: string; values: string[][] }> = [];

    if (fields.bookingStatus  !== undefined) updates.push({ range: c("M"), values: [[fields.bookingStatus]] });
    if (fields.paymentStatus  !== undefined) updates.push({ range: c("N"), values: [[fields.paymentStatus]] });
    if (fields.agreedQuote    !== undefined) updates.push({ range: c("P"), values: [[fields.agreedQuote]] });
    if (fields.depositAmount  !== undefined) updates.push({ range: c("Q"), values: [[fields.depositAmount]] });
    if (fields.confirmedDate  !== undefined) updates.push({ range: c("R"), values: [[fields.confirmedDate]] });
    if (fields.confirmedTime  !== undefined) updates.push({ range: c("S"), values: [[fields.confirmedTime]] });
    if (fields.driverNotes    !== undefined) updates.push({ range: c("T"), values: [[fields.driverNotes]] });
    if (fields.paymentLink        !== undefined) updates.push({ range: c("U"), values: [[fields.paymentLink]] });
    if (fields.telegramMessageId  !== undefined) updates.push({ range: c("V"), values: [[fields.telegramMessageId]] });
    if (fields.photoUrls          !== undefined) updates.push({ range: c("W"), values: [[fields.photoUrls]] });

    if (updates.length === 0) return true;

    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values:batchUpdate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
      },
    );

    logger.info({ bookingRef, fields: Object.keys(fields) }, "Admin booking update saved to Sheets");
    return true;
  } catch (err) {
    logger.error({ err, bookingRef }, "Failed to save admin booking update");
    return false;
  }
}

// Fetches a single booking by its reference (column O). Returns null if not found.
export async function getBookingByRef(bookingRef: string): Promise<BookingRecord | null> {
  const all = await getAllBookings();
  return all.find((b) => b.bookingReference === bookingRef) ?? null;
}

// Returns the generated booking reference so the route can send it to Telegram and the client.
export async function appendBooking(row: BookingRow): Promise<string> {
  const id = await ensureSheet();
  await patchNewHeaders(id);

  const bookingRef = await getNextBookingRef(id);
  const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const values = [
    [
      timestamp,          // A – Timestamp
      row.service,        // B – Service
      row.name,           // C – Name
      row.phone,          // D – Phone
      row.pickup,         // E – Pickup Address
      row.dropoff,        // F – Drop-off Address
      row.vanSize,        // G – Van Size
      row.helpOption,     // H – Help Option
      row.estimatedPrice, // I – Estimated Price (£)
      row.date,           // J – Date
      row.notes,          // K – Notes
      row.contactMethod,  // L – Preferred Contact Method
      "New",              // M – Booking Status
      "Unpaid",           // N – Payment Status
      bookingRef,         // O – Booking Reference
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

  logger.info({ name: row.name, service: row.service, bookingRef }, "Booking appended to Google Sheets");
  return bookingRef;
}
