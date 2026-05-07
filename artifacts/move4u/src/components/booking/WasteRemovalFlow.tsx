import { useEffect, useRef, useState } from "react";
import { BedDouble, Refrigerator, Circle, Armchair, ChevronLeft, ChevronDown, Info, Plus, Minus, Route, Check, Hash, Sparkles } from "lucide-react";
import { WASTE_LOADS, WASTE_EXTRA_ITEMS, CONGESTION_CHARGE, OUTSIDE_M25_RATE, EXTRA_STOP_CHARGE } from "@/data/constants";
import { isLikelyInCongestionZone } from "@/lib/congestionZone";
import { outsideM25MilesForRoute } from "@/lib/m25";
import { submitBooking, uploadPhotos } from "@/lib/api";
import WasteSizeModal from "@/components/WasteSizeModal";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import FinalDetailsStep from "./FinalDetailsStep";
import BookingSuccess from "./BookingSuccess";
import StairsAccessSection, {
  getFloorChargeFromValue,
  getFloorLabelFromValue,
} from "./StairsAccessSection";
import ExtraStopsSection, { type ExtraStop } from "./ExtraStopsSection";
import { isAddressAcceptable, isUKAddressMissingFullPostcode } from "@/lib/postcode";

/** Flat surcharge for restricted-access pickups (long carry, narrow lane, etc). */
const RESTRICTED_ACCESS_SURCHARGE = 10;

/** Minimum charge for any waste removal booking (£). */
const WASTE_MIN_CHARGE = 60;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BedDouble, Refrigerator, Circle, Armchair, Chair: Armchair,
};

interface WasteRemovalFlowProps {
  onBack: () => void;
  /**
   * Optional one-time seed for the collection address. Used by entry
   * points like /waste-removal that capture the address up-front and
   * hand it off via ?pickup=... so the user doesn't retype it. The
   * form remains the single source of truth from then on — this is
   * NOT a live binding.
   */
  initialPickup?: string;
}

