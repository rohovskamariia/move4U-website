import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { HELP_PRICING, REVIEWS, VAN_SIZES } from "@/data/constants";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  HandHelping,
  MapPin,
  Quote,
  ShieldCheck,
  Sofa,
  Star,
  Truck,
} from "lucide-react";
import heroImg from "@/assets/hero/move4u_hero_v3.png";
import teamImg from "@/assets/reviews/move4u_real_move.webp";

/**
 * /house-moving — premium SEO + conversion landing page.
 *
 * Goal: rank for "house moving London" and convert visitors into bookings.
 *
 * IMPORTANT: This page does NOT contain any booking logic. The quick-quote
 * card on the hero is a low-friction entry point that hands pickup +
 * drop-off addresses to the existing booking flow at /book/house-move via
 * URL query params (?pickup=...&dropoff=...). Pricing values are read
 * directly from HELP_PRICING / VAN_SIZES (single source of truth).
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

  /**
   * Hand off the typed pickup / drop-off addresses to /book/house-move via
   * URL query params. The booking page reads these once on mount and seeds
   * its address fields — so the user never re-enters the same address.
   *
   * If both fields are empty we just navigate to the booking flow as
   * normal — no query string clutter.
   */
  const onQuickQuote = () => {
    const params = new URLSearchParams();
    const p = pickup.trim();
    const d = dropoff.trim();
    if (p) params.set("pickup", p);
    if (d) params.set("dropoff", d);
    const qs = params.toString();
    setLocation(qs ? `/book/house-move?${qs}` : "/book/house-move");
  };

  /* ---------- Section data ---------- */

  const handled = [
    {
      icon: HandHelping,
      title: "Careful handling",
      text: "We move your furniture safely and securely.",
    },
    {
      icon: Sofa,
      title: "Loading & unloading",
      text: "Fast and efficient service.",
    },
    {
      icon: Truck,
      title: "Transport across London & UK",
      text: "Reliable vans for any job.",
    },
    {
      icon: Boxes,
      title: "Help with heavy items",
      text: "Sofas, appliances and large furniture.",
    },
  ];

  const whyPoints = [
    "We arrive on time",
    "We handle items carefully",
    "Clear pricing — no surprises",
    "Same-day availability",
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
    popular: v.id === "medium",
  }));

  // Driver-help delta is uniform across van sizes (driverHelp - noHelp).
  const driverHelpDelta =
    HELP_PRICING.small.driverHelp - HELP_PRICING.small.noHelp;
  // Driver+helper deltas vary by van size — show the lowest as the "from".
  const driverPlusHelperFromDelta = Math.min(
    ...Object.values(HELP_PRICING).map((p) => p.driverPlusHelper - p.noHelp),
  );

  // Show only 2 reviews on this landing page (per spec). Picks the first
  // two 5-star ones to keep the social proof strong.
  const featuredReviews = REVIEWS.filter((r) => r.rating === 5).slice(0, 2);

  // Placeholder Google reviews link — defaults to a Google search for the
  // brand until a real Google Business profile URL is wired in.
  const googleReviewsUrl =
    "https://www.google.com/search?q=Move4U+London+removals+reviews";

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
                  Move without stress — we handle everything
                </h1>
                <p className="text-purple-50/90 text-[15px] sm:text-lg leading-relaxed max-w-xl mb-7">
                  Reliable house moving service across London. Fast, careful
                  and simple from start to finish.
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
                  {["Fully insured", "No hidden fees", "Fast response"].map(
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
                      Enter both addresses — we'll carry them straight into
                      the booking flow.
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
            TRUST STRIP — compact 4.9 rating + tagline directly under hero
            ============================================================ */}
        <section
          aria-label="Customer rating and trust signals"
          className="border-y border-purple-100/70 bg-gradient-to-b from-white to-[#faf8fd]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-[13.5px] sm:text-sm">
                  <span className="font-semibold text-gray-900">4.9</span>
                  <span className="text-gray-500">
                    {" "}— trusted by customers across London
                  </span>
                </p>
              </div>
              <p className="text-[12.5px] sm:text-[13px] text-gray-500">
                Same-day moves · Professional team · Transparent pricing
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS — 3 simple numbered steps
            ============================================================ */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-9 sm:mb-12">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
                HOW IT WORKS
              </p>
              <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight">
                How it works
              </h2>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  n: 1,
                  title: "Enter your addresses",
                  text: "Tell us where you're moving from and to.",
                },
                {
                  n: 2,
                  title: "Get your quote",
                  text: "See your van size, help and hourly rate.",
                },
                {
                  n: 3,
                  title: "We handle your move",
                  text: "Our team arrives on time and takes care of it.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="relative bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.06),_0_18px_40px_-22px_rgba(74,49,156,0.16)]"
                >
                  <div
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-[16px] mb-4 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                    }}
                    aria-hidden="true"
                  >
                    {s.n}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[15px] sm:text-[16px] tracking-tight mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-[13px] sm:text-[13.5px] leading-relaxed">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================================
            WHAT WE HANDLE — 4 clean light cards (no packing)
            ============================================================ */}
        <section className="py-14 sm:py-20 bg-[#faf8fd]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-9 sm:mb-12">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
                WHAT WE HANDLE FOR YOU
              </p>
              <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight">
                Everything handled — so you don't have to
              </h2>
            </div>

            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {handled.map(({ icon: Icon, title, text }) => (
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
            WHY CHOOSE MOVE4U — split layout: photo left, points right
            ============================================================ */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* IMAGE */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-5 -z-10 rounded-[2rem] blur-2xl opacity-50"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 40%, rgba(74,49,156,0.30), transparent 70%)",
                    }}
                  />
                  <div className="relative rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_30px_70px_-30px_rgba(74,49,156,0.45)]">
                    <img
                      src={teamImg}
                      alt="Move4U removals team loading the van during a real London house move"
                      className="w-full h-[300px] sm:h-[420px] object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Floating rating badge */}
                  <div className="absolute -bottom-4 left-5 sm:left-6 bg-white rounded-2xl px-4 py-3 shadow-[0_18px_40px_-18px_rgba(17,12,46,0.25)] ring-1 ring-gray-100 flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <div className="text-[12px] leading-tight">
                      <p className="font-semibold text-gray-900">4.9 / 5</p>
                      <p className="text-gray-500">Real London moves</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* COPY */}
              <div className="lg:col-span-6 order-1 lg:order-2">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
                  WHY CHOOSE MOVE4U
                </p>
                <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-5">
                  Why customers choose Move4U
                </h2>
                <p className="text-gray-500 text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-md">
                  A small, dedicated London team focused on doing your move
                  properly — not a faceless platform.
                </p>
                <ul className="space-y-3">
                  {whyPoints.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-gray-800 text-[14.5px] sm:text-[15px]"
                    >
                      <span className="mt-0.5 inline-flex w-6 h-6 rounded-full bg-purple-100 text-purple-700 items-center justify-center shrink-0">
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            PRICING PREVIEW — simple, transparent (Most popular badge)
            ============================================================ */}
        <section className="py-14 sm:py-20 bg-[#faf8fd]">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 items-stretch">
              {vans.map((v) => (
                <div
                  key={v.id}
                  className={`relative bg-white rounded-2xl p-5 ring-1 text-center transition-all ${
                    v.popular
                      ? "ring-purple-300 shadow-[0_10px_24px_-10px_rgba(74,49,156,0.25),_0_30px_60px_-22px_rgba(74,49,156,0.35)] sm:-translate-y-1"
                      : "ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)]"
                  }`}
                >
                  {v.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-purple-700 text-white text-[10.5px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-[0_8px_18px_-8px_rgba(74,49,156,0.6)]">
                      <Star
                        className="w-3 h-3 fill-white"
                        strokeWidth={2.5}
                      />
                      Most popular
                    </span>
                  )}
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
            <div className="bg-white rounded-2xl ring-1 ring-purple-100/60 p-4 sm:p-5 mb-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#faf8fd] ring-1 ring-purple-100 flex items-center justify-center shrink-0">
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
                  <div className="w-8 h-8 rounded-lg bg-[#faf8fd] ring-1 ring-purple-100 flex items-center justify-center shrink-0">
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
                      from +£{driverPlusHelperFromDelta}/hr — extra hands for
                      bigger moves
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
            REVIEWS — light & clean, just two cards + Google CTA
            ============================================================ */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-9 sm:mb-12">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
                REVIEWS
              </p>
              <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight">
                What our customers say
              </h2>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {featuredReviews.map((r) => (
                <li
                  key={r.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)]"
                  data-testid={`featured-review-${r.id}`}
                >
                  <Quote
                    className="w-6 h-6 text-purple-200 mb-2.5"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200 fill-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <blockquote className="text-gray-800 text-[14.5px] sm:text-[15px] leading-[1.6] mb-5">
                    &ldquo;{r.text}&rdquo;
                  </blockquote>
                  <footer className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[13px] ring-1 ring-purple-200/40 shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-[13.5px] leading-tight truncate">
                        {r.name}
                      </p>
                      <p className="text-gray-400 text-[12px] mt-0.5 truncate">
                        {r.location}
                      </p>
                    </div>
                  </footer>
                </li>
              ))}
            </ul>

            <div className="text-center">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-800 font-semibold px-6 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px]"
                data-testid="see-all-google-reviews"
              >
                See all reviews on Google
                <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA — purple background + trust line
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
              Ready to move without stress?
            </h2>
            <p className="text-purple-100/90 text-[14.5px] sm:text-base leading-relaxed max-w-xl mx-auto mb-7">
              Get your quote in seconds and book your move today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-7">
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

            {/* Trust line */}
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] sm:text-[13px] text-purple-100/95">
              {[
                { icon: ShieldCheck, label: "No hidden fees" },
                { icon: Clock, label: "Fast response" },
                { icon: MapPin, label: "Trusted across London" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon
                    className="w-3.5 h-3.5 text-emerald-300"
                    strokeWidth={2.5}
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
