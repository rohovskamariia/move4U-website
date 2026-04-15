import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { submitBooking } from "@/lib/api";

interface InternationalFlowProps {
  onBack: () => void;
}

export default function InternationalFlow({ onBack }: InternationalFlowProps) {
  const [form, setForm] = useState({
    pickupLocation: "",
    deliveryLocation: "",
    date: "",
    timeWindow: "",
    name: "",
    phone: "",
    contactMethod: "",
    notes: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const timeWindows = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–8pm)"];

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit = form.pickupLocation && form.deliveryLocation && form.name && form.phone && form.contactMethod;

  if (submitted) {
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

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-2">
        Please contact us directly for a final international moving quote.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup location (UK)</label>
        <input type="text" value={form.pickupLocation} onChange={(e) => handleChange("pickupLocation", e.target.value)} placeholder="Your UK address" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery location</label>
        <input type="text" value={form.deliveryLocation} onChange={(e) => handleChange("deliveryLocation", e.target.value)} placeholder="Destination country / city / address" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred date</label>
        <input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred time</label>
        <div className="flex flex-col gap-2">
          {timeWindows.map((tw) => (
            <button key={tw} type="button" onClick={() => handleChange("timeWindow", tw)} className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${form.timeWindow === tw ? "border-purple-700 bg-purple-50 text-purple-700 font-medium" : "border-gray-100 text-gray-700 hover:border-purple-300"}`}>{tw}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
        <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Your full name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
        <input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Your phone number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred contact method</label>
        <div className="flex flex-col gap-2">
          {["Phone call", "WhatsApp", "Text message", "Any"].map((method) => (
            <button key={method} type="button" onClick={() => handleChange("contactMethod", method)} className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${form.contactMethod === method ? "border-purple-700 bg-purple-50 text-purple-700 font-medium" : "border-gray-100 text-gray-700 hover:border-purple-300"}`}>{method}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} placeholder="Tell us about your move, items, volume, or any special requirements..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Attach photos <span className="text-gray-400 font-normal">(optional)</span></label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
          <span className="text-sm text-gray-600">Attach photos (optional)</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
        </label>
        {photos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{photos.map((f, i) => <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">{f.name}</span>)}</div>}
      </div>

      {submitError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">{submitError}</p>
      )}
      <button
        onClick={async () => {
          if (!canSubmit) return;
          setSubmitting(true);
          setSubmitError("");
          try {
            const result = await submitBooking({
              service: "International Moving",
              name: form.name,
              phone: form.phone,
              pickup: form.pickupLocation,
              pickupDetails: "",
              dropoff: form.deliveryLocation,
              dropoffDetails: "",
              extraAddress: "",
              vanSize: "",
              helpOption: "",
              peopleCount: "",
              estimatedPrice: "Custom quote",
              estimatedTime: "",
              date: form.date,
              timeWindow: form.timeWindow,
              contactMethod: form.contactMethod,
              wasteAddons: "",
              uploadedFiles: photos.map((f) => f.name).join(", "),
              notes: form.notes,
            });
            setBookingRef(result.bookingReference);
            setSubmitted(true);
          } catch {
            setSubmitError("Something went wrong. Please try again or contact us directly.");
          } finally {
            setSubmitting(false);
          }
        }}
        disabled={!canSubmit || submitting}
        className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Enquiry"}
      </button>
    </div>
  );
}
