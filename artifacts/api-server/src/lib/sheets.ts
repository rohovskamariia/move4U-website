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
  "Preferred Time",      // X — customer's chosen time window (Morning / Afternoon / Evening)
  "Invoice ID",          // Y — Stripe invoice ID
  "Invoice URL",         // Z — hosted invoice URL
  "Invoice Type",        // AA — deposit / full / remaining
];

// ── Extra detail columns AB–AQ ────────────────────────────────────────────────
//
// Additive extension — existing columns A–AA are never touched.
// Captures price breakdown and extra route details computed on the frontend,
// plus confirmation-send tracking fields.

const EXTRA_HEADER_ROW = [
  "Pickup Floor/Stairs",    // AB (index 27)
  "Extra Stop 1",           // AC (index 28)
  "Extra Stop 2",           // AD (index 29)
  "Extra Stop 3",           // AE (index 30)
  "Dropoff Floor/Stairs",   // AF (index 31)
  "Duration",               // AG (index 32)
  "Hourly Rate",            // AH (index 33)
  "Base Charge",            // AI (index 34)
  "Extra Stop Charge",      // AJ (index 35)
  "Stairs Charge",          // AK (index 36)
  "Congestion Charge",      // AL (index 37)
  "Outside M25 Charge",     // AM (index 38)
  "Confirmation Sent",      // AN (index 39)
  "Confirmation Sent At",   // AO (index 40)
  "Confirmation Subject",   // AP (index 41)
  "Sent By",                // AQ (index 42)
  "Admin Extra Stops",      // AR (index 43) — JSON array [{address,charge,notes}]
  "Admin Extra Charges",    // AS (index 44) — JSON array [{type,amount,notes}]
];

let extraHeaderPatched = false;

async function patchExtraHeaders(id: string): Promise<void> {
  if (extraHeaderPatched) return;
  try {
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!AB1:AS1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [EXTRA_HEADER_ROW] }),
      },
    );
    logger.info("Patched extra column headers AB–AQ");
  } catch (err) {
    logger.warn({ err }, "Could not patch extra column headers — continuing");
  }
  extraHeaderPatched = true;
}

let adminHeaderPatched = false;

async function patchAdminHeaders(id: string): Promise<void> {
  if (adminHeaderPatched) return;
  try {
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!P1:AA1?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [ADMIN_HEADER_ROW] }),
      },
    );
    logger.info("Patched admin column headers P–AA");
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
  // Admin fields (P–AA)
  agreedQuote: string;
  depositAmount: string;
  confirmedDate: string;
  confirmedTime: string;
  driverNotes: string;
  paymentLink: string;
  telegramMessageId: string; // V
  photoUrls: string;         // W
  timeWindow: string;        // X
  invoiceId: string;         // Y
  invoiceUrl: string;        // Z
  invoiceType: string;       // AA
  // Extra detail columns (AB–AQ)
  pickupFloorDetail: string;   // AB
  extraStop1: string;          // AC
  extraStop2: string;          // AD
  extraStop3: string;          // AE
  dropoffFloorDetail: string;  // AF
  duration: string;            // AG
  hourlyRate: string;          // AH
  baseCharge: string;          // AI
  extraStopCharge: string;     // AJ
  stairsCharge: string;        // AK
  congestionCharge: string;    // AL
  outsideM25Charge: string;    // AM
  confirmationSent: string;    // AN
  confirmationSentAt: string;  // AO
  confirmationSubject: string; // AP
  confirmationSentBy: string;  // AQ
  adminExtraStops: string;     // AR — JSON [{address,charge,notes}]
  adminExtraCharges: string;   // AS — JSON [{type,amount,notes}]
}

