import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
        <input
          type="text"
          value={addressValue}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Start typing address..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          data-testid={`address-input-${label.toLowerCase().replace(/\s/g, "-")}`}
        />
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
