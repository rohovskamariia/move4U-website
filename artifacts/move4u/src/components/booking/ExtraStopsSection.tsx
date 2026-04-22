import { Plus, X, MapPin } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

interface ExtraStopsSectionProps {
  stops: string[];
  onChange: (next: string[]) => void;
}

export default function ExtraStopsSection({ stops, onChange }: ExtraStopsSectionProps) {
  const addStop = () => onChange([...stops, ""]);
  const removeStop = (i: number) => onChange(stops.filter((_, idx) => idx !== i));
  const updateStop = (i: number, val: string) =>
    onChange(stops.map((s, idx) => (idx === i ? val : s)));

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="text-sm font-semibold text-gray-700">
          Additional stops on the route{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        {stops.length > 0 && (
          <span className="text-[11px] text-gray-400">
            {stops.length} stop{stops.length === 1 ? "" : "s"} added
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        If you need to collect or deliver items at more than one extra address
        between the pickup and the final destination, add those stops here.
        We'll visit them in order on the way.
      </p>

      {stops.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {stops.map((s, i) => (
            <div key={i} className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium text-gray-600">
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
              <AddressAutocomplete
                value={s}
                onChange={(val) => updateStop(i, val)}
                placeholder="Address or postcode for this stop..."
                testId={`extra-stop-${i}`}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addStop}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-purple-700 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors"
        data-testid="add-extra-stop"
      >
        <Plus className="w-4 h-4" />
        {stops.length === 0 ? "Add an additional stop" : "Add another stop"}
        {stops.length === 0 && <MapPin className="w-3.5 h-3.5 opacity-50" />}
      </button>
    </div>
  );
}
