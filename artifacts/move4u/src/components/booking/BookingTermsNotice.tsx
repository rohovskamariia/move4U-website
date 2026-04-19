import { useState } from "react";
import BookingPolicyModal from "@/components/BookingPolicyModal";

interface BookingTermsNoticeProps {
  agreed: boolean;
  onAgreedChange: (val: boolean) => void;
}

/**
 * Final-step booking terms block — appears only on the LAST step of every
 * booking flow, immediately above the Submit button.
 *
 *  - Deposit message + payment-link explanation
 *  - "I agree to the booking terms" checkbox (parent disables Submit until
 *    it's checked)
 *  - "booking terms" is an inline link that opens the Booking Policy modal
 *    in place — no route change, no progress lost.
 */
export default function BookingTermsNotice({
  agreed,
  onAgreedChange,
}: BookingTermsNoticeProps) {
  const [showPolicy, setShowPolicy] = useState(false);

  return (
    <div
      className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-4 text-sm text-gray-700"
      data-testid="booking-terms-notice"
    >
      <p className="leading-relaxed">
        <span className="font-semibold text-gray-900">
          A 30% deposit is required to secure your booking.
        </span>{" "}
        A secure payment link will be sent to your phone or email after
        confirmation.
      </p>

      <label
        className="flex items-start gap-2.5 mt-3.5 cursor-pointer select-none"
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
          I agree to the{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPolicy(true);
            }}
            className="text-purple-700 hover:text-purple-900 underline underline-offset-2 font-medium bg-transparent border-0 p-0 cursor-pointer"
            data-testid="open-booking-terms"
          >
            booking terms
          </button>
          .
        </span>
      </label>

      {showPolicy && <BookingPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
