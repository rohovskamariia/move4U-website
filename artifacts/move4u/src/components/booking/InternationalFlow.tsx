import { useEffect, useState } from "react";
import { CheckCircle, Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import { submitBooking, uploadPhotos } from "@/lib/api";
import { isValidPhone, isValidEmail, toE164 } from "@/lib/validators";
import {
  TIME_WINDOWS,
  todayIso,
  isToday,
  isSlotDisabled as slotDisabled,
  allSlotsPassed,
  isValidFutureDateTime,
  isPastDate,
} from "@/lib/dateTime";
import PhoneField from "./PhoneField";
import AddressAutocomplete from "@/components/AddressAutocomplete";

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

  // Touched flags drive the inline "This field is required." messages —
  // we only show them after the user has interacted with (or tried to
  // submit past) a field, so the form doesn't shout on first paint.
  const [pickupTouched, setPickupTouched] = useState(false);
  const [deliveryTouched, setDeliveryTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [contactMethodTouched, setContactMethodTouched] = useState(false);

  // Re-render once a minute so on-day slot disabling stays accurate as
  // the wall clock crosses each window's end hour.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowDate = new Date(nowTick);

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // If the customer flips the date back to "today" after the slot they
  // picked has already passed (e.g. they were lingering on the form),
  // clear the now-invalid selection so they can't submit it.
  useEffect(() => {
    if (!form.timeWindow) return;
    const slot = TIME_WINDOWS.find((w) => w.label === form.timeWindow);
    if (slot && slotDisabled(slot.endHour, form.date, nowDate)) {
      setForm((prev) => ({ ...prev, timeWindow: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, nowTick]);

  const phoneValid = isValidPhone(form.phone);
  const emailRequired = form.contactMethod === "Email";
  const emailValid = form.email.trim() === "" ? !emailRequired : isValidEmail(form.email);
  const showPhoneError = phoneTouched && form.phone.length > 0 && !phoneValid;
  const showEmailError = emailTouched && form.email.length > 0 && !isValidEmail(form.email);
  const showEmailRequiredError = emailRequired && emailTouched && form.email.trim() === "";

  // The required set for International is the same as before — pickup,
  // delivery, name, phone, contact method, valid email-when-required.
  // Date/time stay optional in the submit-gate (we don't change booking
  // logic), but if they ARE filled in they must be in the future.
  const dateTimeOk =
    !form.date ||
    (!isPastDate(form.date) &&
      (!form.timeWindow || isValidFutureDateTime(form.date, form.timeWindow, nowDate)));

  const canSubmit =
    form.pickupLocation &&
    form.deliveryLocation &&
    form.name.trim() &&
    phoneValid &&
    form.contactMethod &&
    emailValid &&
    dateTimeOk;

  // When the confirmation screen replaces the form, jump to the top so
  // the user immediately sees the success card.
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

  const handleSubmit = async () => {
    // Reveal every required-field error message in one go.
    setPickupTouched(true);
    setDeliveryTouched(true);
    setNameTouched(true);
    setPhoneTouched(true);
    setContactMethodTouched(true);
    if (emailRequired || form.email) setEmailTouched(true);

    if (!canSubmit) return;

    // Past-date guard FIRST — the date input's `min` blocks the picker
    // UI but mobile keyboards can sometimes type past it. Use a clear,
    // dedicated error message before falling through to the time-slot
    // check, so the customer knows exactly what's wrong.
    if (form.date && isPastDate(form.date)) {
      setSubmitError("Please select today or a future date.");
      return;
    }
    // If a time slot is also picked, re-check it against the wall clock
    // at submit time in case the user lingered past its end hour.
    if (form.date && form.timeWindow && !isValidFutureDateTime(form.date, form.timeWindow)) {
      setSubmitError("Please select a valid future date and time.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      // Upload any attached photos to permanent object storage FIRST,
      // then submit the booking with the resulting serving URLs. We
      // previously sent only the file names — those couldn't be opened
      // from the admin panel or Telegram message because the bytes were
      // never persisted anywhere.
      const photoUrls = await uploadPhotos(photos);

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
        uploadedFiles: photoUrls.join(", "),
        notes: form.notes,
      });
      setBookingRef(result.bookingReference);
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const todaySelected = isToday(form.date);

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

      {/* Pickup — bi-directional: customers may move UK→EU, EU→UK, or
          even EU→EU, so both Pickup AND Delivery use the global mode of
          the address autocomplete. Smart-bias inside the component snaps
          back to UK results the moment the user starts typing what looks
          like a UK postcode. */}
      <div onBlur={() => setPickupTouched(true)}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Pickup location <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          mode="global"
          value={form.pickupLocation}
          onChange={(val) => {
            handleChange("pickupLocation", val);
            if (val) setPickupTouched(true);
          }}
          placeholder="UK postcode, city, or international address..."
          testId="intl-pickup-input"
        />
        {pickupTouched && !form.pickupLocation && (
          <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
        )}
      </div>

      <div onBlur={() => setDeliveryTouched(true)}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Delivery location <span className="text-red-500">*</span>
        </label>
        <AddressAutocomplete
          mode="global"
          value={form.deliveryLocation}
          onChange={(val) => {
            handleChange("deliveryLocation", val);
            if (val) setDeliveryTouched(true);
          }}
          placeholder="Destination city, country, or address..."
          testId="intl-delivery-input"
        />
        {deliveryTouched && !form.deliveryLocation && (
          <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Preferred date <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => handleChange("date", e.target.value)}
          min={todayIso()}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          data-testid="intl-date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred time <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-col gap-2">
          {TIME_WINDOWS.map((tw) => {
            const disabled = slotDisabled(tw.endHour, form.date, nowDate);
            const selected = form.timeWindow === tw.label;
            return (
              <button
                key={tw.label}
                type="button"
                onClick={() => !disabled && handleChange("timeWindow", tw.label)}
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
                data-testid={`intl-time-${tw.label.toLowerCase().replace(/\s/g, "-")}`}
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
        {todaySelected && allSlotsPassed(form.date, nowDate) && (
          <p className="mt-2 text-[12px] font-medium text-red-600">
            Selected date is no longer available. Please choose another date.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => setNameTouched(true)}
          placeholder="Your full name"
          className={`w-full border rounded-xl px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${
            nameTouched && !form.name.trim()
              ? "border-red-300 focus:ring-red-400"
              : "border-gray-200 focus:ring-purple-500"
          }`}
          data-testid="intl-name"
        />
        {nameTouched && !form.name.trim() && (
          <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone number <span className="text-red-500">*</span>
          </label>
          <PhoneField
            value={form.phone}
            onChange={(v) => handleChange("phone", v)}
            onBlur={() => setPhoneTouched(true)}
            invalid={showPhoneError}
            required
            testId="intl-phone"
          />
          {showPhoneError ? (
            <p className="text-[11px] text-red-600 mt-1.5">Please enter a valid phone number.</p>
          ) : phoneTouched && !form.phone ? (
            <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1.5">Pick your country code, then your number — no leading 0 needed.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email {emailRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
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
            data-testid="intl-email"
          />
          {showEmailError && <p className="text-[11px] text-red-600 mt-1.5">Please enter a valid email address.</p>}
          {showEmailRequiredError && <p className="text-[11px] text-red-600 mt-1.5">Email is required when "Email" is your preferred contact method.</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Preferred contact method <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={form.contactMethod}
            onChange={(e) => {
              handleChange("contactMethod", e.target.value);
              setContactMethodTouched(true);
            }}
            onBlur={() => setContactMethodTouched(true)}
            className={`w-full appearance-none border rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 ${
              contactMethodTouched && !form.contactMethod
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-purple-500"
            }`}
            data-testid="intl-contact-method"
          >
            <option value="">Select an option…</option>
            {CONTACT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {contactMethodTouched && !form.contactMethod && (
          <p className="text-[11px] text-red-600 mt-1.5">This field is required.</p>
        )}
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
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="btn-purple w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
        data-testid="intl-submit"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Enquiry"}
      </button>
      </div>
    </div>
  );
}
