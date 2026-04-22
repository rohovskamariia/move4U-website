import { useRef, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import BookingTermsNotice from "./BookingTermsNotice";
import { isValidPhone, isValidEmail } from "@/lib/validators";

interface FinalDetailsStepProps {
  onSubmit: (data: {
    date: string;
    timeWindow: string;
    name: string;
    phone: string;
    email: string;
    contactMethod: string;
  }) => Promise<{ bookingReference: string }>;
  /**
   * Called once the booking has been successfully created. The parent flow
   * uses this to swap the entire form for a locked success view, so the
   * user can't navigate back to the form and accidentally resubmit.
   */
  onSubmitted: (bookingReference: string) => void;
}

const CONTACT_METHODS = ["Phone", "WhatsApp", "Email", "Text message", "Any"];
const TIME_WINDOWS = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–12am)"];

export default function FinalDetailsStep({ onSubmit, onSubmitted }: FinalDetailsStepProps) {
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [contactMethod, setContactMethod] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Hard guard against double-submission — even if the click somehow fires
  // twice (slow network, double-tap on mobile, etc.) only one request goes
  // through. Cleared only by remounting the component.
  const submittedOnce = useRef(false);

  const phoneValid = isValidPhone(phone);
  const emailRequired = contactMethod === "Email";
  const emailValid = email.trim() === "" ? !emailRequired : isValidEmail(email);

  const canSubmit =
    date && timeWindow && name && phoneValid && contactMethod && emailValid && agreedToTerms;

  const isSameDayOrLastMinute = (() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime() || selected.getTime() === tomorrow.getTime();
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (emailRequired || email) setEmailTouched(true);
    if (!canSubmit) return;
    // Reject any second submit attempt outright.
    if (submittedOnce.current || loading) return;
    submittedOnce.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await onSubmit({ date, timeWindow, name, phone, email, contactMethod });
      // Hand control to the parent — it swaps to the locked success view.
      onSubmitted(result.bookingReference);
    } catch {
      // Allow the user to retry if the network actually failed.
      submittedOnce.current = false;
      setError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  const showPhoneError = phoneTouched && phone.length > 0 && !phoneValid;
  const showEmailError = emailTouched && email.length > 0 && !isValidEmail(email);
  const showEmailRequiredError = emailRequired && emailTouched && email.trim() === "";

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Final details</h3>
      <p className="text-gray-500 text-sm mb-5">
        We will contact you to confirm your booking and final price.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="final-date"
          />
          {isSameDayOrLastMinute && (
            <div
              className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
              data-testid="same-day-notice"
            >
              <p className="font-semibold mb-1">Please note:</p>
              <p className="leading-relaxed">
                Last-minute and same-day bookings may be subject to an extra charge. Final pricing will be confirmed by our team before the booking is finalised.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred time</label>
          <div className="flex flex-col gap-2">
            {TIME_WINDOWS.map((tw) => (
              <button
                key={tw}
                type="button"
                onClick={() => setTimeWindow(tw)}
                className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${
                  timeWindow === tw
                    ? "border-purple-700 bg-purple-50 text-purple-700 font-medium"
                    : "border-gray-100 text-gray-700 hover:border-purple-300"
                }`}
                data-testid={`time-window-${tw.toLowerCase().replace(/\s/g, "-")}`}
              >
                {tw}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="final-name"
          />
        </div>

        {/* Phone + email side-by-side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number <span className="text-purple-700">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="07123 456789 or +44…"
              required
              className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                showPhoneError
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-200 focus:ring-purple-500"
              }`}
              data-testid="final-phone"
            />
            {showPhoneError && (
              <p className="text-[11px] text-red-600 mt-1.5" data-testid="phone-error">
                Please enter a valid UK or international phone number.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email{" "}
              {emailRequired ? (
                <span className="text-purple-700">*</span>
              ) : (
                <span className="text-gray-400 font-normal">(optional)</span>
              )}
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              required={emailRequired}
              className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                showEmailError || showEmailRequiredError
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-200 focus:ring-purple-500"
              }`}
              data-testid="final-email"
            />
            {showEmailError && (
              <p className="text-[11px] text-red-600 mt-1.5">
                Please enter a valid email address.
              </p>
            )}
            {showEmailRequiredError && (
              <p className="text-[11px] text-red-600 mt-1.5">
                Email is required when "Email" is your preferred contact method.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preferred contact method
          </label>
          <div className="relative">
            <select
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              data-testid="final-contact-method"
            >
              <option value="">Select an option…</option>
              {CONTACT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <BookingTermsNotice
          agreed={agreedToTerms}
          onAgreedChange={setAgreedToTerms}
        />

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn-purple w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm mt-2 flex items-center justify-center gap-2"
          data-testid="submit-booking"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Enquiry"
          )}
        </button>
      </form>
    </div>
  );
}
