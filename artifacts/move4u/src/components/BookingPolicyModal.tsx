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
    body:
      "Most services have a 2-hour minimum (travel + loading + unloading). Single Item Delivery is the exception: a flat £60 covers the first hour, then £30 per extra 30 minutes.",
  },
  {
    title: "6. Time Rounding",
    body:
      "We round on-site time fairly: up to 4 minutes over a half-hour block is free; from 5 minutes onwards we round up to the next 30-minute block.",
  },
  {
    title: "7. Stair Flight Charges",
    body:
      "Without a lift, stairs are charged at £10 per stair flight. A stair flight is one continuous set of stairs between two landings. Up to 3 steps are free. 4 or more steps = 1 chargeable stair flight. Count each stair flight separately — do not use the building floor number.",
  },
  {
    title: "8. Congestion Charge",
    body:
      "A single £18 Congestion Charge is added when any address on the route — pickup, drop-off or any additional stop — is inside the Central London congestion zone. It's applied once per booking, regardless of how many addresses fall inside the zone.",
  },
  {
    title: "9. Outside the M25",
    body:
      "Jobs that go beyond the M25 are charged at £1 per extra mile on top of the base price. Final mileage is confirmed on the day.",
  },
  {
    title: "10. Waste Removal — Minimum Booking",
    body:
      "Waste removal bookings are subject to a minimum charge of £60. If the total of selected items is below £60, the price is rounded up. For small jobs, individual items can be selected without choosing a load size.",
  },
  {
    title: "11. Quotes",
    body:
      "All quotes are estimates based on the information provided. Final pricing may change if the job conditions differ on the day (extra items, additional stairs, parking issues, etc.).",
  },
  {
    title: "12. Changes to Bookings",
    body:
      "If you need to change the date, time or address of a confirmed booking, please let us know as early as possible. We will do our best to accommodate changes subject to availability.",
  },
  {
    title: "13. Contact",
    body:
      "For any booking questions, contact us at move4u.uk@gmail.com or call +44 7946 259714.",
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
            className="btn-purple w-full py-3 font-semibold rounded-xl text-sm"
            data-testid="continue-booking-from-policy"
          >
            Continue booking
          </button>
        </div>
      </div>
    </div>
  );
}
