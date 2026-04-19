import { useEffect, useRef, useState } from "react";
import { Hash } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import StairsAccessSection from "./StairsAccessSection";

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
  // Track the last "core" address that came from Google so we can rebuild
  // the final string whenever the user edits the unit number.
  const coreAddressRef = useRef<string>(addressValue);

  const commit = (core: string, unit: string) => {
    const trimmedUnit = unit.trim();
    coreAddressRef.current = core;
    if (trimmedUnit && core) {
      onAddressChange(`${trimmedUnit}, ${core}`);
    } else {
      onAddressChange(core);
    }
  };

  const handleAddressChange = (
    val: string,
    meta?: { hasStreetNumber: boolean },
  ) => {
    if (val === "") {
      setNeedsNumber(false);
      setUnitNumber("");
      coreAddressRef.current = "";
      onAddressChange("");
      return;
    }
    // Strip any previous unit prefix so we don't double up when re-picking.
    const core = stripPrefix(val, unitNumber.trim());
    const numberMissing = meta ? !meta.hasStreetNumber : false;
    setNeedsNumber(numberMissing);
    if (!numberMissing) setUnitNumber("");
    commit(core, numberMissing ? unitNumber : "");
  };

  const handleUnitChange = (val: string) => {
    setUnitNumber(val);
    commit(coreAddressRef.current, val);
  };

  // Keep things consistent if parent resets the address externally.
  useEffect(() => {
    if (addressValue === "") {
      setNeedsNumber(false);
      setUnitNumber("");
      coreAddressRef.current = "";
    }
  }, [addressValue]);

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