export async function getAllBookings(): Promise<BookingRecord[]> {
  const id = await ensureSheet();
  await patchAdminHeaders(id);
  await patchExtraHeaders(id);

  // Append a timestamp so the connectors-proxy layer never serves a
  // cached response — admin saves must always be reflected immediately.
  // Google Sheets API ignores unknown query parameters.
  const res = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${id}/values/Bookings!A:AS?_=${Date.now()}`,
    { headers: { "Cache-Control": "no-cache" } },
  );
  const data = (await res.json()) as { values?: string[][] };
  const rows = data.values ?? [];
  if (rows.length <= 1) return [];

  return rows
    .slice(1) // skip header
    .map((row, i) => ({
      rowNumber:            i + 2,
      timestamp:            row[0]  ?? "",
      service:              row[1]  ?? "",
      name:                 row[2]  ?? "",
      phone:                row[3]  ?? "",
      pickup:               row[4]  ?? "",
      dropoff:              row[5]  ?? "",
      vanSize:              row[6]  ?? "",
      helpOption:           row[7]  ?? "",
      estimatedPrice:       row[8]  ?? "",
      date:                 row[9]  ?? "",
      notes:                row[10] ?? "",
      contactMethod:        row[11] ?? "",
      bookingStatus:        row[12] ?? "",
      paymentStatus:        row[13] ?? "",
      bookingReference:     row[14] ?? "",
      agreedQuote:          row[15] ?? "",
      depositAmount:        row[16] ?? "",
      confirmedDate:        row[17] ?? "",
      confirmedTime:        row[18] ?? "",
      driverNotes:          row[19] ?? "",
      paymentLink:          row[20] ?? "",
      telegramMessageId:    row[21] ?? "",
      photoUrls:            row[22] ?? "",
      timeWindow:           row[23] ?? "",
      invoiceId:            row[24] ?? "",
      invoiceUrl:           row[25] ?? "",
      invoiceType:          row[26] ?? "",
      // Extra detail columns AB–AQ (indices 27–42)
      pickupFloorDetail:    row[27] ?? "",
      extraStop1:           row[28] ?? "",
      extraStop2:           row[29] ?? "",
      extraStop3:           row[30] ?? "",
      dropoffFloorDetail:   row[31] ?? "",
      duration:             row[32] ?? "",
      hourlyRate:           row[33] ?? "",
      baseCharge:           row[34] ?? "",
      extraStopCharge:      row[35] ?? "",
      stairsCharge:         row[36] ?? "",
      congestionCharge:     row[37] ?? "",
      outsideM25Charge:     row[38] ?? "",
      confirmationSent:     row[39] ?? "",
      confirmationSentAt:   row[40] ?? "",
      confirmationSubject:  row[41] ?? "",
      confirmationSentBy:   row[42] ?? "",
      adminExtraStops:      row[43] ?? "",
      adminExtraCharges:    row[44] ?? "",
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
  telegramMessageId?: string; // V
  photoUrls?:         string; // W
  preferredTime?:     string; // X
  invoiceId?:         string; // Y
  invoiceUrl?:        string; // Z
  invoiceType?:       string; // AA
  // Admin-editable core fields
  service?:           string; // B — service type
  notes?:             string; // K — customer notes
  pickup?:            string; // E — pickup address
  dropoff?:           string; // F — drop-off address
  vanSize?:           string; // G — van size
  helpOption?:        string; // H — help option
  // Extra detail columns AB–AQ
  pickupFloorDetail?:   string;
  extraStop1?:          string;
  extraStop2?:          string;
  extraStop3?:          string;
  dropoffFloorDetail?:  string;
  duration?:            string;
  hourlyRate?:          string;
  baseCharge?:          string;
  extraStopCharge?:     string;
  stairsCharge?:        string;
  congestionCharge?:    string;
  outsideM25Charge?:    string;
  confirmationSent?:    string;
  confirmationSentAt?:  string;
  confirmationSubject?: string;
  confirmationSentBy?:  string;
  // Admin-managed extra stops/charges columns AR–AS
  adminExtraStops?:    string; // AR — JSON [{address,charge,notes}]
  adminExtraCharges?:  string; // AS — JSON [{type,amount,notes}]
}

// Builds the batchUpdate ranges for a known sheet row. Shared by the
// ref-based and row-based update entry points so the column mapping
// stays in exactly one place.
function buildAdminWriteRanges(
  sheetRow: number,
  fields: BookingAdminUpdate,
): Array<{ range: string; values: string[][] }> {
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
  if (fields.preferredTime      !== undefined) updates.push({ range: c("X"), values: [[fields.preferredTime]] });
  if (fields.invoiceId          !== undefined) updates.push({ range: c("Y"), values: [[fields.invoiceId]] });
  if (fields.invoiceUrl         !== undefined) updates.push({ range: c("Z"),  values: [[fields.invoiceUrl]] });
  if (fields.invoiceType        !== undefined) updates.push({ range: c("AA"), values: [[fields.invoiceType]] });
  // Admin-editable core booking fields
  if (fields.service            !== undefined) updates.push({ range: c("B"),  values: [[fields.service]] });
  if (fields.pickup             !== undefined) updates.push({ range: c("E"),  values: [[fields.pickup]] });
  if (fields.dropoff            !== undefined) updates.push({ range: c("F"),  values: [[fields.dropoff]] });
  if (fields.vanSize            !== undefined) updates.push({ range: c("G"),  values: [[fields.vanSize]] });
  if (fields.helpOption         !== undefined) updates.push({ range: c("H"),  values: [[fields.helpOption]] });
  if (fields.notes              !== undefined) updates.push({ range: c("K"),  values: [[fields.notes]] });
  // Extra detail columns AB–AQ
  if (fields.pickupFloorDetail   !== undefined) updates.push({ range: c("AB"), values: [[fields.pickupFloorDetail]] });
  if (fields.extraStop1          !== undefined) updates.push({ range: c("AC"), values: [[fields.extraStop1]] });
  if (fields.extraStop2          !== undefined) updates.push({ range: c("AD"), values: [[fields.extraStop2]] });
  if (fields.extraStop3          !== undefined) updates.push({ range: c("AE"), values: [[fields.extraStop3]] });
  if (fields.dropoffFloorDetail  !== undefined) updates.push({ range: c("AF"), values: [[fields.dropoffFloorDetail]] });
  if (fields.duration            !== undefined) updates.push({ range: c("AG"), values: [[fields.duration]] });
  if (fields.hourlyRate          !== undefined) updates.push({ range: c("AH"), values: [[fields.hourlyRate]] });
  if (fields.baseCharge          !== undefined) updates.push({ range: c("AI"), values: [[fields.baseCharge]] });
  if (fields.extraStopCharge     !== undefined) updates.push({ range: c("AJ"), values: [[fields.extraStopCharge]] });
  if (fields.stairsCharge        !== undefined) updates.push({ range: c("AK"), values: [[fields.stairsCharge]] });
  if (fields.congestionCharge    !== undefined) updates.push({ range: c("AL"), values: [[fields.congestionCharge]] });
  if (fields.outsideM25Charge    !== undefined) updates.push({ range: c("AM"), values: [[fields.outsideM25Charge]] });
  if (fields.confirmationSent    !== undefined) updates.push({ range: c("AN"), values: [[fields.confirmationSent]] });
  if (fields.confirmationSentAt  !== undefined) updates.push({ range: c("AO"), values: [[fields.confirmationSentAt]] });
  if (fields.confirmationSubject !== undefined) updates.push({ range: c("AP"), values: [[fields.confirmationSubject]] });
  if (fields.confirmationSentBy  !== undefined) updates.push({ range: c("AQ"), values: [[fields.confirmationSentBy]] });
  if (fields.adminExtraStops     !== undefined) updates.push({ range: c("AR"), values: [[fields.adminExtraStops]] });
  if (fields.adminExtraCharges   !== undefined) updates.push({ range: c("AS"), values: [[fields.adminExtraCharges]] });

  return updates;
}

// Updates admin-editable fields for a booking when the EXACT sheet row is
// already known (e.g. the row number returned by appendBooking). This is
// the safest entry point because it does NO ref→row lookup, so it cannot
// possibly write to the wrong booking even if two rows ever shared a ref
// during a brief race window. Use this for follow-up writes immediately
// after an append (photos, timeWindow, telegramMessageId).
export async function updateBookingByRow(
  sheetRow: number,
  fields: BookingAdminUpdate,
): Promise<boolean> {
  if (!Number.isFinite(sheetRow) || sheetRow < 2) {
    logger.warn({ sheetRow }, "updateBookingByRow called with invalid sheet row");
    return false;
  }
  const updates = buildAdminWriteRanges(sheetRow, fields);
  if (updates.length === 0) return true;
  try {
    const id = await ensureSheet();
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values:batchUpdate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: updates }),
      },
    );
    logger.info({ sheetRow, fields: Object.keys(fields) }, "Booking update saved to Sheets by row");
    return true;
  } catch (err) {
    logger.error({ err, sheetRow }, "Failed to save booking update by row");
    return false;
  }
}

// Updates admin-editable fields for a booking identified by its reference.
// Use this for admin-panel edits (where only the ref is known). For writes
// immediately after an append, prefer updateBookingByRow which has no
// race window.
export async function updateBookingAdmin(
  bookingRef: string,
  fields: BookingAdminUpdate,
): Promise<boolean> {
  try {
    const id = await ensureSheet();

    // Locate row via column O. If the same ref ever appears more than once
    // (which should never happen, but is the exact failure mode the user
    // reported), refuse to update rather than risk corrupting an unrelated
    // booking. The duplicate is logged so the team can fix the sheet.
    const refRes = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/Bookings!O:O`,
    );
    const refData = (await refRes.json()) as { values?: string[][] };
    const rows = refData.values ?? [];
    const matches: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]?.[0] === bookingRef) matches.push(i + 1); // 1-based sheet row
    }
    if (matches.length === 0) {
      logger.warn({ bookingRef }, "Booking not found for admin update");
      return false;
    }
    if (matches.length > 1) {
      logger.error(
        { bookingRef, rows: matches },
        "DUPLICATE booking reference detected in column O — refusing to update to avoid corrupting another booking. Manually deduplicate the sheet.",
      );
      return false;
    }
    const sheetRow = matches[0]!;

    const updates = buildAdminWriteRanges(sheetRow, fields);
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

    logger.info({ bookingRef, sheetRow, fields: Object.keys(fields) }, "Admin booking update saved to Sheets");
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

