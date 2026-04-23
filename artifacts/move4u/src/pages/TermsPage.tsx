import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import { usePageMeta } from "@/lib/usePageMeta";

export default function TermsPage() {
  usePageMeta({
    title: "Terms & Conditions | Move4U",
    description: "Move4U terms & conditions for our London removals and moving service.",
    path: "/terms",
  });
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <BackToHome className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p>
              These Terms and Conditions govern your use of Move4U's removal and delivery services. By booking or enquiring with Move4U, you agree to be bound by these terms. Move4U is a self-employed removal service operating in London, UK.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Bookings and Quotes</h2>
            <p>
              All quotes provided online or via WhatsApp are estimates only. A final confirmed price will be provided after review of your specific requirements. Move4U reserves the right to adjust pricing based on actual job conditions, including access issues, stair counts, and item weight or volume.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Cancellations</h2>
            <p>
              Cancellations must be made at least 24 hours before the scheduled booking time. Late cancellations or no-shows may incur a charge. Please contact us as soon as possible if you need to cancel or reschedule.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Liability</h2>
            <p>
              Move4U takes all reasonable care when handling your belongings. However, Move4U is not liable for damage to items that were not properly packed, fragile items not declared prior to the move, or items damaged due to pre-existing conditions. Any claims must be reported within 24 hours of service completion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Payment</h2>
            <p>
              Payment is due upon completion of the service unless otherwise agreed. Accepted payment methods will be confirmed at the time of booking. Prices quoted are in British Pounds (GBP) and include VAT where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Customer Responsibilities</h2>
            <p>
              Customers are responsible for ensuring clear access to the property, informing Move4U of any parking restrictions, and ensuring all items to be moved are ready at the agreed time. Additional time required due to customer delays may be charged.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Waste Removal</h2>
            <p>
              Move4U is not responsible for the disposal of hazardous materials, chemicals, or any items not legally permitted for standard waste collection. Customers must declare all waste items accurately prior to booking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>
              For any queries about these terms, please contact us at move4u.uk@gmail.com or call +44 7946 259714.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
