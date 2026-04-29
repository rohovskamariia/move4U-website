import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import { usePageMeta } from "@/lib/usePageMeta";

export default function BookingPolicyPage() {
  usePageMeta({
    title: "Booking Policy | Move4U Removals London",
    description: "Move4U booking policy: how reservations, deposits, and confirmations work for our London removals service.",
    path: "/booking-policy",
  });
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <BackToHome className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Booking Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. How to Book</h2>
            <p>You can book with Move4U via our online form, WhatsApp, phone or email. All bookings are subject to availability and confirmation by our team.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Confirmation</h2>
            <p>A booking is only considered confirmed once you receive a confirmation message from Move4U with the agreed date, time and price.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Deposits</h2>
            <p>A 30% deposit is required to secure a booking. The remaining balance will be confirmed with you before the job is finalised. Deposits are deducted from the final invoice.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Same-Day and Last-Minute Bookings</h2>
            <p>Same-day and last-minute bookings may be subject to an additional charge depending on timing, availability, and job details. Final pricing will always be confirmed by our team before the booking is finalised.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Minimum Booking Time</h2>
            <p>House &amp; commercial moves, waste removal and most other services have a minimum duration of 2 hours, which includes travel, loading and unloading.</p>
            <p>Single Item Delivery is the exception: a flat £60 covers the first hour, with £30 charged per additional 30 minutes after that.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Time Rounding</h2>
            <p>We round on-site time fairly: anything up to 4 minutes over a half-hour block is free; from 5 minutes onwards we round up to the next 30-minute block.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Stairs &amp; Floor Counting</h2>
            <p>If a lift is not available, every flight of stairs is charged at £10 per floor. For partial flights, every 4 steps counts as one floor.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Congestion Charge</h2>
            <p>A single £18 Congestion Charge is added when any address on the route — pickup, drop-off, or any additional stop — is inside the Central London congestion zone. The charge is applied once per booking, regardless of how many addresses fall inside the zone.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Outside the M25</h2>
            <p>Jobs that go beyond the M25 are charged at £1 per extra mile on top of the base price. Final mileage is confirmed on the day.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Waste Removal — Minimum Booking</h2>
            <p>Waste removal bookings are subject to a minimum charge of £60.</p>
            <p>If the total value of selected items is below £60, the final price will be adjusted to £60.</p>
            <p>For small jobs, users can select individual items without choosing a load size. Additional items can be added in the notes section. Final pricing may be adjusted accordingly.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Quotes</h2>
            <p>All quotes are estimates based on the information provided. Final pricing may change if the job conditions differ on the day (extra items, additional stairs, parking issues, etc.).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Changes to Bookings</h2>
            <p>If you need to change the date, time or address of a confirmed booking, please let us know as early as possible. We will do our best to accommodate changes subject to availability.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">13. Contact</h2>
            <p>For any booking questions, contact us at move4u.uk@gmail.com or call +44 7946 259714.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
