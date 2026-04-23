// Central London Congestion Charge Zone (CCZ) detector.
//
// Transport for London charges £18 to drive in the Central London CCZ.
// Detection runs against free-form address strings (typically the
// Google Places autocomplete value, e.g. "Oxford Circus, London W1B 3AG, UK").
//
// Strategy (most accurate → fallback):
//   1. Extract the FULL UK postcode from the address and check it against
//      the official TfL CCZ postcode list (~18,600 codes — see
//      `src/data/cczPostcodes.ts`). Exact match wins.
//   2. If only an outward code is present, fall back to the area-prefix
//      list (W1, EC1-4, WC1-2, SW1, SE1, N1-partial). Treated as
//      "likely" since not every postcode in those areas is in the zone.
//   3. If still no postcode, fall back to landmark/area keyword matching.

import { CCZ_POSTCODES } from "@/data/cczPostcodes";

// Area prefixes used for the OUTWARD-only fallback (when we can't
// resolve a full postcode). These cover the central London zone at a
// coarse level — kept identical to the previous behaviour.
const CCZ_AREA_PREFIXES = [
  "W1",
  "WC1", "WC2",
  "EC1", "EC2", "EC3", "EC4",
  "SW1",
  "SE1",
  "N1", // partial — included as "likely"
];

// Area / landmark keywords for addresses that don't include a postcode.
const CCZ_KEYWORDS = [
  "soho",
  "mayfair",
  "westminster",
  "covent garden",
  "city of london",
  "bloomsbury",
  "waterloo",
];

/**
 * Pull the full UK postcode (outward + inward) from a free-form address.
 * Returns the normalised form WITHOUT a space, e.g. "EC1A1BB".
 * Returns null when no full postcode is present.
 */
function extractFullPostcode(address: string): string | null {
  if (!address) return null;
  const m = address
    .toUpperCase()
    .match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})\b/);
  return m ? `${m[1]}${m[2]}` : null;
}

/**
 * Pull just the outward code from a free-form address.
 * "Oxford Circus, London W1B 3AG, UK" → "W1B"
 * "London W1B" → "W1B"
 * Returns null when no outward code is present.
 */
function extractOutwardCode(address: string): string | null {
  if (!address) return null;
  const full = address.toUpperCase().match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*[0-9][A-Z]{2}\b/);
  if (full) return full[1];
  const outwardOnly = address.toUpperCase().match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\b(?!\s*[0-9][A-Z]{2})/);
  return outwardOnly ? outwardOnly[1] : null;
}

/**
 * Reduce an outward code to its area prefix.
 * "W1B" → "W1", "WC2N" → "WC2", "EC1A" → "EC1", "SW1" → "SW1"
 */
function reduceToAreaPrefix(outward: string): string {
  const m = outward.match(/^([A-Z]{1,2}[0-9]+)/);
  return m ? m[1] : outward;
}

type Via = "postcode-exact" | "postcode-prefix" | "keyword" | null;

function checkAddress(address: string): {
  matched: boolean;
  full: string | null;
  outward: string | null;
  prefix: string | null;
  via: Via;
} {
  const full = extractFullPostcode(address);
  const outward = full ? full.slice(0, full.length - 3) : extractOutwardCode(address);
  const prefix = outward ? reduceToAreaPrefix(outward) : null;

  // 1. Exact full-postcode match against the official list — most accurate.
  if (full && CCZ_POSTCODES.has(full)) {
    return { matched: true, full, outward, prefix, via: "postcode-exact" };
  }

  // 2. Outward-only fallback — only when we don't have a full postcode.
  //    A full postcode that ISN'T in the official list means the address is
  //    NOT in the zone, so we deliberately don't fall through to the prefix
  //    check in that case (would create false positives for e.g. EC1A 1BB-
  //    adjacent codes that TfL excludes).
  if (!full && prefix && CCZ_AREA_PREFIXES.includes(prefix)) {
    return { matched: true, full: null, outward, prefix, via: "postcode-prefix" };
  }

  // 3. Keyword fallback — when no postcode at all, look for area names.
  if (!full && !prefix) {
    const lower = address.toLowerCase();
    if (CCZ_KEYWORDS.some((kw) => lower.includes(kw))) {
      return { matched: true, full: null, outward, prefix, via: "keyword" };
    }
  }

  return { matched: false, full, outward, prefix, via: null };
}

/**
 * Returns true if any of the supplied addresses sits in the Central
 * London Congestion Charge Zone. Checked across pickup, drop-off and
 * any additional stops — a single match is enough.
 */
export function isLikelyInCongestionZone(
  addresses: (string | undefined | null)[],
): boolean {
  for (const raw of addresses) {
    const a = (raw ?? "").trim();
    if (!a) continue;
    if (checkAddress(a).matched) return true;
  }
  return false;
}

/**
 * Count the number of CCZ entries on a route. Each address that sits in
 * the zone counts as one entry — pickup AND drop-off both in the zone
 * means two entries, so the customer is billed £18 × 2 = £36.
 *
 * Empty / blank addresses are skipped.
 */
export function countCongestionEntries(
  addresses: (string | undefined | null)[],
): number {
  let count = 0;
  for (const raw of addresses) {
    const a = (raw ?? "").trim();
    if (!a) continue;
    if (checkAddress(a).matched) count++;
  }
  return count;
}
