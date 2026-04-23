import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import { usePageMeta } from "@/lib/usePageMeta";

export default function PrivacyPage() {
  usePageMeta({
    title: "Privacy Policy | Move4U",
    description: "How Move4U handles your personal data when you book our London removals and moving service.",
    path: "/privacy",
  });
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <BackToHome className="mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Who We Are</h2>
            <p>
              Move4U is a self-employed removal service based in London, UK. We are committed to protecting your personal information and your right to privacy. If you have any questions about this policy, please contact us at move4u.uk@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your name and phone number when making a booking or enquiry</li>
              <li>Pickup and drop-off addresses</li>
              <li>Booking preferences and any notes you provide</li>
              <li>Photos you choose to upload to assist with your booking</li>
              <li>Communication records via WhatsApp, phone, or email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Confirm and manage your booking</li>
              <li>Contact you regarding your service</li>
              <li>Provide an accurate quote for your move</li>
              <li>Improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. How We Share Your Information</h2>
            <p>
              We do not sell, rent, or share your personal information with third parties except where required by law, or to complete your service (e.g., informing a driver of your address).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to provide our services and comply with legal obligations. Booking records may be retained for up to 12 months after the service date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Your Rights</h2>
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Request access to your personal data</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at move4u.uk@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cookies</h2>
            <p>
              This website may use basic cookies to ensure proper functionality. We do not use tracking or advertising cookies. You can disable cookies in your browser settings at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
            <p>
              For any privacy-related concerns, please contact us at move4u.uk@gmail.com or +44 7946 259714.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
