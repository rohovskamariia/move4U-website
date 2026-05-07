import { useEffect, useRef, useState } from "react";
import { Hash, MapPin, Pencil, Search } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import StairsAccessSection from "./StairsAccessSection";
import { hasFullUKPostcode, isUKAddressMissingFullPostcode } from "@/lib/postcode";

interface AddressStepProps {
  label: string;
  addressValue: string;
  onAddressChange: (val: string) => void;
  /** Kept for backwards compatibility — no longer rendered. The lift
   *  toggle now drives everything in the redesigned stairs section. */
  stairsValue?: string;
  onStairsChange?: (val: string) => void;
  liftValue: string;
  onLiftChange: (val: string) => void;
  floorValue: string;
  onFloorChange: (val: string) => void;
  /** Live surcharge — used by the parent to update the running total. */
  extraCharge?: number;
}

/**
 * Returns the "core" part of an address (everything before any house/flat
 * prefix we previously injected) so we can re-prefix without doubling up.
 * The prefix is stored as e.g. `Flat 2A, ` at the very start of the string.
 */
function stripPrefix(addr: string, prefix: string): string {
  if (prefix && addr.startsWith(`${prefix}, `)) {
    return addr.slice(prefix.length + 2);
  }
  return addr;
}

interface ManualFields {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

const EMPTY_MANUAL: ManualFields = {
  line1: "",
  line2: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
};

function composeManual(f: ManualFields): string {
  const postcode = f.postcode.trim().toUpperCase();
  const parts = [
    f.line1.trim(),
    f.line2.trim(),
    f.city.trim(),
    postcode,
    f.country.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}

// Reusable address step with stair/lift/floor logic
// Used for both pickup and drop-off steps
export default function AddressStep({
  label,
  addressValue,
  onAddressChange,
  liftValue,
  onLiftChange,
  floorValue,
  onFloorChange,
}: AddressStepProps) {
  // Mode switch: Google autocomplete (default) vs structured manual entry.
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState<ManualFields>(EMPTY_MANUAL);

  // House / flat / unit number — required when Google returned a street
  // without a number (route-only or postcode-only result).
  const [needsNumber, setNeedsNumber] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");
  // Postcode prompt — shown when the chosen / typed UK address is
  // missing the inward part of its postcode (e.g. "London N22, UK").
  const [needsPostcode, setNeedsPostcode] = useState(false);
  const [manualPostcode, setManualPostcode] = useState("");
  // Track the last "core" address that came from Google so we can rebuild
  // the final string whenever the user edits the unit number.
  const coreAddressRef = useRef<string>(addressValue);

  const slug = label.toLowerCase().replace(/\s/g, "-");

  const commit = (core: string, unit: string, postcode: string) => {
    const trimmedUnit = unit.trim();
    const trimmedPostcode = postcode.trim().toUpperCase();
    coreAddressRef.current = core;
    let result = core;
    if (trimmedUnit && core) result = `${trimmedUnit}, ${core}`;
    // Append the manual postcode only if the core text doesn't already
    // contain a full UK postcode — avoids duplicates when Google supplied
    // it but the user typed one anyway.
    if (trimmedPostcode && !hasFullUKPostcode(result)) {
      result = `${result}, ${trimmedPostcode}`;
    }
    onAddressChange(result);
  };

  const handleAddressChange = (
    val: string,
    meta?: { hasStreetNumber: boolean; hasFullPostcode?: boolean },
  ) => {
    if (val === "") {
      setNeedsNumber(false);
      setUnitNumber("");
      setNeedsPostcode(false);
      setManualPostcode("");
      coreAddressRef.current = "";
      onAddressChange("");
      return;
    }
    // Strip any previous unit prefix so we don't double up when re-picking.
    const core = stripPrefix(val, unitNumber.trim());
    const numberMissing = meta ? !meta.hasStreetNumber : false;
    setNeedsNumber(numberMissing);
    if (!numberMissing) setUnitNumber("");

    // Decide whether we need to ask for a postcode. We trust the meta
    // hint from the input when present, then fall back to scanning the
    // text ourselves so manual entry is also covered.
    const hasFullFromMeta = meta?.hasFullPostcode === true;
    const postcodeMissing = !hasFullFromMeta && isUKAddressMissingFullPostcode(core);
    setNeedsPostcode(postcodeMissing);
    if (!postcodeMissing) setManualPostcode("");

    commit(
      core,
      numberMissing ? unitNumber : "",
      postcodeMissing ? manualPostcode : "",
    );
  };

  const handleUnitChange = (val: string) => {
    setUnitNumber(val);
    commit(coreAddressRef.current, val, needsPostcode ? manualPostcode : "");
  };

  const handlePostcodeChange = (val: string) => {
    // Allow only postcode-shaped characters; auto-uppercase for clarity.
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 8);
    setManualPostcode(cleaned);
    commit(coreAddressRef.current, needsNumber ? unitNumber : "", cleaned);
  };

  // Keep things consistent if parent resets the address externally.
  useEffect(() => {
    if (addressValue === "") {
      setNeedsNumber(false);
      setUnitNumber("");
      setNeedsPostcode(false);
      setManualPostcode("");
      coreAddressRef.current = "";
      // Don't auto-leave manual mode on external reset — the user opted
      // into it. Just clear the field values.
      setManual(EMPTY_MANUAL);
    }
  }, [addressValue]);

  // Validate prefilled / externally-seeded addresses on mount (and any
  // time the parent injects a brand-new value that we haven't processed
  // yet — e.g. quick-quote handoff from /house-moving or /waste-removal).
  // Without this, an incomplete prefilled UK address would never trigger
  // the inline house-number / postcode prompts — the parent's
  // `canProceed` would silently disable the Continue button with no
  // obvious way for the user to fix it. We only run this when the input
  // arrives ALREADY filled (not on every keystroke) so it doesn't fight
  // the autocomplete handler.
  const prefillSeenRef = useRef<string>("");
  useEffect(() => {
    if (!addressValue) return;
    if (prefillSeenRef.current === addressValue) return;
    prefillSeenRef.current = addressValue;
    // Only treat as a "prefill" when this is the first non-empty value
    // we've seen (coreAddressRef is empty) — i.e. the user hasn't typed
    // anything yet. After that, the autocomplete handler owns the state.
    if (coreAddressRef.current && coreAddressRef.current !== addressValue) {
      return;
    }
    coreAddressRef.current = addressValue;
    // Mirror the autocomplete's `hasStreetNumber` meta hint with a text
    // heuristic — Google isn't in the loop on prefill, so we look at the
    // first token of the address. A street number is present when the
    // address starts with a digit ("12 High Street", "221B Baker St") or
    // with a recognised unit prefix ("Flat 2, ...", "Apt 4B ...").
    const trimmed = addressValue.trim();
    const startsWithNumber = /^\d/.test(trimmed);
    const startsWithUnitPrefix =
      /^(flat|apt|apartment|unit|suite|studio|house|no\.?)\s*\d/i.test(trimmed);
    const numberMissing = !startsWithNumber && !startsWithUnitPrefix;
    setNeedsNumber(numberMissing);
    setNeedsPostcode(isUKAddressMissingFullPostcode(addressValue));
  }, [addressValue]);

  const postcodeFilledOk = manualPostcode ? hasFullUKPostcode(manualPostcode) : false;

  const enterManualMode = () => {
    setManualMode(true);
    // Clear any in-flight autocomplete state so the two modes don't fight.
    setNeedsNumber(false);
    setUnitNumber("");
    setNeedsPostcode(false);
    setManualPostcode("");
    coreAddressRef.current = "";
    setManual(EMPTY_MANUAL);
    onAddressChange("");
  };

  const exitManualMode = () => {
    setManualMode(false);
    setManual(EMPTY_MANUAL);
    onAddressChange("");
  };

  const updateManual = (patch: Partial<ManualFields>) => {
    const next = { ...manual, ...patch };
    if (patch.postcode !== undefined) {
      next.postcode = patch.postcode
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, "")
        .slice(0, 8);
    }
    setManual(next);
    onAddressChange(composeManual(next));
  };

