// ─────────────────────────────────────────────────────────────────────────
// Phone-number handling
//
// Goal: every phone number we store, send to the API, write to Sheets, or
// hand to wa.me / tel: / sms: is in canonical E.164 format ("+CCxxxxxxxx")
// so that contact links work reliably across WhatsApp, the iOS dialer,
// Android, and desktop. The customer is allowed to type freely (spaces,
// brackets, dashes, dots, leading 0, leading 00, missing "+", etc) — we
// clean and convert behind the scenes.
//
// Strategy when normalising raw input → E.164:
//   1. Strip everything that isn't a digit or "+" (kills spaces, brackets,
//      dashes, dots, NBSPs, etc).
//   2. Treat a leading "00" as the international dialling prefix → "+".
//   3. If it now starts with "+", we already have an explicit country
//      code — accept it if the digit count is sane (E.164 allows 8–15
//      total digits).
//   4. Otherwise, if it starts with "0" and has 10–11 digits total, treat
//      it as a UK trunk number ("07…", "020…") → drop the trunk 0 and
//      prepend "+44".
//   5. Otherwise, if it's 8–15 digits with no leading 0, assume the user
//      typed an international number but forgot the "+", and prepend it.
//   6. Anything else is invalid.
// ─────────────────────────────────────────────────────────────────────────

/** Strip whitespace, brackets, dashes, dots — anything that isn't a digit or "+". */
export function normalisePhone(raw: string): string {
  return (raw ?? "").replace(/[^\d+]/g, "");
}

/**
 * Convert any reasonable user input to canonical E.164 (e.g. "+447888355523").
 * Returns "" if the input cannot be confidently normalised — callers should
 * treat that as "invalid" and prompt the user to correct it.
 */
export function toE164(raw: string): string {
  let v = normalisePhone(raw);
  if (!v) return "";

  // "00" international prefix → "+"
  if (v.startsWith("00")) v = "+" + v.slice(2);

  if (v.startsWith("+")) {
    // E.164: leading +, country code starts 1-9, total 8-15 digits.
    return /^\+[1-9]\d{7,14}$/.test(v) ? v : "";
  }

  // UK trunk number: "07…" mobile (11 digits) or "0…" landline (10-11).
  // Drop the trunk 0 and prepend +44.
  if (v.startsWith("0")) {
    const rest = v.slice(1);
    if (/^\d{9,10}$/.test(rest)) return `+44${rest}`;
    return "";
  }

  // No "+" and no leading 0 — assume the user dropped the "+" from an
  // international number. Country code must start 1-9, total 8-15 digits.
  if (/^[1-9]\d{7,14}$/.test(v)) return `+${v}`;

  return "";
}

/** True iff `raw` can be converted to a valid E.164 number. */
export function isValidPhone(raw: string): boolean {
  return toE164(raw) !== "";
}

/**
 * Digits-only form for `wa.me/<digits>` and similar. Returns "" for
 * invalid input so callers can fall back to a sensible default.
 */
export function toWhatsAppDigits(raw: string): string {
  const e = toE164(raw);
  return e ? e.slice(1) : "";
}

export function isValidEmail(raw: string): boolean {
  const v = (raw ?? "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
