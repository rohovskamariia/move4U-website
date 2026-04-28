import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// PhoneField
//
// A reusable country-code + phone-number input.
//
//   [ +44 (UK) ▼ ] [ 7866 259562          ]
//
// Behaviour:
//   • The country code is selected from a dropdown (defaults to UK +44).
//   • The number input strips everything that isn't a digit so the
//     customer cannot type letters / symbols / spaces.
//   • The component is "controlled" by a single `value` string in
//     canonical E.164 form (e.g. "+447866259562"). On every keystroke or
//     country change it emits the freshly-combined E.164 string via
//     `onChange`. The parent never has to touch country / digits state.
//   • If the parent's incoming `value` already starts with one of the
//     known country codes, that code is auto-selected and the rest of
//     the digits become the number — so a previously-typed "+447…" is
//     re-hydrated correctly.
//   • If the user pastes a number that begins with the currently-selected
//     country code, the prefix is stripped automatically (so pasting
//     "+44 7866 259562" while UK is selected becomes "7866 259562").
//   • Total E.164 length is capped at 15 digits (international standard).
// ─────────────────────────────────────────────────────────────────────────

export interface CountryEntry {
  /** Numeric dialling code without "+" (e.g. "44"). */
  code: string;
  /** Two-letter label shown beside the code in the dropdown (e.g. "UK"). */
  short: string;
  /** Full country name shown in the dropdown options. */
  name: string;
}

// Common European destinations the customer asked for, plus a curated set
// of other common origin countries. Order: requested countries first,
// then a broader set alphabetised by full name.
export const COUNTRIES: CountryEntry[] = [
  { code: "44",  short: "UK",  name: "United Kingdom" },
  { code: "380", short: "UA",  name: "Ukraine" },
  { code: "48",  short: "PL",  name: "Poland" },
  { code: "39",  short: "IT",  name: "Italy" },
  { code: "33",  short: "FR",  name: "France" },
  { code: "49",  short: "DE",  name: "Germany" },
  { code: "34",  short: "ES",  name: "Spain" },
  { code: "40",  short: "RO",  name: "Romania" },
  { code: "373", short: "MD",  name: "Moldova" },
  // Other common countries
  { code: "61",  short: "AU",  name: "Australia" },
  { code: "43",  short: "AT",  name: "Austria" },
  { code: "32",  short: "BE",  name: "Belgium" },
  { code: "55",  short: "BR",  name: "Brazil" },
  { code: "359", short: "BG",  name: "Bulgaria" },
  { code: "1",   short: "CA",  name: "Canada" },
  { code: "86",  short: "CN",  name: "China" },
  { code: "385", short: "HR",  name: "Croatia" },
  { code: "357", short: "CY",  name: "Cyprus" },
  { code: "420", short: "CZ",  name: "Czechia" },
  { code: "45",  short: "DK",  name: "Denmark" },
  { code: "372", short: "EE",  name: "Estonia" },
  { code: "358", short: "FI",  name: "Finland" },
  { code: "30",  short: "GR",  name: "Greece" },
  { code: "36",  short: "HU",  name: "Hungary" },
  { code: "91",  short: "IN",  name: "India" },
  { code: "353", short: "IE",  name: "Ireland" },
  { code: "972", short: "IL",  name: "Israel" },
  { code: "371", short: "LV",  name: "Latvia" },
  { code: "370", short: "LT",  name: "Lithuania" },
  { code: "352", short: "LU",  name: "Luxembourg" },
  { code: "356", short: "MT",  name: "Malta" },
  { code: "31",  short: "NL",  name: "Netherlands" },
  { code: "64",  short: "NZ",  name: "New Zealand" },
  { code: "47",  short: "NO",  name: "Norway" },
  { code: "92",  short: "PK",  name: "Pakistan" },
  { code: "351", short: "PT",  name: "Portugal" },
  { code: "974", short: "QA",  name: "Qatar" },
  { code: "7",   short: "RU",  name: "Russia / Kazakhstan" },
  { code: "966", short: "SA",  name: "Saudi Arabia" },
  { code: "381", short: "RS",  name: "Serbia" },
  { code: "65",  short: "SG",  name: "Singapore" },
  { code: "421", short: "SK",  name: "Slovakia" },
  { code: "386", short: "SI",  name: "Slovenia" },
  { code: "27",  short: "ZA",  name: "South Africa" },
  { code: "46",  short: "SE",  name: "Sweden" },
  { code: "41",  short: "CH",  name: "Switzerland" },
  { code: "90",  short: "TR",  name: "Turkey" },
  { code: "971", short: "AE",  name: "United Arab Emirates" },
  { code: "1",   short: "US",  name: "United States" },
];

