import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";

export default function BookingPolicyPage() {
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
            <p>All bookings have a minimum duration of 2 hours.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Quotes</h2>
            <p>All quotes are estimates based on the information provided. Final pricing may change if the job conditions differ on the day (extra items, additional stairs, parking issues, etc.).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Changes to Bookings</h2>
            <p>If you need to change the date, time or address of a confirmed booking, please let us know as early as possible. We will do our best to accommodate changes subject to availability.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>For any booking questions, contact us at move4foru@gmail.com or call +44 7946 259714.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
