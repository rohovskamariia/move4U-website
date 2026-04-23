// Outside-M25 detection — postcode-area based estimate.
//
// We charge £1 per mile for the portion of the journey that sits OUTSIDE
// the M25 ring road. A precise mileage calculation would need a routing
// API (Google Distance Matrix) which we don't have configured, so we use
// a curated lookup of common UK postcode areas → approximate miles
// outside the M25. The resulting estimate is shown to customers as a
// guide; the actual mileage on the day is what gets billed.
//
// Anything in the "London commuter" postcode set is treated as inside
// the M25 (the M25 broadly bounds the London postcode areas plus the
// near-suburban ones — BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB, WD).

/** Postcode areas considered to be inside or right on the M25. */
const M25_INSIDE_AREAS = new Set([
  // Central / inner London
  "E", "EC", "N", "NW", "SE", "SW", "W", "WC",
  // Outer London + immediate fringe (largely inside the M25)
  "BR", "CR", "DA", "EN", "HA", "IG", "KT", "RM", "SM", "TW", "UB", "WD",
]);

/**
 * Approximate one-way miles OUTSIDE the M25 for common UK postcode areas.
 * Conservative averages — used as a customer-facing estimate only.
 * Postcode areas not listed default to 0 (we'd rather under-quote than
 * over-quote when the area is unknown).
 */
const OUTSIDE_M25_MILES: Record<string, number> = {
  // Home Counties — close to the M25
  AL: 5,   // St Albans
  HP: 10,  // Hemel Hempstead
  SL: 5,   // Slough
  GU: 15,  // Guildford
  RH: 15,  // Redhill / Crawley
  ME: 15,  // Medway
  TN: 20,  // Tunbridge Wells
  SG: 15,  // Stevenage
  LU: 15,  // Luton
  CM: 15,  // Chelmsford
  // Slightly further out
  MK: 30,  // Milton Keynes
  OX: 35,  // Oxford
  RG: 25,  // Reading
  PO: 50,  // Portsmouth
  SO: 60,  // Southampton
  CT: 35,  // Canterbury
  BN: 40,  // Brighton
  CB: 40,  // Cambridge
  CO: 40,  // Colchester
  IP: 60,  // Ipswich
  NN: 50,  // Northampton
  PE: 60,  // Peterborough
  NR: 90,  // Norwich
  // Further afield
  CV: 75,  // Coventry
  B:  90,  // Birmingham
  GL: 75,  // Gloucester
  BS: 100, // Bristol
  BA: 100, // Bath
  EX: 150, // Exeter
  LE: 80,  // Leicester
  NG: 100, // Nottingham
  DE: 110, // Derby
  ST: 120, // Stoke
  S:  130, // Sheffield
  M:  165, // Manchester
  L:  175, // Liverpool
  LS: 165, // Leeds
  NE: 250, // Newcastle
};

/**
 * Pull the postcode AREA (1–2 letter prefix) out of a free-form address.
 * "Oxford Circus, London W1B 3AG, UK" → "W"
 * "MK9 1BD"                          → "MK"
 * Returns null when no usable postcode is present.
 */
function extractArea(address: string): string | null {
  if (!address) return null;
  const m = address
    .toUpperCase()
    .match(/\b([A-Z]{1,2})[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/);
  if (m) return m[1];
  // Fall back to outward-only matches (e.g. "London W1B" with no inward).
  const out = address.toUpperCase().match(/\b([A-Z]{1,2})[0-9][0-9A-Z]?\b/);
  return out ? out[1] : null;
}

/**
 * Conservative fallback (miles) used when a postcode area is clearly
 * outside the M25 but not present in the curated lookup. We'd rather
 * apply a small estimate than zero — the actual mileage is reconciled
 * on the day, and the customer summary clearly states it's an estimate.
 */
const UNKNOWN_OUTSIDE_M25_FALLBACK = 30;

/**
 * Estimated one-way miles outside the M25 for a single address.
 * Returns 0 when the address is inside the M25 or has no postcode.
 * For unknown non-London areas we apply a conservative fallback so
 * the system never silently undercharges to £0.
 */
export function outsideM25MilesForAddress(address: string): number {
  const area = extractArea(address);
  if (!area) return 0;
  if (M25_INSIDE_AREAS.has(area)) return 0;
  return OUTSIDE_M25_MILES[area] ?? UNKNOWN_OUTSIDE_M25_FALLBACK;
}

/**
 * Estimated outside-M25 mileage for a whole journey. We take the maximum
 * one-way distance of any address from the M25 — this approximates the
 * outbound leg from the M25 boundary to the furthest point. Conservative
 * for routes where multiple addresses sit outside in different directions
 * (those will bill the actual distance on the day).
 */
export function outsideM25MilesForRoute(
  addresses: (string | undefined | null)[],
): number {
  let max = 0;
  for (const a of addresses) {
    if (!a) continue;
    const miles = outsideM25MilesForAddress(a);
    if (miles > max) max = miles;
  }
  return max;
}
