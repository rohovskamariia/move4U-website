import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="text-sm text-purple-700 hover:underline mb-6 inline-block">
          &larr; Back to home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Cancellation Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Free Cancellation</h2>
            <p>You may cancel or reschedule your booking free of charge up to 24 hours before the agreed start time.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Late Cancellation</h2>
            <p>Cancellations made less than 24 hours before the booking may incur a charge equal to the deposit (if paid) or a small admin fee, to cover lost slot time.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. No-Show</h2>
            <p>If our team arrives at the agreed location and the customer is not present or the job cannot proceed, the deposit will be retained and a call-out fee may apply.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Cancellation by Move4U</h2>
            <p>In the rare event we need to cancel due to illness, vehicle issues or unforeseen circumstances, you will receive a full refund of any deposit paid, and we will offer to reschedule at no extra cost.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. How to Cancel</h2>
            <p>To cancel or reschedule, contact us as soon as possible by WhatsApp, phone or email. Please reference your booking ID where possible.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>For cancellation queries, contact us at move4foru@gmail.com or call +44 7946 259714.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
