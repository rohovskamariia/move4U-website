import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import ServicesSection from "@/components/ServicesSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { CONTACT } from "@/data/constants";
import { Truck, Clock, Shield, Star } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero slider */}
      <HeroSlider />

      {/* Trust signals */}
      <section id="about" className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: "All van sizes", text: "Small, medium and large" },
              { icon: Clock, label: "Available 7 days", text: "Morning to evening slots" },
              { icon: Shield, label: "Reliable service", text: "Professional and careful" },
              { icon: Star, label: "Trusted locally", text: "Hundreds of moves done" },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="text-center">
                <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bar — moved below trust signals so it no longer overlaps the hero */}
      <div className="bg-purple-700 text-white py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-purple-100 text-center sm:text-left">
            Professional removals across London — available 7 days a week
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => setLocation("/book?action=quote")}
              className="text-sm font-semibold text-purple-700 bg-white px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              data-testid="hero-get-quote"
            >
              Get a Quote
            </button>
            <button
              onClick={() => setLocation("/book")}
              className="text-sm font-semibold text-white border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              data-testid="hero-book-now"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Services */}
      <ServicesSection />

      {/* About strip */}
      <section className="py-12 bg-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">London's Trusted Removal Service</h2>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-6">
            Move4U is a self-employed removal service based in London. We offer house moves, waste collection, commercial relocations, and single item deliveries across London and surrounding areas. No fuss, fair prices, and a professional job every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book")}
              className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors text-sm"
              data-testid="about-book-now"
            >
              Book Now
            </button>
            <a
              href={`tel:${CONTACT.driver}`}
              className="border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              data-testid="about-call-us"
            >
              Call Us: {CONTACT.driverDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection />

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
