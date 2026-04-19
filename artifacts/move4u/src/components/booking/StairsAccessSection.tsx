import { Minus, Plus } from "lucide-react";

/**
 * Stairs & access — reusable section used by every booking flow.
 *
 * Question flow (one step at a time, never ahead of the user):
 *
 *   1. "Are there any stairs / flights?"  Yes / No
 *      - No  → no further questions, no surcharge.
 *      - Yes → reveal step 2.
 *   2. "Is a lift available?"  Yes / No
 *      - Yes → no surcharge ("Lift available").
 *      - No  → reveal step 3.
 *   3. Floor stepper [-] N [+] starting at ground (0). Each floor adds
 *      £10. No upper limit. A live "Stairs cost" readout appears.
 *
 * State model (unchanged at the parent — these flows already use it):
 *   - liftValue: "" | "none" | "yes" | "no"
 *       "none" = the user said there are no stairs at all (step 1 = No).
 *       "yes"  = stairs exist + lift available.
 *       "no"   = stairs exist + no lift.
 *   - floorValue:
 *       "none" when liftValue === "none"
 *       "lift" when liftValue === "yes"
 *       "0" / "1" / "2" / ... when liftValue === "no"
 */
export const FLOOR_PRICE = 10;

export function getFloorChargeFromValue(floorValue: string): number {
  if (!floorValue || floorValue === "lift" || floorValue === "none") return 0;
  // Backward-compat with the old keyed values that still live in saved
  // state (first/second/third/fourth). We translate them to a number.
  const legacy: Record<string, number> = {
    ground: 0,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth_plus: 5,
  };
  if (floorValue in legacy) return legacy[floorValue] * FLOOR_PRICE;
  const n = parseInt(floorValue, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return n * FLOOR_PRICE;
}

export function getFloorLabelFromValue(floorValue: string): string {
  if (!floorValue) return "—";
  if (floorValue === "none") return "No stairs";
  if (floorValue === "lift") return "Lift available";
  // Backward-compat
  const legacy: Record<string, string> = {
    ground: "Ground floor",
    first: "Floor 1",
    second: "Floor 2",
    third: "Floor 3",
    fourth: "Floor 4",
    fifth_plus: "Floor 5+",
  };
  if (floorValue in legacy) return legacy[floorValue];
  const n = parseInt(floorValue, 10);
  if (Number.isNaN(n)) return "—";
  if (n === 0) return "Ground floor";
  return `Floor ${n}`;
}

interface StairsAccessSectionProps {
  /** Optional title — defaults to "Stairs & access". */
  title?: string;
  liftValue: string; // "" | "none" | "yes" | "no"
  onLiftChange: (val: "none" | "yes" | "no") => void;
  floorValue: string; // "none" | "lift" | "0" | "1" | ...
  onFloorChange: (val: string) => void;
  /** Test-id suffix so multiple instances on the same page stay unique. */
  testIdSuffix?: string;
}

export default function StairsAccessSection({
  title = "Stairs & access",
  liftValue,
  onLiftChange,
  floorValue,
  onFloorChange,
  testIdSuffix = "",
}: StairsAccessSectionProps) {
  // Derive the answer to step 1 from the existing state.
  //   ""     → unanswered
  //   "no"   → user answered "No stairs"
  //   "yes"  → user answered "Yes, there are stairs"
  const hasStairs: "" | "yes" | "no" =
    liftValue === "none"
      ? "no"
      : liftValue === "yes" || liftValue === "no"
      ? "yes"
      : "";

  // Parse the current floor as a number for the stepper.
  const parsedFloor = (() => {
    if (!floorValue || floorValue === "lift" || floorValue === "none") return 0;
    const legacy: Record<string, number> = {
      ground: 0, first: 1, second: 2, third: 3, fourth: 4, fifth_plus: 5,
    };
    if (floorValue in legacy) return legacy[floorValue];
    const n = parseInt(floorValue, 10);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  })();

  const stairsCost = liftValue === "no" ? parsedFloor * FLOOR_PRICE : 0;
  const idSuffix = testIdSuffix ? `-${testIdSuffix}` : "";

  const setHasStairs = (val: "yes" | "no") => {
    if (val === "no") {
      onLiftChange("none");
      onFloorChange("none");
    } else {
      // Stairs exist — reset lift / floor so the user must answer step 2.
      onLiftChange("yes");
      onFloorChange("lift");
    }
  };

  const setLift = (val: "yes" | "no") => {
    onLiftChange(val);
    if (val === "yes") onFloorChange("lift");
    else onFloorChange("0"); // start the stepper at ground floor
  };

  const setFloor = (next: number) => {
    const safe = Math.max(0, next);
    onFloorChange(String(safe));
  };

  return (
    <div
      className="bg-white border rounded-2xl p-4 sm:p-5"
      style={{ borderColor: "rgb(238 238 242)" }}
      data-testid={`stairs-access${idSuffix}`}
    >
      <h4 className="text-[15px] font-semibold text-gray-900 tracking-tight">
        {title}
      </h4>
      <p className="text-[12.5px] text-gray-500 mt-1 leading-relaxed">
        Stairs may affect the final price when there is no lift available.
      </p>

      {/* Step 1 — Are there any stairs / flights? */}
      <div className="mt-4">
        <p className="text-[13px] font-semibold text-gray-700 mb-2">
          Are there any stairs / flights?
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {(["no", "yes"] as const).map((opt) => {
            const selected = hasStairs === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setHasStairs(opt)}
                aria-pressed={selected}
                className={`py-3 rounded-xl text-[14px] font-semibold transition-all border-2 ${
                  selected
                    ? "border-purple-700 bg-purple-700 text-white shadow-[0_6px_16px_-8px_rgba(109,40,217,0.5)]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/40"
                }`}
                data-testid={`has-stairs-${opt}${idSuffix}`}
              >
                {opt === "no" ? "No" : "Yes"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Lift toggle (only when stairs = Yes) */}
      {hasStairs === "yes" && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-gray-700 mb-2">
            Is a lift available?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {(["yes", "no"] as const).map((opt) => {
              const selected = liftValue === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLift(opt)}
                  aria-pressed={selected}
                  className={`py-3 rounded-xl text-[14px] font-semibold transition-all border-2 ${
                    selected
                      ? "border-purple-700 bg-purple-700 text-white shadow-[0_6px_16px_-8px_rgba(109,40,217,0.5)]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/40"
                  }`}
                  data-testid={`lift-${opt}${idSuffix}`}
                >
                  {opt === "yes" ? "Yes" : "No"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Floor stepper (only when stairs = Yes AND lift = No) */}
      {hasStairs === "yes" && liftValue === "no" && (
        <div className="mt-4">
          <p className="text-[13px] font-semibold text-gray-700">Floor level</p>
          <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
            Please select the floor. £{FLOOR_PRICE} is added per floor when no
            lift is available.
          </p>

          <div className="mt-3 flex items-center gap-3 bg-purple-50/60 border border-purple-100 rounded-2xl p-2">
            <button
              type="button"
              onClick={() => setFloor(parsedFloor - 1)}
              disabled={parsedFloor <= 0}
              aria-label="Decrease floor"
              className="w-12 h-12 rounded-xl bg-white border border-purple-200 text-purple-700 flex items-center justify-center hover:bg-purple-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              data-testid={`floor-minus${idSuffix}`}
            >
              <Minus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div className="flex-1 text-center">
              <p
                className="text-2xl font-bold text-purple-700 tabular-nums leading-none"
                data-testid={`floor-value${idSuffix}`}
              >
                {parsedFloor}
              </p>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-purple-700/70 mt-1">
                {parsedFloor === 0 ? "Ground floor" : `Floor ${parsedFloor}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFloor(parsedFloor + 1)}
              aria-label="Increase floor"
              className="w-12 h-12 rounded-xl bg-purple-700 text-white flex items-center justify-center hover:bg-purple-800 active:scale-95 transition-all"
              data-testid={`floor-plus${idSuffix}`}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Live cost readout */}
          <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-[13px] font-medium text-gray-700">
              Stairs cost
            </span>
            <span
              className="text-[15px] font-bold text-purple-700 tabular-nums"
              data-testid={`stairs-cost${idSuffix}`}
            >
              +£{stairsCost}
            </span>
          </div>
        </div>
      )}

      {/* Reassuring readout when no surcharge applies */}
      {hasStairs === "no" && (
        <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <span className="text-[13px] font-medium text-emerald-800">
            No stairs — no surcharge
          </span>
          <span className="text-[15px] font-bold text-emerald-700 tabular-nums">
            +£0
          </span>
        </div>
      )}

      {hasStairs === "yes" && liftValue === "yes" && (
        <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <span className="text-[13px] font-medium text-emerald-800">
            Lift available — no stairs surcharge
          </span>
          <span className="text-[15px] font-bold text-emerald-700 tabular-nums">
            +£0
          </span>
        </div>
      )}

      <p className="text-[11.5px] text-gray-500 mt-3 leading-relaxed">
        Final price may vary depending on access and loading conditions.
      </p>
    </div>
  );
}
