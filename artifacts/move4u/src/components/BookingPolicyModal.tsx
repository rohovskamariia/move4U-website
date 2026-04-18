import { X } from "lucide-react";

interface BookingPolicyModalProps {
  onClose: () => void;
}

interface PolicySection {
  title: string;
  body: string;
}

const SECTIONS: PolicySection[] = [
  {
    title: "1. How to Book",
    body:
      "You can book with Move4U via our online form, WhatsApp, phone or email. All bookings are subject to availability and confirmation by our team.",
  },
  {
    title: "2. Confirmation",
    body:
      "A booking is only considered confirmed once you receive a confirmation message from Move4U with the agreed date, time and price.",
  },
  {
    title: "3. Deposits",
    body:
      "A 30% deposit is required to secure a booking. The remaining balance will be confirmed with you before the job is finalised. Deposits are deducted from the final invoice.",
  },
  {
    title: "4. Same-Day and Last-Minute Bookings",
    body:
      "Same-day and last-minute bookings may be subject to an additional charge depending on timing, availability, and job details. Final pricing will always be confirmed by our team before the booking is finalised.",
  },
  {
    title: "5. Minimum Booking Time",
    body: "All bookings have a minimum duration of 2 hours.",
  },
  {
    title: "6. Quotes",
    body:
      "All quotes are estimates based on the information provided. Final pricing may change if the job conditions differ on the day (extra items, additional stairs, parking issues, etc.).",
  },
  {
    title: "7. Changes to Bookings",
    body:
      "If you need to change the date, time or address of a confirmed booking, please let us know as early as possible. We will do our best to accommodate changes subject to availability.",
  },
  {
    title: "8. Contact",
    body:
      "For any booking questions, contact us at move4foru@gmail.com or call +44 7946 259714.",
  },
];

export default function BookingPolicyModal({ onClose }: BookingPolicyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      data-testid="booking-policy-overlay"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Booking Policy</h2>
            <p className="text-xs text-gray-400">Last updated: April 2025</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close"
            data-testid="close-booking-policy-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3.5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm"
            data-testid="continue-booking-from-policy"
          >
            Continue booking
          </button>
        </div>
      </div>
    </div>
  );
}
