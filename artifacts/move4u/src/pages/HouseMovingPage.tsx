import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  HandHelping,
  MapPin,
  ShieldCheck,
  Sofa,
  Truck,
} from "lucide-react";

/**
 * /house-moving — premium SEO landing page for the "House Moving" service.
 *
 * This page is intentionally separate from the booking flow at
 * /book/house-move. It exists to:
 *   1. Rank for "house moving London" / "removals London" search terms,
 *   2. Build trust before the customer enters the booking form.
 *
 * The booking flow itself, pricing logic and constants are unchanged —
 * the CTAs simply deep-link into the existing flow.
 */
export default function HouseMovingPage() {
  usePageMeta({
    title: "House Moving London | Move4U Removals Service",
    description:
      "Professional house moving service in London by Move4U. Reliable removals, careful handling and flexible booking available. Get a quote online.",
    path: "/house-moving",
  });
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState(false);

  const benefits = [
    {
      icon: HandHelping,
      title: "Careful, professional handling",
      text: "Our team treats every box, sofa and fragile item with the same care we'd give our own.",
    },
    {
      icon: CalendarClock,
      title: "Flexible scheduling",
      text: "Book in advance or request a same-day slot — including weekends and evenings.",
    },
    {
      icon: Sofa,
      title: "Loading and unloading support",
      text: "We help with the heavy lifting from doorstep to doorstep — no extra coordination needed.",
    },
    {
      icon: Truck,
      title: "Small flats to full houses",
      text: "From a studio move to a five-bedroom relocation, we right-size the van and team for the job.",
    },
    {
      icon: MapPin,
      title: "London and beyond",
      text: "Reliable coverage across all London boroughs and the surrounding areas.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8fd]">
      <Navbar />

      {/* HERO — clean, editorial header. No stock photo overlay; the brand
          purple lives in a soft top wash and the CTA buttons. */}
      <section
        className="relative pt-14 sm:pt-20 pb-14 sm:pb-20 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #f3eefc 0%, #faf8fd 70%, #faf8fd 100%)",
        }}
      >
        {/* Soft branded glow accents */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-purple-100/40 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-3">
            HOUSE MOVING SERVICE
          </p>
          <h1 className="text-[30px] sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-4">
            House Moving in London
          </h1>
          <p className="text-gray-600 text-[15px] sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Reliable and professional house moving service across London,
            tailored to make your move simple and stress-free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book/house-move")}
              className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-full text-[14px] sm:text-[15px]"
              data-testid="hero-book-house-move"
            >
              Book House Moving
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setLocation("/book")}
              className="border border-gray-200 bg-white text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px] sm:text-[15px]"
              data-testid="hero-get-quote"
            >
              Get a Quote
            </button>
          </div>
        </div>
      </section>

      {/* INTRO — short editorial paragraph, builds context before benefits */}
      <section className="py-12 sm:py-16 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-gray-700 text-[15px] sm:text-[17px] leading-relaxed text-center">
            Move4U offers a dependable and well-organised house moving service
            across London and the UK. Whether you're relocating from a small
            flat or a full property, our team ensures careful handling,
            efficient transport and a smooth experience from start to finish.
          </p>
        </div>
      </section>

      {/* BENEFITS — clean editorial grid, no heavy card boxes */}
      <section className="py-14 sm:py-20 bg-[#faf8fd]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              WHAT'S INCLUDED
            </p>
            <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
              A house move done properly
            </h2>
            <p className="text-gray-500 text-[14px] sm:text-base max-w-xl mx-auto leading-relaxed">
              Everything you should expect from a professional London removals
              team — included as standard.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-20px_rgba(74,49,156,0.18)] flex gap-4 items-start"
              >
                <div
                  className="text-white w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[15.5px] tracking-tight mb-1">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-[13.5px] leading-relaxed">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TRUST — full-width branded purple highlight, mirrors HomePage's
          "Why Choose Us" section style for visual consistency. */}
      <section
        className="py-14 sm:py-20 text-white relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #5b3fb8 0%, #4a319c 55%, #3a267f 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 ring-1 ring-white/20 mb-5">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[24px] sm:text-3xl font-bold text-white tracking-tight mb-3">
            A reliable, straightforward moving experience
          </h2>
          <p className="text-purple-100/90 text-[14.5px] sm:text-base leading-relaxed">
            We focus on delivering a reliable and straightforward moving
            experience. Our team works efficiently while taking care of your
            belongings, ensuring your move is handled safely and without
            unnecessary stress.
          </p>
        </div>
      </section>

      {/* CTA — primary booking call-out */}
      <section className="py-14 sm:py-18 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            READY WHEN YOU ARE
          </p>
          <h2 className="text-[24px] sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            Book your London house move today
          </h2>
          <p className="text-gray-600 text-[14px] sm:text-base leading-relaxed max-w-xl mx-auto mb-7">
            Tell us a bit about your move and we'll come back with a clear,
            honest quote — no hidden fees, no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book/house-move")}
              className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-full text-[14px] sm:text-[15px]"
              data-testid="cta-book-house-move"
            >
              Book House Moving
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setLocation("/book")}
              className="border border-gray-200 bg-white text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px] sm:text-[15px]"
              data-testid="cta-get-quote"
            >
              Get a Quote
            </button>
          </div>
        </div>
      </section>

      {/* FAQ — short and focused. Single expandable item keeps the page
          clean and scannable. */}
      <section className="py-14 sm:py-18 bg-[#faf8fd]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              FAQ
            </p>
            <h2 className="text-[24px] sm:text-3xl font-bold text-gray-900 tracking-tight">
              Common questions
            </h2>
          </div>

          <div className="bg-white rounded-2xl ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08)] overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenFaq((v) => !v)}
              aria-expanded={openFaq}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-purple-50/40 transition-colors"
              data-testid="faq-toggle"
            >
              <span className="font-semibold text-gray-900 text-[14.5px] sm:text-[15.5px] tracking-tight">
                How much does house moving cost?
              </span>
              <ChevronDown
                className={`w-5 h-5 text-purple-700 shrink-0 transition-transform ${
                  openFaq ? "rotate-180" : ""
                }`}
              />
            </button>
            {openFaq && (
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
                <p className="text-gray-600 text-[13.5px] sm:text-[14.5px] leading-relaxed">
                  The price depends on the size of the move, time required and
                  distance. You can get a quick estimate through our booking
                  system.
                </p>
                <button
                  onClick={() => setLocation("/book/house-move")}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-700 hover:text-purple-800"
                  data-testid="faq-book-link"
                >
                  Get my estimate
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.25} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
