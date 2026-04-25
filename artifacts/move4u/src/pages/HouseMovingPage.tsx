import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewsSection from "@/components/ReviewsSection";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { HELP_PRICING, VAN_SIZES } from "@/data/constants";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  HandHelping,
  HeadphonesIcon,
  MapPin,
  PoundSterling,
  ShieldCheck,
  Sofa,
  Truck,
} from "lucide-react";
import heroImg from "@/assets/hero/move4u_hero_v3.png";

/**
 * /house-moving — premium SEO + conversion landing page.
 *
 * Goal: rank for "house moving London" and convert visitors into bookings.
 *
 * IMPORTANT: This page does NOT contain any booking logic. The quick-quote
 * card on the hero is just a low-friction entry point that pushes the user
 * into the existing booking flow at /book/house-move. Pricing values are
 * mirrored from src/data/constants.ts (HELP_PRICING) for display only —
 * the source of truth remains the booking flow.
 */
export default function HouseMovingPage() {
  usePageMeta({
    title: "House Moving London | Move4U Removals Service",
    description:
      "Professional house moving service in London by Move4U. Reliable removals, careful handling and flexible booking available. Get a quote online.",
    path: "/house-moving",
  });
  const [, setLocation] = useLocation();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const onQuickQuote = () => {
    // Spec: quick quote redirects into the real booking flow.
    // We do not modify booking logic — addresses are re-entered there.
    setLocation("/book/house-move");
  };

  const included = [
    {
      icon: HandHelping,
      title: "Careful handling",
      text: "We treat your furniture like our own.",
    },
    {
      icon: Sofa,
      title: "Loading & unloading",
      text: "Fast and safe moving process.",
    },
    {
      icon: Truck,
      title: "Transport",
      text: "Reliable vans across London.",
    },
    {
      icon: CalendarClock,
      title: "Flexible booking",
      text: "Same-day & scheduled moves.",
    },
  ];

  const whyUs = [
    {
      icon: PoundSterling,
      title: "Transparent pricing",
      text: "Clear hourly rates, no surprises.",
    },
    {
      icon: Clock,
      title: "Same-day availability",
      text: "We can move you today.",
    },
    {
      icon: MapPin,
      title: "London & UK coverage",
      text: "Local and long-distance moves.",
    },
    {
      icon: HeadphonesIcon,
      title: "Customer support",
      text: "We help before, during and after.",
    },
  ];

  // Pricing is sourced from HELP_PRICING / VAN_SIZES (single source of truth
  // in src/data/constants.ts). Display copy ("note") is page-local.
  const vanNotes: Record<string, string> = {
    small: "Studios & small loads",
    medium: "1–2 bed flats",
    large: "Family homes",
  };
  const vans = VAN_SIZES.map((v) => ({
    id: v.id,
    name: v.name,
    price: `£${HELP_PRICING[v.id]?.noHelp ?? v.basePrice}`,
    note: vanNotes[v.id] ?? v.description,
  }));

  // Driver-help delta is uniform across van sizes (driverHelp - noHelp).
  // We compute it from the small van and assert below in dev.
  const driverHelpDelta =
    HELP_PRICING.small.driverHelp - HELP_PRICING.small.noHelp;
  // Driver+helper deltas vary by van size — show the lowest as the "from".
  const driverPlusHelperFromDelta = Math.min(
    ...Object.values(HELP_PRICING).map((p) => p.driverPlusHelper - p.noHelp),
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
      {/* ============================================================
          HERO — image background with dark overlay.
          Left column: title, subtitle, CTAs, trust line.
          Right column: quick-quote conversion card.
          ============================================================ */}
      <section className="relative overflow-hidden isolate">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Move4U removals team carrying furniture into a van during a London house move"
            className="w-full h-full object-cover"
          />
          {/* Soft dark overlay for legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(20,12,46,0.82) 0%, rgba(58,38,127,0.70) 55%, rgba(91,63,184,0.50) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-14 sm:pb-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* LEFT — copy */}
            <div className="lg:col-span-7 text-white">
              <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.22em] text-purple-200 mb-3">
                HOUSE MOVING SERVICE
              </p>
              <h1 className="text-[32px] sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.05] mb-4">
                House Moving in London
              </h1>
              <p className="text-purple-50/90 text-[15px] sm:text-lg leading-relaxed max-w-xl mb-7">
                Reliable and professional house moving service across London.
                We handle everything so you can move stress-free.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={() => setLocation("/book")}
                  className="bg-white text-purple-900 font-semibold px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-[14px] sm:text-[15px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]"
                  data-testid="hero-get-quote"
                >
                  Get a Quote
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </button>
                <button
                  onClick={() => setLocation("/book/house-move")}
                  className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full text-[14px] sm:text-[15px]"
                  data-testid="hero-book-now"
                >
                  Book Now
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </button>
              </div>

              {/* Trust line */}
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] sm:text-[13.5px] text-purple-100/95">
                {["Fully insured", "No hidden fees", "5-star service"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-300 shrink-0"
                        strokeWidth={2.5}
                      />
                      <span>{t}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* RIGHT — quick quote card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_30px_70px_-20px_rgba(20,12,46,0.55)] ring-1 ring-white/30">
                <div className="mb-4">
                  <p className="text-[10.5px] font-semibold tracking-[0.2em] text-purple-700 mb-1.5">
                    QUICK QUOTE
                  </p>
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-gray-900 tracking-tight">
                    Get your quick quote
                  </h2>
                  <p className="text-gray-500 text-[12.5px] mt-1">
                    Tell us where — we'll take you to the booking flow.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onQuickQuote();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label
                      htmlFor="quick-pickup"
                      className="block text-[12px] font-semibold text-gray-700 mb-1.5"
                    >
                      Pickup address
                    </label>
                    <AddressAutocomplete
                      id="quick-pickup"
                      value={pickup}
                      onChange={(v) => setPickup(v)}
                      placeholder="Enter pickup postcode or address"
                      testId="quick-quote-pickup"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quick-dropoff"
                      className="block text-[12px] font-semibold text-gray-700 mb-1.5"
                    >
                      Drop-off address
                    </label>
                    <AddressAutocomplete
                      id="quick-dropoff"
                      value={dropoff}
                      onChange={(v) => setDropoff(v)}
                      placeholder="Enter drop-off postcode or address"
                      testId="quick-quote-dropoff"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-purple w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full text-[14px] mt-1"
                    data-testid="quick-quote-submit"
                  >
                    Get Quote
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                  <p className="text-[11.5px] text-gray-400 text-center pt-1">
                    No payment required to get a quote.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT'S INCLUDED — 4 clean light cards
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-9 sm:mb-12">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              WHAT'S INCLUDED
            </p>
            <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight">
              Everything you need for a smooth move
            </h2>
          </div>

          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {included.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(74,49,156,0.12),_0_24px_48px_-22px_rgba(74,49,156,0.28)]"
              >
                <div
                  className="text-white w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </div>
                <h3 className="font-semibold text-gray-900 text-[14.5px] sm:text-[15px] tracking-tight mb-1">
                  {title}
                </h3>
                <p className="text-gray-500 text-[12.5px] sm:text-[13px] leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
          WHY CHOOSE MOVE4U — 4 trust items
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-[#faf8fd]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-9 sm:mb-12">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              WHY CHOOSE MOVE4U
            </p>
            <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight">
              Built around how Londoners actually move
            </h2>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {whyUs.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="text-center px-2"
              >
                <div
                  className="text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_8px_22px_-8px_rgba(74,49,156,0.55)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <h3 className="font-semibold text-gray-900 text-[14.5px] sm:text-[15px] tracking-tight mb-1">
                  {title}
                </h3>
                <p className="text-gray-500 text-[12.5px] sm:text-[13px] leading-relaxed">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
          PRICING PREVIEW — simple, transparent
          ============================================================ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-9 sm:mb-12">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
              PRICING
            </p>
            <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 text-[14px] sm:text-base max-w-xl mx-auto leading-relaxed">
              Pay by the hour. No hidden fees, no surprises.
            </p>
          </div>

          {/* Van rates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            {vans.map((v) => (
              <div
                key={v.name}
                className="relative bg-white rounded-2xl p-5 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)] text-center"
              >
                <p className="text-[12px] font-semibold tracking-wide text-purple-700 mb-1.5 uppercase">
                  {v.name}
                </p>
                <p className="text-gray-400 text-[11.5px] mb-2">from</p>
                <p className="text-[28px] sm:text-[32px] font-bold text-gray-900 tracking-tight leading-none">
                  {v.price}
                  <span className="text-gray-400 text-[15px] font-medium">
                    /hr
                  </span>
                </p>
                <p className="text-gray-500 text-[12.5px] mt-2">{v.note}</p>
              </div>
            ))}
          </div>

          {/* Help options + minimum note */}
          <div className="bg-[#faf8fd] rounded-2xl ring-1 ring-purple-100/60 p-4 sm:p-5 mb-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-purple-100 flex items-center justify-center shrink-0">
                  <HandHelping
                    className="w-4 h-4 text-purple-700"
                    strokeWidth={2.25}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-[13.5px]">
                    Driver help
                  </p>
                  <p className="text-gray-500 text-[12.5px]">
                    +£{driverHelpDelta}/hr — driver helps with loading
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-purple-100 flex items-center justify-center shrink-0">
                  <HandHelping
                    className="w-4 h-4 text-purple-700"
                    strokeWidth={2.25}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-[13.5px]">
                    Driver + helper
                  </p>
                  <p className="text-gray-500 text-[12.5px]">
                    from +£{driverPlusHelperFromDelta}/hr — extra hands for bigger moves
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-[12px] mt-4 text-center sm:text-left">
              Minimum booking: 2 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book/house-move")}
              className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-full text-[14px] sm:text-[15px]"
              data-testid="pricing-book-now"
            >
              Book now
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setLocation("/pricing")}
              className="border border-gray-200 bg-white text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px] sm:text-[15px]"
              data-testid="pricing-view-full"
            >
              View full pricing
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          REVIEWS — reuse the existing component (already polished)
          ============================================================ */}
      <ReviewsSection />

      {/* ============================================================
          FINAL CTA — purple background
          ============================================================ */}
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
          <h2 className="text-[26px] sm:text-4xl font-bold text-white tracking-tight mb-3">
            Ready to move?
          </h2>
          <p className="text-purple-100/90 text-[14.5px] sm:text-base leading-relaxed max-w-xl mx-auto mb-7">
            Get your quote in seconds and book your move today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book")}
              className="bg-white text-purple-900 font-semibold px-7 py-3 rounded-full inline-flex items-center justify-center gap-2 hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-[14px] sm:text-[15px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]"
              data-testid="final-get-quote"
            >
              Get a Quote
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setLocation("/book/house-move")}
              className="bg-purple-900/40 hover:bg-purple-900/60 ring-1 ring-white/30 text-white font-semibold px-7 py-3 rounded-full inline-flex items-center justify-center gap-2 transition-all text-[14px] sm:text-[15px]"
              data-testid="final-book-house-move"
            >
              Book House Moving
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
