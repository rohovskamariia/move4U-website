import { HELP_PRICING, VAN_SIZES } from "@/data/constants";
import {
  getFloorChargeFromValue,
  getFloorLabelFromValue,
} from "./StairsAccessSection";

interface SummaryStepProps {
  service: string;
  pickup: string;
  pickupFloor: string;
  dropoff: string;
  dropoffFloor: string;
  vanSize: string;
  helpOption: string;
  hours: number;
  notes: string;
  onContinue: () => void;
}

function getHelpLabel(id: string) {
  const labels: Record<string, string> = {
    "no-help": "No help needed",
    "driver-help": "Driver help",
    "driver-plus-helper": "Driver + helper",
  };
  return labels[id] || id;
}

function getVanLabel(id: string) {
  return VAN_SIZES.find((v) => v.id === id)?.name || id;
}

function formatTime(h: number) {
  const whole = Math.floor(h);
  const half = h % 1 !== 0;
  return `${whole}${half ? ".5" : ""}h`;
}

// Live booking summary with estimated price
export default function SummaryStep({
  service,
  pickup,
  pickupFloor,
  dropoff,
  dropoffFloor,
  vanSize,
  helpOption,
  hours,
  notes,
  onContinue,
}: SummaryStepProps) {
  const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;
  let hourlyRate = pricing.noHelp;
  if (helpOption === "driver-help") hourlyRate = pricing.driverHelp;
  if (helpOption === "driver-plus-helper") hourlyRate = pricing.driverPlusHelper;

  const pickupCharge = getFloorChargeFromValue(pickupFloor);
  const dropoffCharge = getFloorChargeFromValue(dropoffFloor);
  const totalExtras = pickupCharge + dropoffCharge;
  const estimatedBase = hourlyRate * hours;
  const estimatedTotal = estimatedBase + totalExtras;

  const rows = [
    { label: "Service", value: service },
    { label: "Pickup", value: pickup || "—" },
    pickup ? { label: "Pickup floor", value: getFloorLabelFromValue(pickupFloor) } : null,
    pickupCharge > 0 ? { label: "Pickup stair charge", value: `+£${pickupCharge}` } : null,
    { label: "Drop-off", value: dropoff || "—" },
    dropoff ? { label: "Drop-off floor", value: getFloorLabelFromValue(dropoffFloor) } : null,
    dropoffCharge > 0 ? { label: "Drop-off stair charge", value: `+£${dropoffCharge}` } : null,
    { label: "Van size", value: getVanLabel(vanSize) },
    { label: "Help option", value: getHelpLabel(helpOption) },
    { label: "Hourly rate", value: `£${hourlyRate}/hr` },
    { label: "Estimated time", value: formatTime(hours) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Booking summary</h3>
      <p className="text-gray-500 text-sm mb-5">Review your details before continuing.</p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden mb-5">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium text-gray-900 text-right max-w-[60%]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Estimated price */}
      <div className="rounded-xl p-4 mb-5 bg-purple-50 border border-purple-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 text-sm font-medium">Estimated total</span>
          <span className="text-2xl font-bold text-purple-700">
            £{estimatedTotal.toFixed(0)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Based on £{hourlyRate}/hr × {formatTime(hours)}
          {totalExtras > 0 ? ` + £${totalExtras} stair charges` : ""}
        </p>
      </div>

      {notes && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-0.5">Notes</p>
          {notes}
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm"
        data-testid="continue-booking"
      >
        Continue booking
      </button>
    </div>
  );
}