  const manualIsUK = /^uk$|united kingdom|great britain|england|scotland|wales|northern ireland/i.test(
    manual.country.trim(),
  );
  const manualPostcodeOk = manualIsUK
    ? hasFullUKPostcode(manual.postcode)
    : manual.postcode.trim().length > 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label} <span className="text-red-500">*</span>
        </label>

        {!manualMode && (
          <>
            <AddressAutocomplete
              value={addressValue}
              onChange={handleAddressChange}
              placeholder="Start typing postcode or address..."
              testId={`address-input-${slug}`}
            />
            <p className="text-[11.5px] text-gray-500 mt-1.5">
              Can&rsquo;t find your address?{" "}
              <button
                type="button"
                onClick={enterManualMode}
                className="text-purple-700 font-medium underline underline-offset-2 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-sm"
                data-testid={`enter-manual-${slug}`}
              >
                Enter it manually
              </button>
            </p>

            {needsPostcode && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Full postcode
                  <span className="text-red-500"> *</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={manualPostcode}
                    onChange={(e) => handlePostcodeChange(e.target.value)}
                    placeholder="e.g. N22 8HE"
                    className={`w-full border rounded-xl pl-10 pr-3 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      manualPostcode && !postcodeFilledOk
                        ? "border-amber-300"
                        : "border-gray-200"
                    }`}
                    autoComplete="postal-code"
                    inputMode="text"
                    spellCheck={false}
                    data-testid={`postcode-${slug}`}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  We need the full postcode (e.g. N22 8HE) so the driver can find you.
                </p>
              </div>
            )}

            {needsNumber && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  House / flat / unit number
                  <span className="text-red-500"> *</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    placeholder="e.g. 27, Flat 3B, Unit 4"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoComplete="off"
                    inputMode="text"
                    data-testid={`unit-number-${slug}`}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  We need a building or flat number so the driver can find you.
                </p>
              </div>
            )}
          </>
        )}

        {manualMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-semibold">
                <Pencil className="w-3.5 h-3.5" />
                Manual address mode
              </div>
              <button
                type="button"
                onClick={exitManualMode}
                className="flex items-center gap-1 text-[11.5px] text-purple-700 font-medium hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-sm"
                data-testid={`exit-manual-${slug}`}
              >
                <Search className="w-3.5 h-3.5" />
                Use search instead
              </button>
            </div>

            <ManualField
              label="Address line 1"
              required
              placeholder="House/flat number and street"
              value={manual.line1}
              onChange={(v) => updateManual({ line1: v })}
              testId={`manual-line1-${slug}`}
              autoComplete="address-line1"
            />
            <ManualField
              label="Address line 2"
              placeholder="Apartment, building, floor (optional)"
              value={manual.line2}
              onChange={(v) => updateManual({ line2: v })}
              testId={`manual-line2-${slug}`}
              autoComplete="address-line2"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ManualField
                label="City"
                placeholder="e.g. London"
                value={manual.city}
                onChange={(v) => updateManual({ city: v })}
                testId={`manual-city-${slug}`}
                autoComplete="address-level2"
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Postcode
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  value={manual.postcode}
                  onChange={(e) => updateManual({ postcode: e.target.value })}
                  placeholder={manualIsUK ? "e.g. N22 8HE" : "Postal / ZIP code"}
                  className={`w-full border rounded-xl px-3 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    manual.postcode && !manualPostcodeOk
                      ? "border-amber-300"
                      : "border-gray-200"
                  }`}
                  autoComplete="postal-code"
                  spellCheck={false}
                  data-testid={`manual-postcode-${slug}`}
                />
              </div>
            </div>
            <ManualField
              label="Country"
              value={manual.country}
              onChange={(v) => updateManual({ country: v })}
              testId={`manual-country-${slug}`}
              autoComplete="country-name"
            />
            {manualIsUK && manual.postcode && !manualPostcodeOk && (
              <p className="text-[11px] text-amber-700">
                Please enter a full UK postcode (e.g. N22 8HE).
              </p>
            )}
          </div>
        )}
      </div>

      <StairsAccessSection
        liftValue={liftValue}
        onLiftChange={onLiftChange}
        floorValue={floorValue}
        onFloorChange={onFloorChange}
        testIdSuffix={slug}
      />
    </div>
  );
}

interface ManualFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  testId?: string;
  autoComplete?: string;
}

function ManualField({
  label,
  value,
  onChange,
  placeholder,
  required,
  testId,
  autoComplete,
}: ManualFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        autoComplete={autoComplete}
        data-testid={testId}
      />
    </div>
  );
}
