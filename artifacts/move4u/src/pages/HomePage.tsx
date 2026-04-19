import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { consumeScrollTarget } from "@/lib/sectionNav";
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

  // If we landed here via section nav from another page, jump straight to
  // the requested section before the browser paints — no visible flash at
  // the top of the homepage. We use an instant scroll (not smooth) so the
  // navigation feels direct.
  useLayoutEffect(() => {
    const target = consumeScrollTarget();
    if (!target) return;
    // Two animation frames to let the page lay out fully before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });
  }, []);

  const whyChoose = [
    { icon: ShieldCheck, label: "Reliable & experienced", text: "Trained movers who treat your belongings like our own." },
    { icon: BadgePoundSterling, label: "Transparent pricing", text: "Clear hourly rates and no hidden fees." },
    { icon: Zap, label: "Fast response", text: "Quick replies on WhatsApp, phone or email." },
    { icon: CalendarClock, label: "Flexible booking", text: "Same-day slots and bookings 7 days a week." },
  ];

  const steps = [
    { icon: FileText, title: "Get a Quote", text: "Tell us what you need and get a quick estimate." },
    { icon: Calendar, title: "Choose Your Time", text: "Pick a date and time that works for you." },
    { icon: CheckCircle2, title: "Confirm Details", text: "We review your details and contact you to finalise the booking." },
    { icon: Truck, title: "We Get It Done", text: "Our team arrives and completes the job professionally." },
  ];

  return (
    <div className="min-h-screen bg-[#faf8fd]">
      <Navbar />

      {/* Hero slider */}
      <HeroSlider />

      {/* Services */}
      <ServicesSection />

      {/* How It Works — refined editorial timeline.
          Mobile: continuous left rail with numbered nodes.
          Desktop: 4-column horizontal flow with subtle dotted connector. */}
      <section
        id="how-it-works"
        className="py-12 sm:py-16 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              PROCESS
            </p>
            <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
              How It Works
            </h2>
            <p className="text-gray-500 text-[14px] sm:text-base max-w-xl mx-auto leading-relaxed">
              Booking with Move4U is simple — from first quote to job done.
            </p>
          </div>

          {/* Mobile timeline (continuous purple rail) */}
          <ol className="lg:hidden relative pl-12">
            {/* Vertical rail */}
            <div
              className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-200 via-purple-200 to-transparent"
              aria-hidden="true"
            />
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative pb-7 last:pb-0">
                {/* Numbered node — sits on the rail */}
                <div className="absolute -left-12 top-0 flex items-center justify-center">
                  <div className="relative w-10 h-10 rounded-full bg-white ring-1 ring-purple-100 shadow-[0_4px_12px_-4px_rgba(124,58,237,0.25)] flex items-center justify-center text-purple-700">
                    <Icon className="w-[17px] h-[17px]" strokeWidth={2} />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-purple-700 text-white w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-[15.5px] tracking-tight mb-0.5">
                  {title}
                </h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ol>

          {/* Desktop horizontal flow */}
          <div className="hidden lg:block relative">
            <div
              className="absolute top-[28px] left-[12.5%] right-[12.5%] border-t-2 border-dashed border-purple-200"
              aria-hidden="true"
            />
            <div className="grid grid-cols-4 gap-6 relative">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className="relative flex flex-col items-center text-center">
                  <div className="relative shrink-0">
                    <div className="bg-white border-2 border-purple-100 shadow-[0_8px_20px_-8px_rgba(124,58,237,0.3)] w-14 h-14 rounded-full flex items-center justify-center text-purple-700">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-purple-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                      {i + 1}
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="font-semibold text-gray-900 text-[16px] tracking-tight mb-1">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-[14rem] mx-auto">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us — full-width branded purple highlight (desktop + mobile).
          Single bold brand surface using the same violet gradient as the logo
          and primary CTAs. White text, transparent circular icon chips, no
          inner boxes. Compact list-style layout. */}
      <section
        id="about"
        className="py-10 sm:py-16 text-white relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)",
        }}
      >
        {/* Soft glow accents — subtle depth without breaking the brand wash */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-7 sm:mb-12">
            <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-200 mb-2">
              WHY MOVE4U
            </p>
            <h2 className="text-[24px] sm:text-4xl font-bold text-white tracking-tight mb-2">
              Why Choose Us
            </h2>
            <p className="text-purple-100/90 text-[13.5px] sm:text-base max-w-xl mx-auto leading-relaxed">
              Hundreds of customers trust Move4U for stress-free moves across London.
            </p>
          </div>

          {/* Clean list-style layout — no card boxes, transparent icon circles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 max-w-5xl mx-auto">
            {whyChoose.map(({ icon: Icon, label, text }) => (
              <div
                key={label}
                className="flex sm:flex-col items-start sm:items-start gap-3 sm:gap-4"
              >
                <div className="bg-white/10 text-white w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ring-1 ring-white/20">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-[14.5px] sm:text-[15px] mb-0.5 sm:mb-1 tracking-tight">
                    {label}
                  </h3>
                  <p className="text-purple-100/85 text-[13px] sm:text-[13.5px] leading-relaxed">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About strip — clean, light call-out. Brand purple lives in the
          CTA button only, not as a heavy background block. */}
      <section className="py-14 sm:py-18 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            ABOUT MOVE4U
          </p>
          <h2 className="text-[24px] sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            London's Trusted Moving Service
          </h2>
          <p className="text-gray-600 text-[14px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-7">
            Move4U offers house moving, waste removal, single item delivery, commercial moving and international moving across London and surrounding areas. Clear pricing, flexible booking and professional service every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book")}
              className="btn-purple inline-flex items-center justify-center font-semibold px-7 py-3 rounded-full text-[14px]"
              data-testid="about-book-now"
            >
              Book Now
            </button>
            <a
              href={`tel:${CONTACT.driver}`}
              className="border border-gray-200 text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px]"
              data-testid="about-call-us"
            >
              Call: {CONTACT.driverDisplay}
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
