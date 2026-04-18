import { useState } from "react";
import BookingPolicyModal from "@/components/BookingPolicyModal";

interface BookingTermsNoticeProps {
  agreed: boolean;
  onAgreedChange: (val: boolean) => void;
}

/**
 * Shared "deposit + agreement" notice shown immediately above the final
 * Submit button on every booking flow (House Move, Waste Removal,
 * Single Item, Commercial, International, Custom Request).
 *
 * Includes:
 *  - Deposit message
 *  - "I agree" checkbox (controlled — parent enforces it before submit)
 *  - "Read full booking terms" link that opens the policy modal in place
 *    (no route change, no progress lost).
 */
export default function BookingTermsNotice({
  agreed,
  onAgreedChange,
}: BookingTermsNoticeProps) {
  const [showPolicy, setShowPolicy] = useState(false);

  return (
    <div
      className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3.5 text-sm text-gray-700"
      data-testid="booking-terms-notice"
    >
      <p className="leading-relaxed">
        By submitting this form, you agree to our booking terms.{" "}
        <span className="font-semibold text-gray-900">
          A 30% deposit is required to secure your booking.
        </span>
      </p>

      <button
        type="button"
        onClick={() => setShowPolicy(true)}
        className="text-xs text-purple-700 hover:text-purple-900 underline underline-offset-2 mt-1.5 inline-block bg-transparent border-0 p-0 cursor-pointer"
        data-testid="open-booking-terms"
      >
        Read full booking terms
      </button>

      <label
        className="flex items-start gap-2.5 mt-3 cursor-pointer select-none"
        data-testid="booking-terms-agree-row"
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-purple-700 cursor-pointer flex-shrink-0"
          data-testid="booking-terms-agree-checkbox"
        />
        <span className="text-sm text-gray-800 leading-snug">
          I agree to the booking terms
        </span>
      </label>

      {showPolicy && <BookingPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
