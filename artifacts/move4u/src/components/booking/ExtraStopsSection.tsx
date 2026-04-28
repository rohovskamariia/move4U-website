import type { Dispatch, SetStateAction } from "react";
import { Plus, X } from "lucide-react";
import AddressStep from "./AddressStep";

/**
 * Additional stop on the route. Mirrors the data model used by Pickup and
 * Drop-off so we can ask the SAME access questions for every address.
 */
export interface ExtraStop {
  address: string;
  /** "" | "none" | "yes" | "no" — same encoding as pickup/drop-off lift state. */
  liftValue: string;
  /** "" | "none" | "lift" | "0" | "1" | ... — same encoding as pickup/drop-off floor state. */
  floorValue: string;
}

export const EMPTY_EXTRA_STOP: ExtraStop = {
  address: "",
  liftValue: "",
  floorValue: "",
};

interface ExtraStopsSectionProps {
  stops: ExtraStop[];
  /**
   * The parent's React state setter — passed directly so that every update
   * inside this section uses a functional update against the LATEST state.
   *
   * This matters because StairsAccessSection fires two synchronous updates
   * back-to-back when the user taps "No" (onLiftChange + onFloorChange).
   * If we used a plain `(next) => void` callback that closes over `stops`,
   * the second call would read a stale array and overwrite the first one,
   * so taps appeared to do nothing. Functional updates compose correctly.
   */
  setStops: Dispatch<SetStateAction<ExtraStop[]>>;
}

export default function ExtraStopsSection({ stops, setStops }: ExtraStopsSectionProps) {
  const addStop = () =>
    setStops((prev) => [...prev, { ...EMPTY_EXTRA_STOP }]);
  const removeStop = (i: number) =>
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  const updateStop = (i: number, patch: Partial<ExtraStop>) =>
    setStops((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );

  return (
    <div className="border-t border-gray-100 pt-4">
      {/* Minimal header — single title line, no explanatory paragraph.
          Uber / Bolt style: the user just sees a clean optional control
          and a button to add a stop. The detailed access questions still
          appear inside each stop card once added, so functionality is
          unchanged — only the surrounding copy is simplified. */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-gray-700">
          Additional stop{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        {stops.length > 0 && (
          <span className="text-[11px] text-gray-400">
            {stops.length} added
          </span>
        )}
      </div>

      {stops.length > 0 && (
        <div className="space-y-3 mb-3">
          {stops.map((stop, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              data-testid={`extra-stop-card-${i}`}
            >
              {/* Header row with neutral badge + remove button. The badge stays
                  small + grey so primary CTA purple keeps all visual weight. */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                  {i + 1}
                </span>
                <span className="text-[12px] font-semibold text-gray-700">
                  Additional stop {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-600 transition-colors"
                  aria-label={`Remove additional stop ${i + 1}`}
                  data-testid={`remove-stop-${i}`}
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>

              {/* Reuse the EXACT same AddressStep used by pickup/drop-off so
                  the address autocomplete + stairs & access questions are
                  identical. */}
              <AddressStep
                label={`Additional stop ${i + 1} address`}
                addressValue={stop.address}
                onAddressChange={(val) => updateStop(i, { address: val })}
                liftValue={stop.liftValue}
                onLiftChange={(val) => updateStop(i, { liftValue: val })}
                floorValue={stop.floorValue}
                onFloorChange={(val) => updateStop(i, { floorValue: val })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Secondary action — neutral until hover. Keeps the primary Continue
          button as the only strong-purple element on the screen. */}
      <button
        type="button"
        onClick={addStop}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 border-2 border-dashed border-gray-200 rounded-xl bg-white hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        data-testid="add-extra-stop"
      >
        <Plus className="w-4 h-4" />
        Add another stop
      </button>
    </div>
  );
}
