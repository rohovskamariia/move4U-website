import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Home, Plus } from "lucide-react";
import { CONTACT } from "@/data/constants";

interface BookingSuccessProps {
  /** Booking reference returned by the API (e.g. "MV4U-1042"). */
  bookingRef: string;
  /**
   * Hand control back to the parent flow so it can clear the selected
   * service and remount a fresh form when the user clicks
   * "Create new booking". This is the same callback the in-flow back
   * button uses.
   */
  onCreateNew: () => void;
}

/**
 * The polished, post-submit "thank you" card shown once a booking is
 * created. Lifted out of StandardBookingFlow so every booking flow
 * (House Moving, Waste Removal, Single Item, Commercial) lands on the
 * same confirmation UI — same green check, reference card, contact
 * line, and pair of CTA buttons.
 *
 * International Moving deliberately keeps its own simpler success view.
 */
export default function BookingSuccess({ bookingRef, onCreateNew }: BookingSuccessProps) {
  const [, setLocation] = useLocation();

  // Jump to the top so the user immediately sees the confirmation card
  // instead of being left scrolled near the submit button further down.
  useEffect(() => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  return (
    <div className="text-center py-6 sm:py-8" data-testid="booking-success">
      <div className="bg-green-100 text-green-700 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
        Thank you — we received your request.
      </h3>
      <div
        className="inline-block bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 mb-4"
        data-testid="booking-reference"
      >
        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
          Booking Reference
        </p>
        <p className="text-xl font-bold" style={{ color: "#3D1289" }}>
          {bookingRef}
        </p>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto mb-3">
        We will contact you shortly to confirm availability, final price,
        and booking details.
      </p>
      <p className="text-gray-500 text-[13px] leading-relaxed max-w-sm mx-auto mb-6">
        If you need to change your booking, please contact us with your
        booking reference at{" "}
        <a
          href={`tel:${CONTACT.driver.replace(/\s/g, "")}`}
          className="font-semibold underline underline-offset-2"
          style={{ color: "#3D1289" }}
        >
          {CONTACT.driverDisplay}
        </a>
        .
      </p>
      <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="btn-purple w-full py-2.5 sm:py-3 font-semibold rounded-xl text-sm inline-flex items-center justify-center gap-2"
          data-testid="success-back-home"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="btn-outline-purple w-full py-2.5 sm:py-3 font-semibold rounded-xl text-sm inline-flex items-center justify-center gap-2"
          data-testid="success-new-booking"
        >
          <Plus className="w-4 h-4" />
          Create new booking
        </button>
      </div>
    </div>
  );
}
