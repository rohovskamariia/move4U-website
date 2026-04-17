import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function BookingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="text-sm text-purple-700 hover:underline mb-6 inline-block">
          &larr; Back to home
        </Link>
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
            <p>For some bookings — including same-day, weekend, and large jobs — a small deposit may be required to secure your slot. Deposits are deducted from the final invoice.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Quotes</h2>
            <p>All quotes are estimates based on the information provided. Final pricing may change if the job conditions differ on the day (extra items, additional stairs, parking issues, etc.).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Changes to Bookings</h2>
            <p>If you need to change the date, time or address of a confirmed booking, please let us know as early as possible. We will do our best to accommodate changes subject to availability.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>For any booking questions, contact us at move4foru@gmail.com or call +44 7888 355523.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
