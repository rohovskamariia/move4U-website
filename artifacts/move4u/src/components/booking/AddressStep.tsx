import { useEffect, useRef, useState } from "react";
import { Hash, MapPin } from "lucide-react";
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
    }
  }, [addressValue]);

  const postcodeFilledOk = manualPostcode ? hasFullUKPostcode(manualPostcode) : false;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
        <AddressAutocomplete
          value={addressValue}
          onChange={handleAddressChange}
          placeholder="Start typing postcode or address..."
          testId={`address-input-${label.toLowerCase().replace(/\s/g, "-")}`}
        />
        <p className="text-[11.5px] text-gray-500 mt-1.5">
          Can&rsquo;t find your address? Enter it manually.
        </p>

        {needsPostcode && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Full postcode
              <span className="text-purple-700"> *</span>
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
                data-testid={`postcode-${label.toLowerCase().replace(/\s/g, "-")}`}
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
              <span className="text-purple-700"> *</span>
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
                data-testid={`unit-number-${label.toLowerCase().replace(/\s/g, "-")}`}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              We need a building or flat number so the driver can find you.
            </p>
          </div>
        )}
      </div>

      <StairsAccessSection
        liftValue={liftValue}
        onLiftChange={onLiftChange}
        floorValue={floorValue}
        onFloorChange={onFloorChange}
        testIdSuffix={label.toLowerCase().replace(/\s/g, "-")}
      />
    </div>
  );
}
