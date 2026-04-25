import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { consumeScrollTarget } from "@/lib/sectionNav";
import { usePageMeta } from "@/lib/usePageMeta";
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
  usePageMeta({
    title: "Move4U London Removals | Man and Van from £35/h | Same-Day Service",
    description:
      "Fast and reliable removals in London from £35/hour. House moves, man and van, furniture delivery and waste removal. Same-day service available. Get a quote online.",
    path: "/",
  });
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

      {/* How It Works — clean horizontal timeline.
          Desktop: small icon nodes in one row, joined by a thin solid line.
          Mobile: horizontal scroll-snap carousel with the same compact node. */}
      <section
        id="how-it-works"
        className="py-10 sm:py-12 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-7 sm:mb-10">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
              PROCESS
            </p>
            <h2 className="text-[24px] sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              How It Works
            </h2>
            <p className="text-gray-500 text-[13.5px] sm:text-[15px] max-w-xl mx-auto leading-relaxed">
              Booking with Move4U is simple — from first quote to job done.
            </p>
          </div>

          {/* Mobile — horizontal scroll-snap timeline.
              Native overflow scroll keeps it lightweight and doesn't conflict
              with the page's vertical scroll. Each step is a snap target. */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            <ol className="flex gap-3 pb-2 w-max">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li
                  key={title}
                  className="snap-start shrink-0 w-[230px] flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-700">
                        <Icon className="w-[17px] h-[17px]" strokeWidth={2} />
                      </div>
                      <span className="absolute -top-1 -right-1 bg-purple-700 text-white w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                        {i + 1}
                      </span>
                    </div>
                    {/* Subtle connector tail — visually hints "swipe for more" */}
                    {i < steps.length - 1 && (
                      <div
                        className="flex-1 h-px bg-purple-100"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[14.5px] tracking-tight mb-1">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Desktop — horizontal timeline in one row, joined by a thin
              solid line. Compact circular nodes, no boxes or shadows.
              Semantic <ol>/<li> mirrors the mobile carousel above. */}
          <div className="hidden lg:block relative">
            {/* Thin solid connecting line — sits behind the nodes, anchored
                to the centre of the icon row (icon h-11 ⇒ centre ≈ 22px). */}
            <div
              className="absolute top-[22px] left-[12.5%] right-[12.5%] h-px bg-purple-100"
              aria-hidden="true"
            />
            <ol className="grid grid-cols-4 gap-6 relative">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li
                  key={title}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative shrink-0">
                    <div className="bg-purple-50 w-11 h-11 rounded-full flex items-center justify-center text-purple-700">
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-purple-700 text-white w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                      {i + 1}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 text-[15px] tracking-tight mb-1">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-[13px] leading-relaxed max-w-[14rem] mx-auto">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
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
            "linear-gradient(135deg, #5b3fb8 0%, #4a319c 55%, #3a267f 100%)",
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
            London's Trusted Removals & Man and Van Service
          </h2>
          <p className="text-gray-600 text-[14px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-7">
            Move4U is a London-based removals company offering house moving, man and van, furniture delivery, commercial moving and waste removal services across London and surrounding areas. From single-item drop-offs to full house moves, we provide a same-day moving service with clear hourly pricing from £35/hour and friendly, professional movers.
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
