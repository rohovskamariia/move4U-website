// Central London Congestion Charge Zone (CCZ) detector.
//
// Transport for London charges £18 to drive in the Central London CCZ.
// Detection runs against free-form address strings (typically the
// Google Places autocomplete value, e.g. "Oxford Circus, London W1B 3AG, UK").
// We do NOT call any geocoding API — instead we use the UK postcode
// outward code, reduced to its area prefix, and a small keyword fallback
// for cases where the customer typed an area name but no postcode.

// CCZ area prefixes — the reduced form (no trailing letter/digit).
// W1B → W1, WC2N → WC2, EC1A → EC1, etc.
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
 * Pull the outward code from a free-form address.
 * "Oxford Circus, London W1B 3AG, UK" → "W1B"
 * "EC1A 1BB" → "EC1A"
 * Returns null when no UK postcode is present.
 */
function extractOutwardCode(address: string): string | null {
  if (!address) return null;
  // Full UK postcode: outward (1-2 letters + 1-2 digits + optional letter)
  // followed by a space (or none) and the inward part (digit + 2 letters).
  const full = address.toUpperCase().match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*[0-9][A-Z]{2}\b/);
  if (full) return full[1];
  // Outward-only fallback (e.g. "London W1B")
  const outwardOnly = address.toUpperCase().match(/\b([A-Z]{1,2}[0-9][0-9A-Z]?)\b(?!\s*[0-9][A-Z]{2})/);
  return outwardOnly ? outwardOnly[1] : null;
}

/**
 * Reduce an outward code to its area prefix.
 * "W1B" → "W1", "WC2N" → "WC2", "EC1A" → "EC1", "SW1" → "SW1"
 */
function reduceToAreaPrefix(outward: string): string {
  // Match leading letters + leading digits, drop any trailing letter.
  const m = outward.match(/^([A-Z]{1,2}[0-9]+)/);
  return m ? m[1] : outward;
}

function checkAddress(address: string): { matched: boolean; outward: string | null; prefix: string | null; via: "postcode" | "keyword" | null } {
  const outward = extractOutwardCode(address);
  const prefix = outward ? reduceToAreaPrefix(outward) : null;

  if (prefix && CCZ_AREA_PREFIXES.includes(prefix)) {
    return { matched: true, outward, prefix, via: "postcode" };
  }

  const lower = address.toLowerCase();
  if (CCZ_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { matched: true, outward, prefix, via: "keyword" };
  }

  return { matched: false, outward, prefix, via: null };
}

/**
 * Returns true if any of the supplied addresses sits in (or passes
 * through) the Central London Congestion Charge Zone. Postcode match
 * OR keyword match is enough — both are not required.
 */
export function isLikelyInCongestionZone(addresses: (string | undefined | null)[]): boolean {
  let anyMatch = false;
  for (const raw of addresses) {
    const a = (raw ?? "").trim();
    if (!a) continue;
    const result = checkAddress(a);
    // eslint-disable-next-line no-console -- temporary debug logging per spec
    console.log("[CCZ]", {
      address: a,
      outward: result.outward,
      prefix: result.prefix,
      matched: result.matched,
      via: result.via,
    });
    if (result.matched) anyMatch = true;
  }
  return anyMatch;
}
