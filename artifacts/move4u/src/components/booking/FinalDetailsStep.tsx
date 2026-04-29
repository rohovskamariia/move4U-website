import { useEffect, useRef, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import BookingTermsNotice from "./BookingTermsNotice";
import PhoneField from "./PhoneField";
import { isValidPhone, isValidEmail, toE164 } from "@/lib/validators";
import {
  TIME_WINDOWS,
  todayIso,
  isToday,
  isPastDate,
  isSlotDisabled as slotDisabled,
  allSlotsPassed,
  isValidFutureDateTime,
} from "@/lib/dateTime";

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

export default function FinalDetailsStep({ onSubmit, onSubmitted }: FinalDetailsStepProps) {
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [contactMethod, setContactMethod] = useState("");
  const [contactMethodTouched, setContactMethodTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [timeTouched, setTimeTouched] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Hard guard against double-submission — even if the click somehow fires
  // twice (slow network, double-tap on mobile, etc.) only one request goes
  // through. Cleared only by remounting the component.
  const submittedOnce = useRef(false);

  // Re-render every minute so slot disabling stays accurate without a
  // page refresh — the moment a window's end-hour passes, it greys out
  // and (if selected) clears itself.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // For "today" bookings, work out which slots are already in the past.
  // For any future date, every slot stays enabled. Delegates to the
  // shared lib so International Moving uses the same rule.
  const todaySelected = isToday(date);
  const nowDate = new Date(nowTick);
  const isSlotDisabled = (endHour: number) => slotDisabled(endHour, date, nowDate);

  // If the selected slot becomes invalid — because the user changed the
  // date to today, or the clock crossed an hour boundary — clear it so
  // they can't submit a window that's already in the past.
  useEffect(() => {
    if (!timeWindow) return;
    const slot = TIME_WINDOWS.find((w) => w.label === timeWindow);
    if (slot && isSlotDisabled(slot.endHour)) {
      setTimeWindow("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, nowTick]);

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
    // Mark every required field as touched so the inline error messages
    // appear if the customer tried to submit a half-empty form.
    setNameTouched(true);
    setPhoneTouched(true);
    setContactMethodTouched(true);
    setDateTouched(true);
    setTimeTouched(true);
    if (emailRequired || email) setEmailTouched(true);
    if (!canSubmit) return;
    // Past-date guard FIRST. The date input's `min` blocks the picker
    // UI, but some mobile browsers (notably some Android keyboards)
    // ignore `min` for typed input — so we re-verify here and show a
    // dedicated, clear error message before falling through to the
    // time-slot check.
    if (isPastDate(date)) {
      setError("Please select today or a future date.");
      return;
    }
    // Final guard: re-check the chosen window against the wall clock at
    // the moment of submit. Catches a user who lingered past the slot
    // end since making the selection (e.g. picked Morning at 11:55 then
    // submitted at 12:01).
    if (!isValidFutureDateTime(date, timeWindow)) {
      const slot = TIME_WINDOWS.find((w) => w.label === timeWindow);
      if (slot && isToday(date) && new Date().getHours() >= slot.endHour) {
        setTimeWindow("");
      }
      setError("Please select a valid future date and time.");
      return;
    }
    // Reject any second submit attempt outright.
    if (submittedOnce.current || loading) return;
    submittedOnce.current = true;
    setLoading(true);
    setError("");
    try {
      // Always submit the canonical E.164 form so wa.me / tel: / sms:
      // links built downstream (admin panel, Telegram message, customer
      // confirmations) work reliably regardless of how the customer typed
      // their number ("07…", "+44…", "0044…", spaces / dashes / brackets).
      const phoneE164 = toE164(phone);
      const result = await onSubmit({ date, timeWindow, name, phone: phoneE164 || phone, email, contactMethod });
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preferred date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDateTouched(true);
            }}
            onBlur={() => setDateTouched(true)}
            min={todayIso()}
            required
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
              dateTouched && !date
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-purple-500"
            }`}
            data-testid="final-date"
          />
          {dateTouched && !date && (
            <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
          )}
          {isSameDayOrLastMinute && (
            <div
              className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
              data-testid="same-day-notice"
            >
              <p className="font-semibold mb-1">Please note:</p>
              <p className="leading-relaxed">
                Last-minute and same-day bookings may be subject to an additional charge depending on availability. Final price will be confirmed by our team.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred time <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {TIME_WINDOWS.map((tw) => {
              const disabled = isSlotDisabled(tw.endHour);
              const selected = timeWindow === tw.label;
              return (
                <button
                  key={tw.label}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    setTimeWindow(tw.label);
                    setTimeTouched(true);
                  }}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? "This time has already passed today" : undefined}
                  className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors flex items-center justify-between gap-3 ${
                    disabled
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed line-through decoration-gray-300"
                      : selected
                        ? "border-purple-700 bg-purple-50 text-purple-700 font-medium"
                        : "border-gray-100 text-gray-700 hover:border-purple-300"
                  }`}
                  data-testid={`time-window-${tw.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <span>{tw.label}</span>
                  {disabled && (
                    <span className="text-[11px] font-medium text-gray-400 no-underline">
                      Already passed
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {todaySelected && allSlotsPassed(date, nowDate) && (
            <p
              className="mt-2 text-[12px] font-medium text-red-600"
              data-testid="time-windows-all-passed"
            >
              Selected date is no longer available. Please choose another date.
            </p>
          )}
          {timeTouched && !timeWindow && date && !allSlotsPassed(date, nowDate) && (
            <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Your full name"
            required
            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
              nameTouched && !name.trim()
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-purple-500"
            }`}
            data-testid="final-name"
          />
          {nameTouched && !name.trim() && (
            <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
          )}
        </div>

        {/* Phone + email side-by-side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number <span className="text-red-500">*</span>
            </label>
            <PhoneField
              value={phone}
              onChange={setPhone}
              onBlur={() => setPhoneTouched(true)}
              invalid={showPhoneError}
              required
              testId="final-phone"
            />
            {showPhoneError ? (
              <p className="text-[11px] text-red-600 mt-1.5" data-testid="phone-error">
                Please enter a valid phone number.
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1.5">
                Pick your country code, then your number — no leading 0 needed.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email{" "}
              {emailRequired ? (
                <span className="text-red-500">*</span>
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
            Preferred contact method <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={contactMethod}
              onChange={(e) => {
                setContactMethod(e.target.value);
                setContactMethodTouched(true);
              }}
              onBlur={() => setContactMethodTouched(true)}
              className={`w-full appearance-none border rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 ${
                contactMethodTouched && !contactMethod
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-200 focus:ring-purple-500"
              }`}
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
          {contactMethodTouched && !contactMethod && (
            <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
          )}
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