const DEFAULT_COUNTRY_CODE = "44";

// Country codes sorted longest-first so we match "+380" before "+38".
const SORTED_CODES = [...new Set(COUNTRIES.map((c) => c.code))].sort(
  (a, b) => b.length - a.length,
);

/** Split a stored E.164 string into { countryCode, digits }. */
export function parseE164(value: string): { countryCode: string; digits: string } {
  const v = (value ?? "").trim();
  if (v.startsWith("+")) {
    const allDigits = v.slice(1).replace(/\D/g, "");
    for (const code of SORTED_CODES) {
      if (allDigits.startsWith(code)) {
        return { countryCode: code, digits: allDigits.slice(code.length) };
      }
    }
    // Unknown country code — keep digits, default the visible country.
    return { countryCode: DEFAULT_COUNTRY_CODE, digits: allDigits };
  }
  const digits = v.replace(/\D/g, "");
  return { countryCode: DEFAULT_COUNTRY_CODE, digits };
}

interface PhoneFieldProps {
  /** Current value in canonical E.164 form (e.g. "+447866259562"). */
  value: string;
  /** Called with the freshly-combined E.164 string on every change. */
  onChange: (e164: string) => void;
  onBlur?: () => void;
  /** Render the input with an error border when true. */
  invalid?: boolean;
  required?: boolean;
  /** data-testid prefix for both the country select and the digits input. */
  testId?: string;
  autoComplete?: string;
  placeholder?: string;
}

export default function PhoneField({
  value,
  onChange,
  onBlur,
  invalid,
  required,
  testId,
  autoComplete = "tel-national",
  placeholder = "7866 259562",
}: PhoneFieldProps) {
  // We keep an internal copy of country + digits so the user's chosen
  // country sticks even when the digits field is empty (and so the
  // controlled <select> always has a value).
  const initial = useMemo(() => parseE164(value), [value]);
  const [country, setCountry] = useState(initial.countryCode);
  const [digits, setDigits] = useState(initial.digits);

  // Re-hydrate from `value` when it changes from outside (e.g. the parent
  // resets the form after submit). We DON'T re-hydrate on every keystroke
  // because that would fight the user's local typing.
  const lastEmittedRef = useRef<string>(initial.digits ? `+${country}${initial.digits}` : "");
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const parsed = parseE164(value);
    setCountry(parsed.countryCode);
    setDigits(parsed.digits);
    lastEmittedRef.current = value;
  }, [value]);

  function emit(nextCountry: string, nextDigits: string) {
    const combined = nextDigits ? `+${nextCountry}${nextDigits}` : "";
    lastEmittedRef.current = combined;
    onChange(combined);
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextCountry = e.target.value;
    setCountry(nextCountry);
    emit(nextCountry, digits);
  }

  function handleDigitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip everything that isn't a digit (no letters, spaces, symbols).
    let next = e.target.value.replace(/\D/g, "");
    // If the user pasted a number that starts with the current country
    // code's digits, drop the duplicate prefix automatically.
    if (next.startsWith(country) && next.length > country.length) {
      next = next.slice(country.length);
    }
    // Drop a leading "0" — most European mobile / landline formats include
    // a national trunk "0" that must not appear in E.164.
    if (next.startsWith("0")) next = next.replace(/^0+/, "");
    // Cap at the largest possible national number (E.164 = max 15 digits
    // total, so national digits = 15 − country code length).
    const maxNational = Math.max(1, 15 - country.length);
    if (next.length > maxNational) next = next.slice(0, maxNational);
    setDigits(next);
    emit(country, next);
  }

  const idCountry = testId ? `${testId}-country` : undefined;
  const idDigits = testId ? `${testId}-number` : undefined;

  return (
    <div
      className={`flex items-stretch w-full border rounded-xl bg-white overflow-hidden focus-within:ring-2 ${
        invalid
          ? "border-red-300 focus-within:ring-red-400"
          : "border-gray-200 focus-within:ring-purple-500"
      }`}
    >
      <div className="relative shrink-0 border-r border-gray-200">
        <select
          aria-label="Country code"
          value={country}
          onChange={handleCountryChange}
          onBlur={onBlur}
          data-testid={idCountry}
          className="appearance-none h-full bg-gray-50 pl-3 pr-7 text-sm text-gray-700 focus:outline-none cursor-pointer"
        >
          {COUNTRIES.map((c) => (
            <option key={`${c.code}-${c.short}`} value={c.code}>
              +{c.code} {c.short} — {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={digits}
        onChange={handleDigitsChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        data-testid={idDigits}
        className="flex-1 min-w-0 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
      />
    </div>
  );
}
