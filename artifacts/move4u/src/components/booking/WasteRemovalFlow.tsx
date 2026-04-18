import { useState } from "react";
import { BedDouble, Refrigerator, Circle, Armchair, CheckCircle, Loader2, ChevronLeft, Info, Plus, Minus } from "lucide-react";
import { WASTE_LOADS, WASTE_EXTRA_ITEMS } from "@/data/constants";
import { submitBooking, uploadPhotos } from "@/lib/api";
import WasteSizeModal from "@/components/WasteSizeModal";
import AddressAutocomplete from "@/components/AddressAutocomplete";

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
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [step, setStep] = useState<"details" | "summary" | "final" | "submitted">("details");
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const setQty = (id: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const loadPrice = WASTE_LOADS.find((l) => l.id === selectedLoad)?.price || 0;
  const selectedExtras = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const item = WASTE_EXTRA_ITEMS.find((i) => i.id === id);
      return { id, qty, label: item?.label ?? id, price: item?.price ?? 0 };
    });
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price * e.qty, 0);
  const estimatedTotal = loadPrice + extrasTotal;

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
    const timeWindows = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–8pm)"];
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred time</label>
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
          <button
            onClick={async () => {
              if (!date || !timeWindow || !name || !phone || !contactMethod) return;
              setSubmitting(true);
              setSubmitError("");
              try {
                const loadLabel = WASTE_LOADS.find((l) => l.id === selectedLoad)?.label ?? selectedLoad;
                const extraLabels = selectedExtras
                  .map((e) => `${e.label} × ${e.qty} (£${e.price * e.qty})`)
                  .join(", ");
                // Upload photos first, then submit with their serving URLs
                const photoUrls = await uploadPhotos(photos);
                const result = await submitBooking({
                  service: "Waste Removal",
                  name,
                  phone,
                  contactMethod,
                  pickup,
                  pickupDetails: "",
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
                  wasteAddons: extraLabels,
                  uploadedFiles: photoUrls.join(", "),
                  notes: [notes, `Load: ${loadLabel}`].filter(Boolean).join(" | "),
                });
                setBookingRef(result.bookingReference);
                setStep("submitted");
              } catch {
                setSubmitError("Something went wrong. Please try again or contact us directly.");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!date || !timeWindow || !name || !phone || !contactMethod || submitting}
            className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden mb-5">
          {[
            { label: "Service", value: "Waste Removal" },
            { label: "Pickup address", value: pickup || "—" },
            { label: "Load size", value: WASTE_LOADS.find((l) => l.id === selectedLoad)?.label || "—" },
            { label: "Load price", value: `£${loadPrice}` },
            ...selectedExtras.map((e) => ({
              label: `${e.label} × ${e.qty}`,
              value: `+£${e.price * e.qty}`,
            })),
          ].map((row, i) => (
            <div key={i} className={`flex justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900 text-right">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm font-medium">Estimated total</span>
            <span className="text-2xl font-bold text-purple-700">£{estimatedTotal}</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700">
          Final price will be confirmed after review if needed.
        </div>
        <button onClick={() => setStep("final")} className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm">
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
            onChange={setPickup}
            placeholder="Collection address or postcode..."
            testId="waste-pickup-input"
          />
        </div>

        {/* Load size */}
        <div>
          <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">Select load size</h3>
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
          <p className="text-xs text-gray-500 mb-3">Not sure what size you need? View load sizes &amp; pictures.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WASTE_LOADS.map((load) => (
              <button
                key={load.id}
                onClick={() => setSelectedLoad(load.id)}
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
          <p className="text-xs text-gray-500 mb-3">Use + and − to set how many — charges update automatically.</p>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any access details, timing, or special requirements..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
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
          disabled={!selectedLoad}
          className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="waste-continue"
        >
          See Summary
        </button>
      </div>

      {showGuide && <WasteSizeModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