export interface AppendResult {
  bookingRef: string;
  sheetRow: number; // 1-based; the actual row Sheets assigned to this booking
}

// Appends a brand-new booking row. ALWAYS inserts (uses the Sheets `:append`
// endpoint with insertDataOption=INSERT_ROWS) so an existing booking can
// never be overwritten by a customer submission. Returns BOTH the generated
// booking reference AND the exact 1-based sheet row that was assigned —
// callers should pass that row number to updateBookingByRow for any
// follow-up writes (photos, timeWindow, telegramMessageId) so the writes
// land on this exact booking even if two bookings briefly share a ref.
export async function appendBooking(row: BookingRow): Promise<AppendResult> {
  const id = await ensureSheet();
  await patchNewHeaders(id);

  const bookingRef = await getNextBookingRef(id);
  // Store as ISO 8601 UTC so the admin panel can parse it unambiguously.
  //
  // The leading apostrophe is essential: we append with
  // valueInputOption=USER_ENTERED (so Sheets parses formulas / hyperlinks
  // for other columns), but for the timestamp that means Sheets recognises
  // the ISO string as a date, converts it to an internal date serial,
  // and re-formats it on read using the spreadsheet's locale — leaving
  // us with something like "5/3/2026 15:30" or a 4-day-skewed date
  // depending on the sheet's locale settings.
  //
  // Prefixing with `'` is Google Sheets' documented marker for "store
  // this cell as plain text, do not parse" — the apostrophe itself is
  // metadata and is NOT returned by FORMATTED_VALUE reads, so the admin
  // panel sees the clean ISO string and parses it perfectly with
  // new Date().
  const timestamp = "'" + new Date().toISOString();

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

  // insertDataOption=INSERT_ROWS forces Sheets to push every existing row
  // down and drop ours into a brand-new row, even when the table has
  // trailing empty rows. This GUARANTEES we never overwrite an existing
  // booking row, regardless of sheet shape.
  const appendRes = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${id}/values/Bookings!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );

  // Pull the exact row number Sheets assigned. The response shape is
  // { updates: { updatedRange: "Bookings!A1023:O1023", ... } } — we
  // extract 1023 so subsequent writes target THIS booking by row, not by
  // ref lookup (which would re-introduce a tiny race window).
  let sheetRow = 0;
  try {
    const appendData = (await appendRes.json()) as {
      updates?: { updatedRange?: string };
    };
    const m = appendData.updates?.updatedRange?.match(/!A(\d+):/);
    if (m) sheetRow = parseInt(m[1]!, 10);
  } catch (err) {
    logger.warn({ err, bookingRef }, "Could not parse :append response — follow-up writes will fall back to ref lookup");
  }

  logger.info(
    { name: row.name, service: row.service, bookingRef, sheetRow },
    "Booking appended to Google Sheets",
  );
  return { bookingRef, sheetRow };
}