// Waste removal booking flow
// Edit load prices in src/data/constants.ts (WASTE_LOADS)
// Edit extra item prices in src/data/constants.ts (WASTE_EXTRA_ITEMS)
export default function WasteRemovalFlow({ onBack, initialPickup = "" }: WasteRemovalFlowProps) {
  const [selectedLoad, setSelectedLoad] = useState("");
  /** Map of extra-item id → quantity. Quantity 0 = not selected. */
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Seeded once from `initialPickup` (if provided) so external entry
  // points like /waste-removal can pre-fill the collection address.
  // No other behaviour changes — the form owns the state from then on.
  const [pickup, setPickup] = useState(initialPickup);
  // House / flat / unit follow-up — shown when Google returned a street
  // without a number (e.g. route- or postcode-only result).
  const [needsUnit, setNeedsUnit] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");
  const corePickupRef = useRef<string>(initialPickup);

  const commitPickup = (core: string, unit: string) => {
    const u = unit.trim();
    corePickupRef.current = core;
    setPickup(u && core ? `${u}, ${core}` : core);
  };

  const handlePickupChange = (
    val: string,
    meta?: { hasStreetNumber: boolean },
  ) => {
    if (val === "") {
      setNeedsUnit(false);
      setUnitNumber("");
      corePickupRef.current = "";
      setPickup("");
      return;
    }
    const u = unitNumber.trim();
    const core = u && val.startsWith(`${u}, `) ? val.slice(u.length + 2) : val;
    const missing = meta ? !meta.hasStreetNumber : false;
    setNeedsUnit(missing);
    if (!missing) setUnitNumber("");
    commitPickup(core, missing ? unitNumber : "");
  };

  const handleUnitChange = (val: string) => {
    setUnitNumber(val);
    commitPickup(corePickupRef.current, val);
  };
  // Stairs & access — same model as the standard flow.
  const [liftValue, setLiftValue] = useState<string>("");
  const [floorValue, setFloorValue] = useState<string>("lift");
  const [restrictedAccess, setRestrictedAccess] = useState(false);
  // Additional collection stops — mirrors the House-Moving flow so a
  // single waste booking can cover multiple pickup addresses on one route.
  // Each stop carries its own address + stairs/lift/floor answers and is
  // priced exactly the same way (per-stop fee + per-stop floor surcharge).
  const [extraStops, setExtraStops] = useState<ExtraStop[]>([]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [step, setStep] = useState<"details" | "summary" | "final" | "submitted">("details");
  const [bookingRef, setBookingRef] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // Scroll to top whenever the step changes so the user always starts at
  // the top of the new step instead of the bottom of the previous one.
  // For the final "submitted" confirmation step we use an instant jump
  // (deferred a frame) so the user immediately sees the success icon and
  // booking reference — smooth scroll can be flaky on mobile browsers.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step === "submitted") {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const setQty = (id: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const selectedExtras = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const item = WASTE_EXTRA_ITEMS.find((i) => i.id === id);
      return { id, qty, label: item?.label ?? id, price: item?.price ?? 0 };
    });
  const hasItems = selectedExtras.length > 0;
  // Items Only mode — when the user has picked individual items we drop
  // the load-size requirement and price purely from items + access.
  const itemsOnlyMode = hasItems && !selectedLoad;
  const loadPrice = itemsOnlyMode
    ? 0
    : WASTE_LOADS.find((l) => l.id === selectedLoad)?.price || 0;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.qty, 0);
  const stairsCharge = getFloorChargeFromValue(floorValue);
  const accessCharge = restrictedAccess ? RESTRICTED_ACCESS_SURCHARGE : 0;
  // Per-stop floor surcharges — only count stops that actually have an
  // address typed in, so an empty placeholder card never inflates the price.
  const cleanExtraStops = extraStops.filter((s) => s.address.trim());
  const extraStopsFloorCharge = cleanExtraStops.reduce(
    (sum, s) => sum + getFloorChargeFromValue(s.floorValue),
    0,
  );
  // Flat per-stop fee — each additional collection point costs an extra
  // £EXTRA_STOP_CHARGE on top of any per-stop stairs surcharge. Same model
  // and constant the House-Moving (StandardBookingFlow) uses.
  const extraStopsFee = cleanExtraStops.length * EXTRA_STOP_CHARGE;
  const surchargeTotal =
    stairsCharge + accessCharge + extraStopsFloorCharge + extraStopsFee;
  // Congestion Charge — TfL's CCZ daily charge is a single flat fee per
  // vehicle per day. If ANY address on the route (pickup or any extra
  // collection stop) is inside the zone we add it ONCE, never multiplied
  // by the number of in-zone stops. Added on top of the calculated total
  // but BEFORE the minimum-charge floor so a CCZ pickup never gets
  // absorbed by the £60 min.
  const allAddresses = [pickup, ...cleanExtraStops.map((s) => s.address)];
  const inCongestionZone = isLikelyInCongestionZone(allAddresses);
  const congestionCharge = inCongestionZone ? CONGESTION_CHARGE : 0;
  // Outside-M25 mileage estimate — routed across pickup + every extra stop.
  // Outside-M25 portions are billed at £1/mile on top of the base.
  const outsideM25Miles = outsideM25MilesForRoute(allAddresses);
  const outsideM25Charge = outsideM25Miles * OUTSIDE_M25_RATE;
  const calculatedTotal = loadPrice + extrasTotal + surchargeTotal;
  // Minimum charge only kicks in once the user has actually picked something
  // (a load OR at least one item). An empty selection should still read £0.
  const hasSelection = !!selectedLoad || hasItems;
  const baseTotal = hasSelection
    ? Math.max(WASTE_MIN_CHARGE, calculatedTotal)
    : 0;
  const estimatedTotal =
    baseTotal + (hasSelection ? congestionCharge + outsideM25Charge : 0);
  const minChargeApplied = hasSelection && calculatedTotal < WASTE_MIN_CHARGE;

  // Per-step back navigation
  const goPrev = () => {
    if (step === "details") {
      onBack();
    } else if (step === "summary") {
      setStep("details");
    } else if (step === "final") {
      setStep("summary");
    }
  };

  const Header = () => (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={goPrev}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Go back"
        data-testid="waste-back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div>
        <h2 className="text-base font-bold text-gray-900">Waste Removal</h2>
        <p className="text-xs text-gray-400">
          {step === "details" ? "Step 1 of 3 — Details" : step === "summary" ? "Step 2 of 3 — Summary" : "Step 3 of 3 — Confirm"}
        </p>
      </div>
    </div>
  );

  if (step === "submitted") {
    return <BookingSuccess bookingRef={bookingRef} onCreateNew={onBack} />;
  }

  if (step === "final") {
    return (
      <div>
        <Header />
        <FinalDetailsStep
          onSubmit={async ({ date, timeWindow, name, phone, email, contactMethod }) => {
            const loadLabel = itemsOnlyMode
              ? "Items only"
              : (WASTE_LOADS.find((l) => l.id === selectedLoad)?.label ?? selectedLoad);
            const extraLabels = selectedExtras
              .map((e) => `${e.label} × ${e.qty} (£${e.price * e.qty})`)
              .join(", ");
            const accessNotes = [
              stairsCharge > 0
                ? `${getFloorLabelFromValue(floorValue)} — no lift (+£${stairsCharge})`
                : liftValue === "yes"
                ? "Lift available"
                : null,
              restrictedAccess ? `Restricted access +£${RESTRICTED_ACCESS_SURCHARGE}` : null,
            ]
              .filter(Boolean)
              .join(", ");
            // Upload photos first, then submit with their serving URLs
            const photoUrls = await uploadPhotos(photos);
            // Pre-format every additional collection address with its
            // own stairs/lift line so the team sees the full pickup
            // route at a glance in Telegram + Sheets — same shape as
            // the House-Moving formattedStops payload.
            const formattedExtraStops = cleanExtraStops.map((s) => {
              const stopFloor = getFloorChargeFromValue(s.floorValue);
              const accessLabel = getFloorLabelFromValue(s.floorValue);
              const parts: string[] = [];
              if (accessLabel && accessLabel !== "—") parts.push(accessLabel);
              if (stopFloor > 0) parts.push(`+£${stopFloor}`);
              return parts.length
                ? `${s.address.trim()} — ${parts.join(" ")}`
                : s.address.trim();
            });
            const extraAddressFormatted = formattedExtraStops
              .map((s, i) => `${i + 1}. ${s}`)
              .join(" | ");
            return await submitBooking({
              service: "Waste Removal",
              name,
              phone,
              email,
              contactMethod,
              pickup,
              pickupDetails: accessNotes,
              dropoff: "",
              dropoffDetails: "",
              extraAddress: extraAddressFormatted,
              vanSize: "",
              helpOption: "",
              peopleCount: "",
              estimatedPrice: `£${estimatedTotal}`,
              estimatedTime: "",
              date,
              timeWindow,
              wasteAddons: [extraLabels, accessNotes].filter(Boolean).join(" | "),
              uploadedFiles: photoUrls.join(", "),
              notes: [
                notes,
                `Load: ${loadLabel}`,
                extraStopsFee > 0
                  ? `Additional stops: ${cleanExtraStops.length} × £${EXTRA_STOP_CHARGE} = +£${extraStopsFee}`
                  : null,
                minChargeApplied ? `Min charge applied (calc £${calculatedTotal} → £${baseTotal})` : null,
                congestionCharge > 0
                  ? `Congestion Charge: +£${congestionCharge} (route enters Central London zone)`
                  : null,
                outsideM25Charge > 0
                  ? `Outside-M25 estimate: ~${outsideM25Miles} mi × £${OUTSIDE_M25_RATE} = +£${outsideM25Charge}`
                  : null,
              ].filter(Boolean).join(" | "),
            });
          }}
          onSubmitted={(ref) => {
            setBookingRef(ref);
            setStep("submitted");
          }}
        />
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div>
        <Header />
        <h3 className="text-base font-semibold text-gray-900 mb-1">Booking summary</h3>
        <p className="text-gray-500 text-sm mb-5">Review your waste removal details.</p>

        {/* Prominent total — gradient hero card matching the standard flow */}
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
              data-testid="waste-summary-total"
            >
              £{estimatedTotal}
            </span>
            <span className="text-white text-sm font-medium">
              {itemsOnlyMode ? "Items only" : `Load £${loadPrice}`}
              {!itemsOnlyMode && extrasTotal > 0 ? ` + £${extrasTotal} items` : ""}
              {itemsOnlyMode && extrasTotal > 0 ? ` £${extrasTotal} items` : ""}
              {surchargeTotal > 0 ? ` + £${surchargeTotal} access` : ""}
              {congestionCharge > 0 ? ` + £${congestionCharge} CC*` : ""}
              {outsideM25Charge > 0 ? ` + £${outsideM25Charge} M25*` : ""}
            </span>
          </div>
          {minChargeApplied && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-white/90" data-testid="waste-min-applied">
              Minimum charge £{WASTE_MIN_CHARGE} applied
            </p>
          )}
          {(congestionCharge > 0 || outsideM25Charge > 0) && (
            <p className="text-[11px] text-white/80 mt-2">
              {congestionCharge > 0 &&
                `*Includes £${congestionCharge} Congestion Charge (charged once)`}
              {congestionCharge > 0 && outsideM25Charge > 0 ? " · " : ""}
              {outsideM25Charge > 0 &&
                `Outside-M25 estimate: ~${outsideM25Miles} mi × £${OUTSIDE_M25_RATE}`}
            </p>
          )}
        </div>

        {congestionCharge > 0 && (
          <div
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3"
            data-testid="waste-summary-congestion-charge"
          >
            <div className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0 flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    Congestion Charge
                  </p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    Flat £{CONGESTION_CHARGE} when any address on the route is inside the Central London zone.
                  </p>
                </div>
              </div>
              <span className="text-[13px] font-semibold text-amber-600 tabular-nums shrink-0">
                +£{congestionCharge}
              </span>
            </div>
          </div>
        )}

        {outsideM25Charge > 0 && (
          <div
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3"
            data-testid="waste-summary-outside-m25-charge"
          >
            <div className="px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-gray-900">
                  Outside London mileage (estimate)
                </p>
              </div>
              <dl className="text-[12.5px] text-gray-700 space-y-0.5 pl-6">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Outside London distance</dt>
                  <dd className="tabular-nums">~{outsideM25Miles} miles</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Charge</dt>
                  <dd className="tabular-nums">£{OUTSIDE_M25_RATE}/mile</dd>
                </div>
                <div className="flex justify-between gap-3 font-semibold text-amber-700">
                  <dt>Total</dt>
                  <dd className="tabular-nums">+£{outsideM25Charge}</dd>
                </div>
              </dl>
              <p className="text-[11.5px] text-gray-500 mt-2 pl-6 leading-snug">
                Estimated based on route. Final price may vary slightly depending on the actual route.
                {outsideM25Miles >= 60 && (
                  <span className="block mt-1 text-gray-600">
                    Long distance jobs are priced based on route, not minimum hours.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3 divide-y divide-gray-50">
          {[
            { label: "Service", value: "Waste Removal" },
            { label: "Pickup address", value: pickup || "—" },
            itemsOnlyMode
              ? { label: "Booking type", value: "Items only" }
              : { label: "Load size", value: WASTE_LOADS.find((l) => l.id === selectedLoad)?.label || "—" },
            itemsOnlyMode
              ? null
              : { label: "Base price", value: `£${loadPrice}` },
            ...selectedExtras.map((e) => ({
              label: `${e.label} × ${e.qty}`,
              value: `+£${e.price * e.qty}`,
            })),
            liftValue === "yes"
              ? { label: "Lift access", value: "Available" }
              : stairsCharge > 0
              ? { label: `${getFloorLabelFromValue(floorValue)} — no lift`, value: `+£${stairsCharge}` }
              : null,
            restrictedAccess ? { label: "Restricted access", value: `+£${RESTRICTED_ACCESS_SURCHARGE}` } : null,
            // Additional collection stops — list each address, then the flat
            // per-stop fee and any per-stop floor surcharge so the customer
            // can see exactly what each extra pickup is adding to the total.
            ...cleanExtraStops.flatMap((s, i) => {
              const stopFloor = getFloorChargeFromValue(s.floorValue);
              const rows: Array<{ label: string; value: string }> = [
                { label: `Additional stop ${i + 1}`, value: s.address },
              ];
              if (stopFloor > 0) {
                rows.push({
                  label: `Stop ${i + 1} — ${getFloorLabelFromValue(s.floorValue)}, no lift`,
                  value: `+£${stopFloor}`,
                });
              }
              return rows;
            }),
            extraStopsFee > 0
              ? {
                  label: `Additional stops × ${cleanExtraStops.length}`,
                  value: `+£${extraStopsFee}`,
                }
              : null,
            minChargeApplied
              ? { label: "Minimum charge adjustment", value: `+£${WASTE_MIN_CHARGE - calculatedTotal}` }
              : null,
            congestionCharge > 0
              ? {
                  label: `Congestion Charge`,
                  value: `+£${congestionCharge}`,
                }
              : null,
            outsideM25Charge > 0
              ? {
                  label: `Outside-M25 mileage (~${outsideM25Miles} mi)`,
                  value: `+£${outsideM25Charge}`,
                }
              : null,
          ]
            .filter(Boolean)
            .map((row, i) => {
              const r = row as { label: string; value: string };
              return (
                <div key={i} className="flex justify-between items-baseline gap-3 px-4 py-2 text-[13px]">
                  <span className="text-gray-500 shrink-0">{r.label}</span>
                  <span className="font-medium text-gray-900 text-right truncate">{r.value}</span>
                </div>
              );
            })}
        </div>

        <button
          onClick={() => setStep("final")}
          className="btn-purple w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm"
        >
          Continue booking
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="space-y-6">
        {/* Pickup address */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Pickup address <span className="text-red-500">*</span>
          </label>
          <AddressAutocomplete
            value={pickup}
            onChange={handlePickupChange}
            placeholder="Collection address or postcode..."
            testId="waste-pickup-input"
          />

          {needsUnit && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                House / flat / unit number
                <span className="text-red-500"> *</span>
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
                  data-testid="waste-unit-number"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                We need a building or flat number so the driver can find you.
              </p>
            </div>
          )}

          {/* Access surcharges */}
          <div className="mt-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-700">
              Access details
            </p>
            <StairsAccessSection
              title="Stairs & access at pickup"
              liftValue={liftValue}
              onLiftChange={setLiftValue}
              floorValue={floorValue}
              onFloorChange={setFloorValue}
              testIdSuffix="waste"
            />
            <AccessToggleCard
              icon={Route}
              title="Restricted access"
              description="Long carry, narrow passage, or parking more than 20m away."
              priceLabel={`+£${RESTRICTED_ACCESS_SURCHARGE}`}
              checked={restrictedAccess}
              onToggle={() => setRestrictedAccess((v) => !v)}
              testId="waste-access-checkbox"
            />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              These small surcharges cover the extra time and effort needed when items
              must be carried up stairs or over longer distances from the van.
            </p>
          </div>

          {/* Additional collection stops — same minimal UI as House-Moving:
              one-line "Additional stop (optional)" header + "+ Add another
              stop" button. Adding a stop reveals a card with the same
              address autocomplete + stairs/lift/floor questions used for
              the main pickup, and each extra stop is priced into the total
              automatically (per-stop fee + per-stop floor surcharge). */}
          <div className="mt-4">
            <ExtraStopsSection stops={extraStops} setStops={setExtraStops} />
          </div>
        </div>

        {/* Booking guidance — items-only + minimum charge */}
        <div className="rounded-xl bg-purple-50 border border-purple-100 px-3.5 py-3 flex items-start gap-2.5" data-testid="waste-guidance">
          <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-900 leading-relaxed">
            <span className="font-semibold">Items only bookings available</span> — minimum charge £{WASTE_MIN_CHARGE} applies.
            If you only select items below, you don't need to choose a load size.
          </p>
        </div>

        {/* Load size — de-emphasized when Items Only mode is active */}
        <div className={itemsOnlyMode ? "opacity-60" : ""}>
          <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">
              Select load size <span className="text-gray-400 font-normal">(optional)</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 inline-flex items-center gap-1"
              data-testid="waste-guide-link"
            >
              <Info className="w-3.5 h-3.5" />
              View load sizes &amp; pictures
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {itemsOnlyMode
              ? "Not needed — your booking is priced by selected items below."
              : "Pick the closest match — we'll confirm the right size before pickup."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WASTE_LOADS.map((load) => (
              <button
                key={load.id}
                onClick={() => setSelectedLoad(selectedLoad === load.id ? "" : load.id)}
                className={`text-center py-3 px-2 border-2 rounded-xl transition-all text-sm ${selectedLoad === load.id ? "border-purple-700 bg-purple-50" : "border-gray-100 bg-white hover:border-purple-300"}`}
                data-testid={`waste-load-${load.id}`}
              >
                <p className="font-semibold text-gray-900 text-xs">{load.label}</p>
                <p className={`text-sm font-bold mt-0.5 ${selectedLoad === load.id ? "text-purple-700" : "text-gray-700"}`}>{load.displayPrice}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Extra items with quantity selector */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Do you have any of these items?</h3>
          <p className="text-xs text-gray-500 mb-2">Use + and − to set how many — charges update automatically.</p>
          {itemsOnlyMode && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold px-2.5 py-1" data-testid="waste-items-only-badge">
              <Sparkles className="w-3 h-3" />
              Items Only pricing applied
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WASTE_EXTRA_ITEMS.map((item) => {
              const Icon = iconMap[item.icon] || Circle;
              const qty = quantities[item.id] || 0;
              const isSelected = qty > 0;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 py-3 px-3 border-2 rounded-xl transition-all ${isSelected ? "border-purple-700 bg-purple-50" : "border-gray-100 bg-white"}`}
                  data-testid={`waste-item-${item.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-purple-700" : "text-gray-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className={`text-xs font-bold ${isSelected ? "text-purple-700" : "text-gray-700"}`}>
                        +£{item.price}{qty > 1 ? ` × ${qty} = £${item.price * qty}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty - 1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Decrease ${item.label}`}
                      data-testid={`waste-item-${item.id}-minus`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      className="w-7 text-center text-sm font-semibold tabular-nums"
                      data-testid={`waste-item-${item.id}-qty`}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, qty + 1)}
                      className="w-8 h-8 rounded-lg border border-purple-200 bg-white flex items-center justify-center text-purple-700 hover:bg-purple-50"
                      aria-label={`Increase ${item.label}`}
                      data-testid={`waste-item-${item.id}-plus`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <p className="text-xs text-gray-500 mb-1.5">
            Only selected items are included above. If you have other waste items, list them below.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any extra waste items not listed above"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Attach photos <span className="text-gray-400 font-normal">(optional)</span></label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <span className="text-sm text-gray-600">Attach photos (optional)</span>
            <span className="text-xs text-gray-400 mt-1">Helps confirm pricing</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
          </label>
          {photos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{photos.map((f, i) => <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">{f.name}</span>)}</div>}
        </div>

        {(() => {
          const pickupOk = isAddressAcceptable(pickup);
          const stopsOk = extraStops.every(
            (s) => !s.address.trim() || isAddressAcceptable(s.address),
          );
          const canContinue =
            hasSelection && pickupOk && stopsOk && !!liftValue;
          // Surface the most relevant missing piece so the user is never
          // silently blocked by a disabled button — same UX pattern as
          // the StandardBookingFlow "missing hint" banner.
          let missingHint: string | null = null;
          if (!pickup.trim()) {
            missingHint = "Please enter the pickup address";
          } else if (isUKAddressMissingFullPostcode(pickup)) {
            missingHint =
              "Please enter a full address or valid postcode before continuing.";
          } else if (!liftValue) {
            missingHint = "Please select if there are stairs";
          } else if (!stopsOk) {
            missingHint =
              "Please enter a full address or valid postcode before continuing.";
          } else if (!hasSelection) {
            missingHint = "Please pick a load size or add at least one item";
          }
          return (
            <>
              {!canContinue && missingHint && (
                <div
                  className="mt-1 flex items-start gap-2 rounded-xl border border-[#3D1289]/20 bg-[#3D1289]/5 px-3.5 py-2.5"
                  data-testid="waste-missing-hint"
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: "#3D1289" }}
                    aria-hidden="true"
                  >
                    !
                  </span>
                  <p className="text-[13px] font-medium text-[#1F0648] leading-snug">
                    {missingHint}
                  </p>
                </div>
              )}
              <button
                onClick={() => setStep("summary")}
                disabled={!canContinue}
                className="btn-purple w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm"
                data-testid="waste-continue"
              >
                See Summary
              </button>
            </>
          );
        })()}
      </div>

      {showGuide && <WasteSizeModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* AccessToggleCard — premium tappable card replacing bare checkbox. */
/* ----------------------------------------------------------------- */
interface AccessToggleCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  priceLabel: string;
  checked: boolean;
  onToggle: () => void;
  testId?: string;
}

function AccessToggleCard({
  icon: Icon,
  title,
  description,
  priceLabel,
  checked,
  onToggle,
  testId,
}: AccessToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
        checked
          ? "border-purple-700 bg-purple-50"
          : "border-gray-100 bg-white hover:border-purple-300"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          checked
            ? "bg-purple-700 text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <span
            className={`text-xs font-bold ${
              checked ? "text-purple-700" : "text-gray-500"
            }`}
          >
            {priceLabel}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-snug mt-0.5">
          {description}
        </p>
      </div>
      {/* Toggle indicator */}
      <div
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          checked
            ? "bg-purple-700 border-purple-700"
            : "bg-white border-gray-300"
        }`}
        aria-hidden="true"
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}
