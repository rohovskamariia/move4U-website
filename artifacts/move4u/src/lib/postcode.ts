// UK postcode helpers — used to make sure the driver always receives
// a full, deliverable address (e.g. "N22 8HE", not just "N22").

// Full UK postcode: outward (1-2 letters + 1-2 digits + optional letter)
// + optional space + inward (digit + 2 letters). Anchored at word
// boundaries so it doesn't pick up garbage substrings.
const FULL_UK_POSTCODE_RE = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}\b/i;

// Outward-only (area) code, e.g. "N22", "W1D", "EC1A". Used to detect
// addresses where Google returned only the postcode area but no inward
// code — which is exactly the case the driver complained about.
const OUTWARD_ONLY_RE = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\b/i;

const UK_COUNTRY_RE = /\b(UK|U\.K\.|UNITED KINGDOM|GREAT BRITAIN|ENGLAND|SCOTLAND|WALES|NORTHERN IRELAND)\b/i;

/** True when the string contains a complete UK postcode like "N22 8HE". */
export function hasFullUKPostcode(s: string): boolean {
  if (!s) return false;
  return FULL_UK_POSTCODE_RE.test(s);
}

/** Extract the full UK postcode from a string, normalised to upper case. */
export function extractFullUKPostcode(s: string): string | null {
  if (!s) return null;
  const m = s.match(FULL_UK_POSTCODE_RE);
  if (!m) return null;
  // Normalise: collapse internal whitespace to a single space, upper-case.
  return m[0].toUpperCase().replace(/\s+/, " ").replace(/^([A-Z0-9]+?)([0-9][A-Z]{2})$/, "$1 $2");
}

/**
 * Returns true when the address looks like a UK address but is missing
 * the inward part of its postcode (e.g. "London N22, UK"). Non-UK
 * addresses (no UK markers, no UK-shaped postcode) return false so we
 * don't block legitimate European entries.
 */
export function isUKAddressMissingFullPostcode(s: string): boolean {
  if (!s) return false;
  if (hasFullUKPostcode(s)) return false;
  const looksUK = UK_COUNTRY_RE.test(s) || OUTWARD_ONLY_RE.test(s);
  return looksUK;
}

/**
 * True when the address is acceptable to proceed:
 *   - empty → false (caller checks this separately)
 *   - has a full UK postcode → true
 *   - has no UK markers at all → true (treated as European/manual)
 *   - has UK markers but no full postcode → false
 */
export function isAddressAcceptable(s: string): boolean {
  const trimmed = (s || "").trim();
  if (!trimmed) return false;
  return !isUKAddressMissingFullPostcode(trimmed);
}
