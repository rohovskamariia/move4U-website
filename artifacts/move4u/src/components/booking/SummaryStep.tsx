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

      {/* Prominent total — sits at the top so the price is the first thing
          the user sees. Uses the brand purple gradient for emphasis. */}
      <div
        className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #5b3fb8 0%, #4a319c 55%, #3a267f 100%)",
          boxShadow: "0 10px 30px -12px rgba(74,49,156,0.45)",
        }}
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-white uppercase mb-1">
          Estimated total
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-4xl font-bold tracking-tight tabular-nums"
            data-testid="summary-total"
          >
            £{estimatedTotal.toFixed(0)}
          </span>
          <span className="text-white text-sm font-medium">
            £{hourlyRate}/hr × {formatTime(hours)}
            {totalExtras > 0 ? ` + £${totalExtras} access` : ""}
          </span>
        </div>
      </div>

      {/* Compact line-item list — tighter rows, single subtle background. */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-5 divide-y divide-gray-50">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex justify-between items-baseline gap-3 px-4 py-2 text-[13px]"
          >
            <span className="text-gray-500 shrink-0">{row.label}</span>
            <span className="font-medium text-gray-900 text-right truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {notes && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-5 text-[13px] text-gray-600">
          <p className="font-medium text-gray-900 mb-0.5 text-xs">Notes</p>
          {notes}
        </div>
      )}

      <button
        onClick={onContinue}
        className="btn-purple w-full py-3.5 font-semibold rounded-xl text-sm"
        data-testid="continue-booking"
      >
        Continue booking
      </button>
    </div>
  );
}
