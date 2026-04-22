import { useEffect, useState } from "react";
import { CheckCircle, Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import { submitBooking } from "@/lib/api";
import { isValidPhone, isValidEmail, toE164 } from "@/lib/validators";

interface InternationalFlowProps {
  onBack: () => void;
}

const CONTACT_METHODS = ["Phone", "WhatsApp", "Email", "Text message", "Any"];

export default function InternationalFlow({ onBack }: InternationalFlowProps) {
  const [form, setForm] = useState({
    pickupLocation: "",
    deliveryLocation: "",
    date: "",
    timeWindow: "",
    name: "",
    phone: "",
    email: "",
    contactMethod: "",
    notes: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const timeWindows = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–12am)"];

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const phoneValid = isValidPhone(form.phone);
  const emailRequired = form.contactMethod === "Email";
  const emailValid = form.email.trim() === "" ? !emailRequired : isValidEmail(form.email);
  const showPhoneError = phoneTouched && form.phone.length > 0 && !phoneValid;
  const showEmailError = emailTouched && form.email.length > 0 && !isValidEmail(form.email);
  const showEmailRequiredError = emailRequired && emailTouched && form.email.trim() === "";

  const canSubmit =
    form.pickupLocation && form.deliveryLocation && form.name && phoneValid && form.contactMethod && emailValid;

  // When the confirmation screen replaces the form, jump to the top so the
  // user immediately sees the success card instead of being left at the
  // submit button further down the page.
  useEffect(() => {
    if (!submitted) return;
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [submitted]);

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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
          data-testid="international-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-gray-900">International Moving</h2>
      </div>

      <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-700 mb-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone number <span className="text-purple-700">*</span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            placeholder="+44 7123 456789"
            required
            className={`w-full border rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${showPhoneError ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-purple-500"}`}
          />
          {showPhoneError ? (
            <p className="text-[11px] text-red-600 mt-1.5">Please enter a valid full phone number including country code (e.g. +44…).</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1.5">Please enter your full phone number including country code (e.g. +44…).</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email {emailRequired ? <span className="text-purple-700">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@example.com"
            className={`w-full border rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${showEmailError || showEmailRequiredError ? "border-red-300 focus:ring-red-400" : "border-gray-200 focus:ring-purple-500"}`}
          />
          {showEmailError && <p className="text-[11px] text-red-600 mt-1.5">Please enter a valid email address.</p>}
          {showEmailRequiredError && <p className="text-[11px] text-red-600 mt-1.5">Email is required when "Email" is your preferred contact method.</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred contact method</label>
        <div className="relative">
          <select
            value={form.contactMethod}
            onChange={(e) => handleChange("contactMethod", e.target.value)}
            className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select an option…</option>
            {CONTACT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            // Canonicalise phone to E.164 so contact links work reliably.
            const phoneE164 = toE164(form.phone) || form.phone;
            const result = await submitBooking({
              service: "International Moving",
              name: form.name,
              phone: phoneE164,
              email: form.email,
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
        className="btn-purple w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Enquiry"}
      </button>
      </div>
    </div>
  );
}
