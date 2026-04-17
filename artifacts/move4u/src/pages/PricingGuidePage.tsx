import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function PricingGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="text-sm text-purple-700 hover:underline mb-6 inline-block">
          &larr; Back to home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pricing Guide</h1>
        <p className="text-gray-500 text-sm mb-8">A clear breakdown of how Move4U pricing works.</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">House &amp; Commercial Moving</h2>
            <p>Moving jobs are charged on an hourly basis, starting from £35/hour for a small van. The final price depends on the van size, number of helpers, stairs and travel distance.</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>Small van — from £35/hour</li>
              <li>Medium van — from £40/hour</li>
              <li>Large van — from £45/hour</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Single Item Delivery</h2>
            <p>Single item deliveries start from £15. The exact price depends on the item size, distance and whether stairs are involved.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Waste Removal</h2>
            <p>Waste removal is charged by load size, starting from £60 for a minimum load up to £400 for an extra-large load. Heavy items such as mattresses, fridges and sofas may have additional surcharges.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Stair Charges</h2>
            <p>Ground floor and lift access are free. Additional floors carry a small surcharge to cover extra time and effort:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>1st floor — +£10</li>
              <li>2nd floor — +£20</li>
              <li>3rd floor — +£30</li>
              <li>4th floor — +£40</li>
              <li>5th floor and above — please contact us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">International Moving</h2>
            <p>International moves are quoted individually based on origin, destination and volume. Please contact us for a personalised quote.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Hidden Fees</h2>
            <p>The price you agree before the job is the price you pay — unless the job changes on the day (e.g. additional items or extra time). Any changes are always discussed with you first.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Get an Exact Quote</h2>
            <p>For a precise price, use our <Link href="/book?action=quote" className="text-purple-700 hover:underline">online quote tool</Link> or message us on WhatsApp.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
