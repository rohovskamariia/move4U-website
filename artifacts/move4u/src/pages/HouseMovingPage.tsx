import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { CONTACT, HELP_PRICING, VAN_SIZES } from "@/data/constants";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  HandHelping,
  Phone,
  Quote,
  Sofa,
  Star,
  Truck,
} from "lucide-react";
import heroImg from "@/assets/hero/move4u_hero_v3.webp";
import teamImg from "@/assets/reviews/move4u_real_move.webp";
import vanSmallImg from "@/assets/vans/van_small.webp";
import vanMediumImg from "@/assets/vans/van_medium.webp";
import vanLargeImg from "@/assets/vans/van_large.webp";

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
  // One real van photo per size — small panel van / medium Sprinter /
  // large Luton box. Mapped by id so the JSX stays declarative and a
  // wrong photo can never be paired with the wrong van label.
  const vanImages: Record<string, string> = {
    small: vanSmallImg,
    medium: vanMediumImg,
    large: vanLargeImg,
  };
  const vans = VAN_SIZES.map((v) => ({
    id: v.id,
    name: v.name,
    price: `£${HELP_PRICING[v.id]?.noHelp ?? v.basePrice}`,
    note: vanNotes[v.id] ?? v.description,
    image: vanImages[v.id] ?? vanSmallImg,
  }));

  // Driver-help delta is uniform across van sizes (driverHelp - noHelp).
  const driverHelpDelta =
    HELP_PRICING.small.driverHelp - HELP_PRICING.small.noHelp;
  // Driver+helper deltas vary by van size — show the lowest as the "from".
  const driverPlusHelperFromDelta = Math.min(
    ...Object.values(HELP_PRICING).map((p) => p.driverPlusHelper - p.noHelp),
  );

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
              loading="eager"
              fetchPriority="high"
              decoding="async"
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

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 lg:pt-20 pb-10 lg:pb-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* LEFT — full marketing copy. Hidden on mobile/tablet to
                  keep the hero focused on the conversion form (per
                  mobile redesign brief). Re-appears at lg+. */}
              <div className="hidden lg:block lg:col-span-7 text-white">
                <p className="text-[12px] font-semibold tracking-[0.22em] text-purple-200 mb-3">
                  HOUSE MOVING SERVICE
                </p>
                <h1 className="text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.05] mb-4">
                  Move without stress — we handle everything
                </h1>
                <p className="text-purple-50/90 text-lg leading-relaxed max-w-xl mb-7">
                  Reliable house moving service across London. Fast, careful
                  and simple from start to finish.
                </p>

                <div className="flex flex-row gap-3 mb-6">
                  <button
                    onClick={() => setLocation("/book")}
                    className="bg-white text-purple-900 font-semibold px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-[15px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]"
                    data-testid="hero-get-quote"
                  >
                    Get a Quote
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => setLocation("/book/house-move")}
                    className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full text-[15px]"
                    data-testid="hero-book-now"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                </div>

                {/* Trust line */}
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-purple-100/95">
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

              {/* MOBILE-only eyebrow above the form. Centered for visual
                  balance on the smaller layout. */}
              <p className="lg:hidden text-center text-[11px] font-semibold tracking-[0.22em] text-purple-200 -mb-2">
                HOUSE MOVING SERVICE
              </p>

              {/* RIGHT — quick quote card. On mobile this is the only
                  thing in the hero (with the eyebrow above) so we make
                  it more compact and centered with a tight max width. */}
              <div className="lg:col-span-5 mx-auto w-full max-w-sm lg:max-w-none">
                <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-[0_30px_70px_-20px_rgba(20,12,46,0.55)] ring-1 ring-white/30">
                  <div className="mb-3 lg:mb-4">
                    <p className="text-[10.5px] font-semibold tracking-[0.2em] text-purple-700 mb-1">
                      QUICK QUOTE
                    </p>
                    <h2 className="text-[18px] lg:text-[22px] font-bold text-gray-900 tracking-tight">
                      Get your quick quote
                    </h2>
                    {/* Helper subtitle — desktop only; mobile keeps it
                        ultra compact. */}
                    <p className="hidden lg:block text-gray-500 text-[12.5px] mt-1">
                      Enter both addresses — we'll carry them straight into
                      the booking flow.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onQuickQuote();
                    }}
                    className="space-y-2.5 lg:space-y-3"
                  >
                    <div>
                      <label
                        htmlFor="quick-pickup"
                        className="block text-[12px] font-semibold text-gray-700 mb-1"
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
                        className="block text-[12px] font-semibold text-gray-700 mb-1"
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
                      className="btn-purple w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-2.5 lg:py-3 rounded-full text-[14px] mt-1"
                      data-testid="quick-quote-submit"
                    >
                      {/* "Check price" on mobile, "Get Quote" on desktop —
                          same submit handler so the booking flow contract
                          is unchanged. */}
                      <span className="lg:hidden">Check price</span>
                      <span className="hidden lg:inline">Get Quote</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                    </button>
                    <p className="hidden lg:block text-[11.5px] text-gray-400 text-center pt-1">
                      No payment required to get a quote.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            TRUST STRIP — single, simple horizontal row under the hero
            ============================================================ */}
        <section
          aria-label="Trust signals"
          className="border-y border-purple-100/70 bg-gradient-to-b from-white to-[#faf8fd]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-2 text-[12.5px] sm:text-[13.5px] text-gray-600">
              {["No hidden fees", "Fast response", "Trusted across London"].map(
                (t, i) => (
                  <li key={t} className="flex items-center gap-2">
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 -ml-3 sm:-ml-5"
                      />
                    )}
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-purple-700 shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="font-medium text-gray-700">{t}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS — 3 simple numbered steps.
            Mobile: ultra-compact vertical 1-2-3 list with a thin
            connecting rail (per redesign brief — no oversized cards).
            Desktop: original 3-card grid, untouched.
            ============================================================ */}
        <section className="py-7 sm:py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-4 sm:mb-8">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2">
                HOW IT WORKS
              </p>
              <h2 className="text-[20px] sm:text-[28px] font-bold text-gray-900 tracking-tight">
                How it works
              </h2>
            </div>

            {(() => {
              const steps = [
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
              ];
              return (
                <>
                  {/* MOBILE: thin vertical rail with small numbered
                      circles + short titles. No card chrome. */}
                  <ol
                    className="sm:hidden relative pl-9 space-y-3"
                    aria-label="How it works"
                  >
                    {/* Vertical connecting line behind the circles. */}
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-2 bottom-2 w-px bg-purple-200"
                    />
                    {steps.map((s) => (
                      <li key={s.n} className="relative">
                        <div
                          className="absolute -left-9 top-0.5 w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[12px] shadow-[0_4px_10px_-3px_rgba(74,49,156,0.5)]"
                          style={{
                            backgroundImage:
                              "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                          }}
                          aria-hidden="true"
                        >
                          {s.n}
                        </div>
                        <p className="font-semibold text-gray-900 text-[14px] leading-tight">
                          {s.title}
                        </p>
                        <p className="text-gray-500 text-[12.5px] leading-snug mt-0.5">
                          {s.text}
                        </p>
                      </li>
                    ))}
                  </ol>

                  {/* DESKTOP: original 3-card grid. */}
                  <ol className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
                    {steps.map((s) => (
                      <li
                        key={s.n}
                        className="relative bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.06),_0_18px_40px_-22px_rgba(74,49,156,0.16)]"
                      >
                        <div
                          className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-[14px] mb-3 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                          style={{
                            backgroundImage:
                              "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                          }}
                          aria-hidden="true"
                        >
                          {s.n}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-[14.5px] tracking-tight mb-1">
                          {s.title}
                        </h3>
                        <p className="text-gray-500 text-[13px] leading-relaxed">
                          {s.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              );
            })()}
          </div>
        </section>

        {/* ============================================================
            WHAT WE HANDLE — 4 clean light cards (no packing).
            Mobile: tightened padding/icon/text so the 2-col grid feels
            light, not stretched. Desktop: untouched.
            ============================================================ */}
        <section className="py-8 sm:py-14 bg-[#faf8fd]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-5 sm:mb-8">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2">
                WHAT WE HANDLE FOR YOU
              </p>
              <h2 className="text-[19px] sm:text-[28px] font-bold text-gray-900 tracking-tight leading-snug">
                Everything handled — so you don't have to
              </h2>
            </div>

            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {handled.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)] transition-all sm:hover:-translate-y-0.5 sm:hover:shadow-[0_8px_18px_-6px_rgba(74,49,156,0.12),_0_24px_48px_-22px_rgba(74,49,156,0.28)]"
                >
                  <div
                    className="text-white w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-2.5 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      strokeWidth={2.25}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[13px] sm:text-[14px] tracking-tight leading-tight mb-0.5">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-[11.5px] sm:text-[12.5px] leading-snug sm:leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================
            WHY CHOOSE MOVE4U — split layout: photo left, points right.
            Reviews are merged inline (small testimonial card under the
            bullet list) — no separate reviews section.
            Mobile: tighter vertical rhythm + smaller image.
            ============================================================ */}
        <section className="py-9 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
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
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_30px_70px_-30px_rgba(74,49,156,0.45)]">
                    <img
                      src={teamImg}
                      alt="Move4U removals team loading the van during a real London house move"
                      className="w-full h-[220px] sm:h-[420px] object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Floating rating badge */}
                  <div className="absolute -bottom-4 left-4 sm:left-6 bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-[0_18px_40px_-18px_rgba(17,12,46,0.25)] ring-1 ring-gray-100 flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <div className="text-[11px] sm:text-[12px] leading-tight">
                      <p className="font-semibold text-gray-900">4.9 / 5</p>
                      <p className="text-gray-500">Real London moves</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* COPY */}
              <div className="lg:col-span-6 order-1 lg:order-2">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2.5">
                  WHY CHOOSE MOVE4U
                </p>
                <h2 className="text-[20px] sm:text-4xl font-bold text-gray-900 tracking-tight leading-snug mb-2 sm:mb-5">
                  Why customers choose Move4U
                </h2>
                <p className="text-gray-500 text-[13px] sm:text-[15px] leading-relaxed mb-4 sm:mb-6 max-w-md">
                  A small, dedicated London team focused on doing your move
                  properly — not a faceless platform.
                </p>
                <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-7">
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

                {/* Small inline review preview — keeps social proof in the
                    same 2-column block instead of needing a full carousel
                    section below. */}
                <div className="bg-[#faf8fd] rounded-2xl p-4 sm:p-5 ring-1 ring-purple-100/70 max-w-md">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Quote
                      className="w-4 h-4 text-purple-300 shrink-0"
                      fill="currentColor"
                      aria-hidden="true"
                    />
                    <div
                      className="flex items-center gap-0.5"
                      aria-label="5 out of 5 stars"
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-800 text-[13.5px] sm:text-[14px] leading-relaxed mb-2">
                    &ldquo;Professional, careful and easy to book.&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[12px] text-gray-500">
                      — London customer
                    </p>
                    <a
                      href={googleReviewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12.5px] font-medium text-purple-700 hover:text-purple-800 underline underline-offset-2"
                      data-testid="see-all-google-reviews"
                    >
                      See all reviews on Google
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            PRICING PREVIEW — premium centered brand block.
            The outer section is plain white so the deep-purple gradient
            block reads as a self-contained "card" with breathing room
            on its left and right. White pricing cards inside contrast
            cleanly against the brand purple.
            ============================================================ */}
        <section
          className="relative bg-white py-9 sm:py-16"
          aria-label="Pricing"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Inner brand-purple block — narrower than the section, with
                generous internal padding and a soft outer shadow so it
                feels like a premium centered card, not full-width.
                Mobile uses tighter padding to keep the block compact. */}
            <div
              className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl px-3.5 sm:px-10 py-7 sm:py-12 shadow-[0_30px_70px_-30px_rgba(61,18,137,0.55)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #2a0a5e 0%, #3D1289 45%, #5b2ba8 100%)",
              }}
            >
              {/* Subtle accent glows for premium depth */}
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-purple-400/25 blur-3xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none"
              />

              <div className="relative">
                <div className="text-center mb-5 sm:mb-8">
                  <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-200 mb-1.5 sm:mb-2">
                    PRICING
                  </p>
                  <h2 className="text-[18px] sm:text-[28px] font-bold text-white tracking-tight mb-1.5 sm:mb-2">
                    Simple, transparent pricing
                  </h2>
                  <p className="text-purple-100/85 text-[12.5px] sm:text-[14.5px] max-w-xl mx-auto leading-snug sm:leading-relaxed">
                    Pay by the hour. No hidden fees, no surprises.
                  </p>
                </div>

                {/* Van rates — white cards. Mobile keeps all 3 in one
                    row (per redesign brief) with very tight padding +
                    smaller van photos so each card stays readable on a
                    narrow viewport. Desktop layout untouched. */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-4 items-stretch">
                  {vans.map((v) => (
                    <div
                      key={v.id}
                      className="relative bg-white rounded-xl sm:rounded-2xl p-2 sm:p-5 ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] text-center transition-all sm:hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-center h-10 sm:h-20 mb-1.5 sm:mb-2.5">
                        <img
                          src={v.image}
                          alt={`${v.name} — Move4U ${v.id} van`}
                          className="max-h-full max-w-full object-contain select-none"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      </div>
                      <p className="text-[9.5px] sm:text-[11.5px] font-semibold tracking-wide text-purple-700 mb-0.5 sm:mb-1 uppercase leading-tight">
                        {v.name}
                      </p>
                      <p className="hidden sm:block text-gray-400 text-[11px] mb-1.5">
                        from
                      </p>
                      <p className="text-[16px] sm:text-[28px] font-bold text-gray-900 tracking-tight leading-none">
                        {v.price}
                        <span className="text-gray-400 text-[10px] sm:text-[14px] font-medium">
                          /hr
                        </span>
                      </p>
                      <p className="hidden sm:block text-gray-500 text-[12px] mt-1.5">
                        {v.note}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Help options + minimum note — translucent strip that
                    sits naturally on the deep purple panel. Mobile shows
                    the two help options + min booking stacked compactly. */}
                <ul className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl ring-1 ring-white/20 p-2.5 sm:p-4 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3 text-center sm:text-left">
                  <li className="flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
                    <HandHelping
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="text-purple-100/90">
                      <span className="font-semibold text-white">
                        Driver help
                      </span>{" "}
                      +£{driverHelpDelta}/hr
                    </span>
                  </li>
                  <li className="flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 text-[12px] sm:text-[13px]">
                    <HandHelping
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="text-purple-100/90">
                      <span className="font-semibold text-white">
                        Driver + helper
                      </span>{" "}
                      +£{driverPlusHelperFromDelta}/hr
                    </span>
                  </li>
                  <li className="flex items-center justify-center sm:justify-end gap-2.5 text-[11.5px] sm:text-[12.5px] text-purple-100/80">
                    Minimum booking: 2 hours
                  </li>
                </ul>

                {/* CTA pair — Book now is the clear primary (large, white
                    pill with purple text + strong shadow), Call us is the
                    secondary (smaller, ghost outline). */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-stretch sm:items-center">
                  <button
                    onClick={() => setLocation("/book/house-move")}
                    className="bg-white text-purple-900 hover:bg-purple-50 hover:-translate-y-0.5 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[14.5px] sm:text-[16px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-white/40"
                    data-testid="pricing-book-now"
                  >
                    Book now
                    <ArrowRight
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      strokeWidth={2.5}
                    />
                  </button>
                  {/* "Call us" — tel: link for native click-to-call on mobile. */}
                  <a
                    href={`tel:${CONTACT.driver}`}
                    className="bg-transparent text-white ring-1 ring-white/50 hover:bg-white/10 hover:ring-white/80 font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full inline-flex items-center justify-center gap-2 transition-all text-[13px] sm:text-[14px]"
                    data-testid="pricing-call-us"
                    aria-label={`Call us on ${CONTACT.driverDisplay}`}
                  >
                    <Phone className="w-4 h-4" strokeWidth={2.25} />
                    Call us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
