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

// ─────────────────────────────────────────────────────────────────────────
// Per-country national-number length rules.
//
// Generic E.164 (8-15 total digits) is far too lax — e.g. it would accept
// "+44 36968280" as a UK number even though UK national numbers are
// always exactly 10 digits. We layer a strict-length check on top.
//
// Keys are the international dial code (without "+"). Values give the
// allowed range of NATIONAL-significant digits (i.e. digits AFTER the
// country code). Numbers whose dial code isn't in this map fall back to
// the generic E.164 sanity check enforced by `toE164`.
//
// Sources: ITU-T E.164 national numbering plans for each country.
// ─────────────────────────────────────────────────────────────────────────
const PHONE_RULES: Record<string, { min: number; max: number }> = {
  "44":  { min: 10, max: 10 }, // United Kingdom
  "380": { min: 9,  max: 9  }, // Ukraine
  "48":  { min: 9,  max: 9  }, // Poland
  "39":  { min: 9,  max: 10 }, // Italy (mobile 10, some landlines 9)
  "33":  { min: 9,  max: 9  }, // France
  "49":  { min: 10, max: 11 }, // Germany (mobile 10–11)
  "34":  { min: 9,  max: 9  }, // Spain
  "40":  { min: 9,  max: 9  }, // Romania
  "373": { min: 8,  max: 8  }, // Moldova
};

// Dial codes sorted longest-first so we match "+380" before "+38" and
// "+1xyz" doesn't accidentally swallow a leading "+1" of a longer code.
const STRICT_CODES_SORTED = Object.keys(PHONE_RULES).sort(
  (a, b) => b.length - a.length,
);

/**
 * Split an E.164 number into { dialCode, national } when its dial code
 * has a strict per-country length rule. Returns null otherwise so the
 * caller can fall through to the generic E.164 check.
 */
function matchStrictRule(
  e164: string,
): { national: string; rule: { min: number; max: number } } | null {
  if (!e164.startsWith("+")) return null;
  const digits = e164.slice(1);
  for (const code of STRICT_CODES_SORTED) {
    if (digits.startsWith(code)) {
      return {
        national: digits.slice(code.length),
        rule: PHONE_RULES[code],
      };
    }
  }
  return null;
}

/**
 * True iff `raw` can be converted to a valid E.164 number AND, when the
 * detected country has a strict national-length rule, the national part
 * sits within that range. UK "+44 36968280" → false (8 nat digits, needs
 * exactly 10). UK "+44 7866259562" → true.
 *
 * For unrecognised dial codes we fall back to the generic E.164 sanity
 * check (8–15 total digits) already enforced by `toE164`.
 */
export function isValidPhone(raw: string): boolean {
  const e = toE164(raw);
  if (!e) return false;
  const strict = matchStrictRule(e);
  if (strict) {
    const len = strict.national.length;
    return len >= strict.rule.min && len <= strict.rule.max;
  }
  return true;
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
