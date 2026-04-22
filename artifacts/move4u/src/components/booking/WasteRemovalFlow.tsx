import { useEffect, useRef, useState } from "react";
import { BedDouble, Refrigerator, Circle, Armchair, CheckCircle, Loader2, ChevronLeft, Info, Plus, Minus, Route, Check, Hash, Clock, Sparkles } from "lucide-react";
import { WASTE_LOADS, WASTE_EXTRA_ITEMS } from "@/data/constants";
import { submitBooking, uploadPhotos } from "@/lib/api";
import WasteSizeModal from "@/components/WasteSizeModal";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import BookingTermsNotice from "./BookingTermsNotice";
import StairsAccessSection, {
  getFloorChargeFromValue,
  getFloorLabelFromValue,
} from "./StairsAccessSection";

/** Flat surcharge for restricted-access pickups (long carry, narrow lane, etc). */
const RESTRICTED_ACCESS_SURCHARGE = 10;

/** Minimum charge for any waste removal booking (£). */
const WASTE_MIN_CHARGE = 60;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BedDouble, Refrigerator, Circle, Armchair, Chair: Armchair,
};

interface WasteRemovalFlowProps {
  onBack: () => void;
}

// Waste removal booking flow
// Edit load prices in src/data/constants.ts (WASTE_LOADS)
// Edit extra item prices in src/data/constants.ts (WASTE_EXTRA_ITEMS)
export default function WasteRemovalFlow({ onBack }: WasteRemovalFlowProps) {
  const [selectedLoad, setSelectedLoad] = useState("");
  /** Map of extra-item id → quantity. Quantity 0 = not selected. */
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pickup, setPickup] = useState("");
  // House / flat / unit follow-up — shown when Google returned a street
  // without a number (e.g. route- or postcode-only result).
  const [needsUnit, setNeedsUnit] = useState(false);
  const [unitNumber, setUnitNumber] = useState("");
  const corePickupRef = useRef<string>("");

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
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [step, setStep] = useState<"details" | "summary" | "final" | "submitted">("details");
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
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
  const surchargeTotal = stairsCharge + accessCharge;
  const calculatedTotal = loadPrice + extrasTotal + surchargeTotal;
  // Minimum charge only kicks in once the user has actually picked something
  // (a load OR at least one item). An empty selection should still read £0.
  const hasSelection = !!selectedLoad || hasItems;
  const estimatedTotal = hasSelection
    ? Math.max(WASTE_MIN_CHARGE, calculatedTotal)
    : 0;
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
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 text-green-700 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Thank you — we received your request.
        </h3>
        <div className="inline-block bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-4">
          <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mb-0.5">Booking Reference</p>
          <p className="text-xl font-bold text-purple-700">{bookingRef}</p>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto mb-3">
          We will contact you shortly to confirm availability, final price, and booking details.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Please keep your phone available. Our team will contact you shortly.
        </p>
      </div>
    );
  }

  if (step === "final") {
    const timeWindows = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–12am)"];
    return (
      <div>
        <Header />
        <h3 className="text-base font-semibold text-gray-900 mb-1">Final details</h3>
        <p className="text-gray-500 text-sm mb-5">We will call or text to confirm your booking.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Preferred time</label>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500" data-testid="waste-working-hours">
                <Clock className="w-3 h-3" />
                Working hours: 8:00 AM – 12:00 AM
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {timeWindows.map((tw) => (
                <button key={tw} type="button" onClick={() => setTimeWindow(tw)} className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${timeWindow === tw ? "border-purple-700 bg-purple-50 text-purple-700 font-medium" : "border-gray-100 text-gray-700 hover:border-purple-300"}`}>{tw}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred contact method</label>
            <div className="flex flex-col gap-2">
              {["Phone call", "WhatsApp", "Text message", "Any"].map((method) => (
                <button key={method} type="button" onClick={() => setContactMethod(method)} className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${contactMethod === method ? "border-purple-700 bg-purple-50 text-purple-700 font-medium" : "border-gray-100 text-gray-700 hover:border-purple-300"}`}>{method}</button>
              ))}
            </div>
          </div>
          {submitError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">{submitError}</p>
          )}

          <BookingTermsNotice
            agreed={agreedToTerms}
            onAgreedChange={setAgreedToTerms}
          />

          <button
            onClick={async () => {
              if (!date || !timeWindow || !name || !phone || !contactMethod || !agreedToTerms) return;
              setSubmitting(true);
              setSubmitError("");
              try {
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
                const result = await submitBooking({
                  service: "Waste Removal",
                  name,
                  phone,
                  contactMethod,
                  pickup,
                  pickupDetails: accessNotes,
                  dropoff: "",
                  dropoffDetails: "",
                  extraAddress: "",
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
                    minChargeApplied ? `Min charge applied (calc £${calculatedTotal} → £${estimatedTotal})` : null,
                  ].filter(Boolean).join(" | "),
                });
                setBookingRef(result.bookingReference);
                setStep("submitted");
              } catch {
                setSubmitError("Something went wrong. Please try again or contact us directly.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!date || !timeWindow || !name || !phone || !contactMethod || !agreedToTerms || submitting}
            className="w-full py-2.5 sm:py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Enquiry"}
          </button>
        </div>
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
            </span>
          </div>
          {minChargeApplied && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-white/90" data-testid="waste-min-applied">
              Minimum charge £{WASTE_MIN_CHARGE} applied
            </p>
          )}
        </div>

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
            minChargeApplied
              ? { label: "Minimum charge adjustment", value: `+£${WASTE_MIN_CHARGE - calculatedTotal}` }
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

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Final price may vary depending on access and loading conditions.
        </p>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup address</label>
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

        <button
          onClick={() => setStep("summary")}
          disabled={!hasSelection || !pickup || !liftValue}
          className="w-full py-2.5 sm:py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="waste-continue"
        >
          See Summary
        </button>
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
