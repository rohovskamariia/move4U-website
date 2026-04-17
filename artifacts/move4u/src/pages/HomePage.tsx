import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import ServicesSection from "@/components/ServicesSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { CONTACT } from "@/data/constants";
import {
  ShieldCheck, BadgePoundSterling, Zap, CalendarClock,
  FileText, Calendar, CheckCircle2, Truck,
} from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const whyChoose = [
    { icon: ShieldCheck, label: "Reliable & experienced team", text: "Trained movers who treat your belongings like our own." },
    { icon: BadgePoundSterling, label: "Transparent pricing", text: "Clear hourly rates and no hidden fees." },
    { icon: Zap, label: "Fast response", text: "Quick replies on WhatsApp, phone or email." },
    { icon: CalendarClock, label: "Flexible booking", text: "Same-day slots and bookings 7 days a week." },
  ];

  const steps = [
    { icon: FileText, title: "Get a Quote", text: "Tell us what you need and get a quick estimate." },
    { icon: Calendar, title: "Choose Your Time", text: "Pick a date and time that works for you." },
    { icon: CheckCircle2, title: "Confirm Booking", text: "We confirm your booking and may require a small deposit." },
    { icon: Truck, title: "We Get It Done", text: "Our team arrives and completes the job professionally." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero slider */}
      <HeroSlider />

      {/* Services */}
      <ServicesSection />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-purple-700 mb-2">PROCESS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Booking with Move4U is simple — from first quote to job done.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="relative bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow">
                  {i + 1}
                </div>
                <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 mt-2">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-purple-700 mb-2">WHY MOVE4U</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Why Choose Us</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Hundreds of customers trust Move4U for stress-free moves across London.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoose.map(({ icon: Icon, label, text }) => (
              <div key={label} className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="py-16 bg-gradient-to-br from-purple-700 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">London's Trusted Moving Service</h2>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-6">
            Move4U is a self-employed moving service based in London. We offer house moves, waste collection, commercial relocations, and single item deliveries across London and surrounding areas. No fuss, fair prices, and a professional job every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book")}
              className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors text-sm"
              data-testid="about-book-now"
            >
              Book Now
            </button>
            <a
              href={`tel:${CONTACT.driver}`}
              className="border border-white/30 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors text-sm"
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