// ── Audit log — "Booking History" sheet tab ──────────────────────────────────
//
// Appends change records to a dedicated "Booking History" tab. The tab is
// created automatically with headers on first use.

let auditSheetEnsured = false;

async function ensureAuditSheet(spreadsheetId: string): Promise<void> {
  if (auditSheetEnsured) return;
  try {
    const metaRes = await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${spreadsheetId}`,
    );
    const metaData = (await metaRes.json()) as {
      sheets?: Array<{ properties?: { title?: string } }>;
    };
    const exists = (metaData.sheets ?? []).some(
      (s) => s.properties?.title === "Booking History",
    );

    if (!exists) {
      await connectors.proxy(
        "google-sheet",
        `/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: "Booking History" } } }],
          }),
        },
      );
      await connectors.proxy(
        "google-sheet",
        `/v4/spreadsheets/${spreadsheetId}/values/'Booking History'!A1:F1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values: [["Timestamp", "Booking Ref", "Field Changed", "Old Value", "New Value", "Changed By"]],
          }),
        },
      );
      logger.info("Created Booking History audit log tab");
    }
    auditSheetEnsured = true;
  } catch (err) {
    logger.warn({ err }, "Could not ensure audit sheet — continuing");
    auditSheetEnsured = true; // avoid retrying on every write
  }
}

export async function writeAuditLog(
  entries: Array<{
    bookingRef:   string;
    fieldChanged: string;
    oldValue:     string;
    newValue:     string;
    changedBy?:   string;
  }>,
): Promise<void> {
  if (entries.length === 0) return;
  try {
    const id = await ensureSheet();
    await ensureAuditSheet(id);
    const timestamp = new Date().toISOString();
    const values = entries.map((e) => [
      timestamp,
      e.bookingRef,
      e.fieldChanged,
      e.oldValue,
      e.newValue,
      e.changedBy ?? "Admin",
    ]);
    await connectors.proxy(
      "google-sheet",
      `/v4/spreadsheets/${id}/values/'Booking History'!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      },
    );
    logger.info({ count: entries.length }, "Audit log entries written");
  } catch (err) {
    logger.error({ err }, "Failed to write audit log — continuing");
  }
}
