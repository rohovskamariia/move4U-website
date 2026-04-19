import { useEffect, useRef, useState } from "react";
import { ChevronDown, Hash } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

interface AddressStepProps {
  label: string;
  addressValue: string;
  onAddressChange: (val: string) => void;
  stairsValue: string;
  onStairsChange: (val: string) => void;
  liftValue: string;
  onLiftChange: (val: string) => void;
  floorValue: string;
  onFloorChange: (val: string) => void;
  extraCharge: number;
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
  stairsValue,
  onStairsChange,
  liftValue,
  onLiftChange,
  floorValue,
  onFloorChange,
  extraCharge,
}: AddressStepProps) {
  const [showFloor, setShowFloor] = useState(false);
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

  const handleStairs = (val: string) => {
    onStairsChange(val);
    if (val === "no") {
      onLiftChange("");
      onFloorChange("none");
      setShowFloor(false);
    }
  };

  const handleLift = (val: string) => {
    onLiftChange(val);
    if (val === "yes") {
      onFloorChange("lift");
      setShowFloor(false);
    } else {
      onFloorChange("ground");
      setShowFloor(true);
    }
  };

  const floorOptions = [
    { value: "ground", label: "Ground / few steps", charge: 0 },
    { value: "first", label: "1st floor", charge: 10 },
    { value: "second", label: "2nd floor", charge: 20 },
    { value: "third", label: "3rd floor", charge: 30 },
    { value: "fourth", label: "4th floor", charge: 40 },
    { value: "fifth_plus", label: "5+ floors — contact us", charge: -1 },
  ];

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

      {/* Stairs question */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Any stairs / flights?</p>
        <div className="flex gap-3">
          {["No", "Yes"].map((opt) => (
            <button
              key={opt}
              onClick={() => handleStairs(opt.toLowerCase())}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                stairsValue === opt.toLowerCase()
                  ? "bg-purple-700 text-white border-purple-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
              }`}
              data-testid={`stairs-${opt.toLowerCase()}-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Lift question */}
        {stairsValue === "yes" && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Is there a lift?</p>
            <div className="flex gap-3">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleLift(opt.toLowerCase())}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    liftValue === opt.toLowerCase()
                      ? "bg-purple-700 text-white border-purple-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                  }`}
                  data-testid={`lift-${opt.toLowerCase()}-${label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floor dropdown — only if no lift */}
        {showFloor && liftValue === "no" && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Which floor?</p>
            <div className="relative">
              <select
                value={floorValue}
                onChange={(e) => onFloorChange(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid={`floor-select-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {floorOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} {f.charge > 0 ? `(+£${f.charge})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {floorValue === "fifth_plus" && (
              <p className="text-amber-600 text-xs mt-2">Please contact us directly for 5+ floor pricing.</p>
            )}
          </div>
        )}

        {liftValue === "yes" && (
          <p className="text-green-700 text-xs mt-3 font-medium">Lift available — no extra stair charge.</p>
        )}

        {extraCharge > 0 && (
          <div className="mt-3 bg-purple-50 rounded-lg px-3 py-2 text-xs font-medium text-purple-700">
            Stair surcharge: +£{extraCharge}
          </div>
        )}
      </div>
    </div>
  );
}
