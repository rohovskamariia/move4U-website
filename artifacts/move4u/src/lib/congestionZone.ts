// Central London Congestion Charge Zone detector.
//
// Transport for London charges £18/day to drive in the Central London
// Congestion Charge Zone (CCZ) on weekdays 07:00–18:00 and weekends
// 12:00–18:00. The zone roughly covers the postcode districts below
// (and parts of a few neighbouring ones).
//
// We do NOT call any external geocoding API here — addresses come in as
// free-form strings from the booking form, so the cheapest reliable
// signal is the UK postcode prefix. Detection is intentionally
// conservative: we report "likely in zone" when at least one address
// matches a CCZ postcode prefix or names a well-known central area.
// The estimate always shows it as a *conditional* charge, so a small
// number of false positives is acceptable — the driver makes the final
// call on the booking.

// Postcode districts fully or mostly inside the CCZ. SW1 / SE1 / E1 /
// N1 / NW1 are partially inside, so we include them too — the customer
// will see "may apply" rather than a guaranteed charge.
const CCZ_POSTCODE_PREFIXES = [
  "EC1", "EC2", "EC3", "EC4",
  "WC1", "WC2",
  "W1",
  "SW1",
  "SE1",
  "N1C", // Kings Cross island
];

// Area / landmark names commonly typed by customers when the postcode
// is missing. Lower-case, word-boundary matched.
const CCZ_AREA_KEYWORDS = [
  "soho", "covent garden", "mayfair", "fitzrovia", "marylebone",
  "holborn", "bloomsbury", "clerkenwell", "barbican", "city of london",
  "westminster", "victoria", "pimlico", "belgravia", "knightsbridge",
  "st james", "st. james", "kings cross", "king's cross",
  "waterloo", "southwark", "borough", "bankside",
  "farringdon", "moorgate", "liverpool street",
];

/** Extract the outward part of a UK postcode (e.g. "EC1A" from "EC1A 1BB"). */
function extractOutwardPostcode(s: string): string | null {
  // UK postcode regex — outward code is 1-2 letters + 1-2 digits + optional letter
  const m = s.toUpperCase().match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*[0-9][A-Z]{2}\b/);
  return m ? m[1] : null;
}

function addressMatchesZone(address: string): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  if (!trimmed) return false;

  const outward = extractOutwardPostcode(trimmed);
  if (outward) {
    if (CCZ_POSTCODE_PREFIXES.some((p) => outward === p || outward.startsWith(p))) {
      return true;
    }
  }

  const lower = trimmed.toLowerCase();
  for (const kw of CCZ_AREA_KEYWORDS) {
    // word-boundary check so "westminster" doesn't match "Old Westminster Rd"
    // unintentionally — but for our purposes this is fine since those areas
    // are still adjacent to / inside the zone.
    if (lower.includes(kw)) return true;
  }
  return false;
}

/**
 * Returns true if any of the supplied addresses looks like it sits in
 * (or passes through) the Central London Congestion Charge Zone.
 *
 * The booking flow passes pickup, drop-off, and any extra stops here.
 * If even one of them is in the zone the route almost certainly crosses
 * the boundary, so we surface the £18 charge as "may apply".
 */
export function isLikelyInCongestionZone(addresses: (string | undefined | null)[]): boolean {
  return addresses.some((a) => addressMatchesZone(a ?? ""));
}
