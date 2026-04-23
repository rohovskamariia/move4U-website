import {
  HELP_PRICING,
  VAN_SIZES,
  EXTRA_STOP_CHARGE,
  CONGESTION_CHARGE,
  OUTSIDE_M25_RATE,
  SINGLE_ITEM_PRICING,
} from "@/data/constants";
import {
  getFloorChargeFromValue,
  getFloorLabelFromValue,
} from "./StairsAccessSection";
import type { ExtraStop } from "./ExtraStopsSection";
import { countCongestionEntries } from "@/lib/congestionZone";
import { outsideM25MilesForRoute } from "@/lib/m25";
import { computeBaseServiceCharge, isSingleItem } from "@/lib/pricing";
import { Info } from "lucide-react";

interface SummaryStepProps {
  service: string;
  /** Service id used to switch pricing model (e.g. "single-item"). */
  serviceId?: string;
  pickup: string;
  pickupFloor: string;
  dropoff: string;
  dropoffFloor: string;
  /** Optional intermediate stops, in route order, between pickup and drop-off.
   *  Each stop carries the SAME stairs/lift/floor data as pickup and drop-off. */
  extraStops?: ExtraStop[];
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
  serviceId = "",
  pickup,
  pickupFloor,
  dropoff,
  dropoffFloor,
  extraStops = [],
  vanSize,
  helpOption,
  hours,
  notes,
  onContinue,
}: SummaryStepProps) {
  const singleItem = isSingleItem(serviceId);
  const cleanStops = extraStops.filter((s) => s.address.trim());
  const stopCharges = cleanStops.map((s) => getFloorChargeFromValue(s.floorValue));
  const stopChargesTotal = stopCharges.reduce((a, b) => a + b, 0);
  const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;
  let hourlyRate = pricing.noHelp;
  if (helpOption === "driver-help") hourlyRate = pricing.driverHelp;
  if (helpOption === "driver-plus-helper") hourlyRate = pricing.driverPlusHelper;

  const pickupCharge = getFloorChargeFromValue(pickupFloor);
  const dropoffCharge = getFloorChargeFromValue(dropoffFloor);

  // Each intermediate stop adds a flat per-stop fee on top of any
  // floor charge it contributes. Pickup and drop-off do NOT incur
  // this fee — they're already part of the base service.
  const extraStopFee = cleanStops.length * EXTRA_STOP_CHARGE;

  // Congestion Charge — counted PER ENTRY. Pickup, drop-off and each
  // intermediate stop in the CCZ each add £18.
  const congestionEntries = countCongestionEntries([
    pickup,
    dropoff,
    ...cleanStops.map((s) => s.address),
  ]);
  const congestionCharge = congestionEntries * CONGESTION_CHARGE;

  // Outside-M25 surcharge — automatic estimate based on postcode area.
  // Approximates the one-way distance from the M25 to the furthest
  // address; final mileage is reconciled on the day.
  const outsideM25Miles = outsideM25MilesForRoute([
    pickup,
    dropoff,
    ...cleanStops.map((s) => s.address),
  ]);
  const outsideM25Charge = outsideM25Miles * OUTSIDE_M25_RATE;

  const totalExtras = pickupCharge + dropoffCharge + stopChargesTotal + extraStopFee;
  const estimatedBase = computeBaseServiceCharge(serviceId, vanSize, helpOption, hours);
  const estimatedTotal =
    estimatedBase + totalExtras + congestionCharge + outsideM25Charge;

  const rows: { label: string; value: string }[] = [
    { label: "Service", value: service },
  ];
  if (singleItem) {
    rows.push({
      label: "Pricing",
      value: `£${SINGLE_ITEM_PRICING.baseCharge} up to 1h, then £${SINGLE_ITEM_PRICING.extraHalfHourRate}/30 min`,
    });
    rows.push({ label: "Van (for reference)", value: getVanLabel(vanSize) });
  } else {
    rows.push({ label: "Van size", value: getVanLabel(vanSize) });
    rows.push({ label: "Help option", value: getHelpLabel(helpOption) });
    rows.push({ label: "Hourly rate", value: `£${hourlyRate}/hr` });
  }
  rows.push({ label: "Estimated time", value: formatTime(hours) });

  // Route shown in order: Pickup → Additional stop 1, 2, ... → Final destination.
  // We render this as its own card so the customer can clearly see the full
  // route before submitting.
  const routeRows: {
    badge: string;
    label: string;
    value: string;
    sub?: string;
    charge?: number;
  }[] = [];
  routeRows.push({
    badge: "P",
    label: "Pickup address",
    value: pickup || "—",
    sub: pickup ? getFloorLabelFromValue(pickupFloor) : undefined,
    charge: pickupCharge > 0 ? pickupCharge : undefined,
  });
  cleanStops.forEach((stop, i) => {
    const charge = stopCharges[i];
    const sub = stop.address ? getFloorLabelFromValue(stop.floorValue) : undefined;
    routeRows.push({
      badge: String(i + 1),
      label: `Additional stop ${i + 1}`,
      value: stop.address,
      sub: sub === "—" ? undefined : sub,
      charge: charge > 0 ? charge : undefined,
    });
  });
  routeRows.push({
    badge: "D",
    label: cleanStops.length > 0 ? "Final destination" : "Drop-off address",
    value: dropoff || "—",
    sub: dropoff ? getFloorLabelFromValue(dropoffFloor) : undefined,
    charge: dropoffCharge > 0 ? dropoffCharge : undefined,
  });

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
            {singleItem
              ? `Single Item — £${estimatedBase}`
              : `£${hourlyRate}/hr × ${formatTime(hours)}`}
            {totalExtras > 0 ? ` + £${totalExtras} extras` : ""}
            {congestionCharge > 0 ? ` + £${congestionCharge} CC*` : ""}
            {outsideM25Charge > 0 ? ` + £${outsideM25Charge} M25*` : ""}
          </span>
        </div>
        {(congestionCharge > 0 || outsideM25Charge > 0) && (
          <p className="text-[11px] text-white/80 mt-2">
            {congestionCharge > 0 &&
              `*Includes £${congestionCharge} Congestion Charge (${congestionEntries} entr${congestionEntries === 1 ? "y" : "ies"} × £${CONGESTION_CHARGE})`}
            {congestionCharge > 0 && outsideM25Charge > 0 ? " · " : ""}
            {outsideM25Charge > 0 &&
              `Outside-M25 estimate: ~${outsideM25Miles} mi × £${OUTSIDE_M25_RATE}`}
          </p>
        )}
      </div>

      {/* Extras breakdown — shown only when there are conditional or
          per-stop charges so the customer understands exactly what
          makes up the total. */}
      {(extraStopFee > 0 || congestionCharge > 0 || outsideM25Charge > 0) && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 divide-y divide-gray-50">
          {extraStopFee > 0 && (
            <div className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-900">
                  Additional stops
                </p>
                <p className="text-[11.5px] text-gray-500 mt-0.5">
                  £{EXTRA_STOP_CHARGE} × {cleanStops.length} stop
                  {cleanStops.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-purple-700 tabular-nums shrink-0">
                +£{extraStopFee}
              </span>
            </div>
          )}
          {congestionCharge > 0 && (
            <div
              className="flex items-start justify-between gap-3 px-4 py-2.5"
              data-testid="summary-congestion-charge"
            >
              <div className="min-w-0 flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    Congestion Charge ({congestionEntries} {congestionEntries === 1 ? "entry" : "entries"})
                  </p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    £{CONGESTION_CHARGE} per address inside the Central London zone.
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-semibold text-amber-600 tabular-nums shrink-0">
                +£{congestionCharge}
              </span>
            </div>
          )}
          {outsideM25Charge > 0 && (
            <div
              className="flex items-start justify-between gap-3 px-4 py-2.5"
              data-testid="summary-outside-m25-charge"
            >
              <div className="min-w-0 flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    Outside-M25 mileage (estimate)
                  </p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    ~{outsideM25Miles} miles × £{OUTSIDE_M25_RATE}/mile. Final mileage confirmed on the day.
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-semibold text-amber-600 tabular-nums shrink-0">
                +£{outsideM25Charge}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Route card — full ordered route with pickup, any extra stops, drop-off. */}
      <div
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4"
        data-testid="summary-route"
      >
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-500 uppercase">
            Route
          </p>
          {cleanStops.length > 0 && (
            <span className="text-[10.5px] font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5">
              {cleanStops.length} extra stop{cleanStops.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <ol className="px-4 pb-3 space-y-2.5">
          {routeRows.map((r, i) => {
            const isFirst = i === 0;
            const isLast = i === routeRows.length - 1;
            const isStop = !isFirst && !isLast;
            return (
              <li key={i} className="relative flex gap-3">
                {/* connector line */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[11px] top-6 bottom-[-12px] w-px bg-gray-200"
                  />
                )}
                <span
                  className={`relative z-10 mt-0.5 inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[10px] font-bold shrink-0 ${
                    isStop
                      ? "bg-purple-100 text-purple-700"
                      : "bg-purple-700 text-white"
                  }`}
                >
                  {r.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                    {r.label}
                  </p>
                  <p className="text-[13.5px] font-medium text-gray-900 leading-snug break-words">
                    {r.value}
                  </p>
                  {(r.sub || r.charge) && (
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {r.sub}
                      {r.sub && r.charge ? " · " : ""}
                      {r.charge ? (
                        <span className="text-purple-700 font-semibold">
                          +£{r.charge}
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
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
