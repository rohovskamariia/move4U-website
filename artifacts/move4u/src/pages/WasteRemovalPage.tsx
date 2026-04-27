import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { CONTACT, WASTE_LOADS } from "@/data/constants";
import {
  ArrowRight,
  BadgePoundSterling,
  Briefcase,
  CheckCircle2,
  Hammer,
  Phone,
  Quote,
  Recycle,
  Refrigerator,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
  Trash2,
  TreePine,
  Truck,
  Zap,
} from "lucide-react";

// Hero photo — homepage slide 1 (movers carrying boxes/rug by the van).
// Distinct from /house-moving's interior hero, and reads naturally as a
// "we collect & remove" visual for the waste service.
import heroImg from "@assets/IMG_3267_1776604323710.webp";

// Real load illustrations from the waste size guide — single source of
// truth for waste imagery so the pricing block here matches /waste-guide.
import minLoadImg from "@assets/IMG_3575_1776610167208.webp";
import quarterLoadImg from "@assets/IMG_3576_1776610167208.webp";
import thirdLoadImg from "@assets/IMG_3577_1776610167208.webp";
import halfLoadImg from "@assets/IMG_3578_1776610167208.webp";
import threeQuarterLoadImg from "@assets/IMG_3579_1776610167209.webp";
import fullLoadImg from "@assets/IMG_3580_1776610167209.webp";

const LOAD_IMAGES: Record<string, string> = {
  minimum: minLoadImg,
  quarter: quarterLoadImg,
  third: thirdLoadImg,
  half: halfLoadImg,
  three_quarter: threeQuarterLoadImg,
  full: fullLoadImg,
  extra_large: fullLoadImg,
};

/**
 * /waste-removal — premium SEO + conversion landing page.
 *
 * Mirrors the structure and visual quality of /house-moving but tailored
 * to waste / rubbish clearance. The hero quick-quote captures only the
 * COLLECTION address (waste removal has no drop-off) and hands it to
 * the existing booking flow at /book/waste-removal via ?pickup=...
 *
 * Pricing is read directly from WASTE_LOADS (single source of truth).
 */
export default function WasteRemovalPage() {
  usePageMeta({
    title: "Waste Removal London | Same-Day Rubbish Clearance | Move4U",
    description:
      "Fast, reliable waste removal across London by Move4U. Licensed waste carriers, same-day collection, transparent pricing. Get a quote online.",
    path: "/waste-removal",
  });
  const [, setLocation] = useLocation();
  const [pickup, setPickup] = useState("");

  /**
   * Hand off the typed collection address to /book/waste-removal via the
   * ?pickup=... query param. BookingPage reads it once on mount and seeds
   * WasteRemovalFlow's pickup state through its `initialPickup` prop, so
   * the user never re-enters the same address.
   */
  const onQuickQuote = () => {
    const params = new URLSearchParams();
    const p = pickup.trim();
    if (p) params.set("pickup", p);
    const qs = params.toString();
    setLocation(qs ? `/book/waste-removal?${qs}` : "/book/waste-removal");
  };

  /* ---------- Section data ---------- */

  // What we handle — 7 categories. Last card ("Almost anything") gets
  // emphasis by spanning the trailing row on every breakpoint so it
  // reads as a soft "ask us" CTA.
  const handled = [
    { icon: Trash2, title: "Household waste", text: "Bags, boxes and general rubbish." },
    { icon: Sofa, title: "Furniture removal", text: "Sofas, beds, wardrobes, tables." },
    { icon: TreePine, title: "Garden waste", text: "Soil, branches and clippings." },
    { icon: Refrigerator, title: "Appliances", text: "Fridges, washers, white goods." },
    { icon: Briefcase, title: "Office clearance", text: "Desks, chairs and IT equipment." },
    { icon: Hammer, title: "Builders waste", text: "Rubble, plasterboard, offcuts." },
    { icon: Sparkles, title: "Almost anything — just ask", text: "Not sure? Send a photo and we'll quote." },
  ];

  const whyFeatures = [
    { icon: ShieldCheck, title: "Licensed waste carriers" },
    { icon: Truck, title: "We do the heavy lifting" },
    { icon: BadgePoundSterling, title: "Clear pricing" },
    { icon: Zap, title: "Same-day availability" },
  ];

  const steps = [
    {
      n: 1,
      title: "Enter your address",
      text: "Tell us where the collection is and what needs to go.",
      icon: Recycle,
    },
    {
      n: 2,
      title: "Get a fixed quote",
      text: "We estimate based on size and type of waste — no surprises.",
      icon: BadgePoundSterling,
    },
    {
      n: 3,
      title: "We collect and remove",
      text: "Our team arrives, loads everything and clears the space.",
      icon: Truck,
    },
  ];

  // Page-local annotations for each load size — keeps the pricing cards
  // scannable. Numeric prices stay sourced from WASTE_LOADS.
  const loadNotes: Record<string, string> = {
    minimum: "~8 bin bags · up to 150kg",
    quarter: "~20 bin bags · up to 250kg",
    third: "~30 bin bags · up to 300kg",
    half: "~40 bin bags · up to 500kg",
    three_quarter: "~60 bin bags · up to 650kg",
    full: "Full van · up to 1000kg",
    extra_large: "On request · up to 2000kg",
  };

  // Placeholder Google reviews link — defaults to a Google search for the
  // brand until a real Google Business profile URL is wired in.
  const googleReviewsUrl =
    "https://www.google.com/search?q=Move4U+London+removals+reviews";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* ============================================================
            HERO — clean photo + very light overlay so the image stays
            natural while keeping white copy legible.
            Left column: title, subtitle, CTAs, trust line.
            Right column: collection-address-only quick quote card.
            ============================================================ */}
        <section className="relative overflow-hidden isolate">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImg}
              alt="Move4U team loading items into the van during a London waste collection"
              className="house-hero-img w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {/* Very light overlay — soft diagonal so the photo still reads
                as natural and bright while the white headline copy stays
                comfortably legible. Stronger on the left where the text
                sits, fading to almost nothing on the right behind the
                white quick-quote card. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, rgba(20,12,46,0.42) 0%, rgba(20,12,46,0.26) 55%, rgba(20,12,46,0.12) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-7 lg:pt-20 pb-7 lg:pb-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* LEFT — full marketing copy. Hidden on mobile/tablet to
                  keep the hero focused on the conversion form. The light
                  overlay above + a soft text-shadow keep the white copy
                  comfortably readable on the photo. */}
              <div
                className="hidden lg:block lg:col-span-7 text-white"
                style={{
                  textShadow:
                    "0 2px 12px rgba(15,10,40,0.55), 0 1px 2px rgba(15,10,40,0.45)",
                }}
              >
                <p className="text-[12px] font-semibold tracking-[0.22em] text-purple-200 mb-3">
                  WASTE REMOVAL SERVICE
                </p>
                <h1 className="text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.05] mb-4">
                  Waste Removal Service
                </h1>
                <p className="text-purple-50/90 text-lg leading-relaxed max-w-xl mb-7">
                  Fast, reliable rubbish removal across London — same-day
                  collection available.
                </p>

                <div className="flex flex-row gap-3 mb-6">
                  <button
                    onClick={() => setLocation("/book/waste-removal")}
                    className="bg-white text-purple-900 font-semibold px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-[15px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]"
                    data-testid="hero-get-quote"
                  >
                    Get a Quote
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() => setLocation("/book/waste-removal")}
                    className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full text-[15px]"
                    data-testid="hero-book-now"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                </div>

                {/* Trust line */}
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-purple-100/95">
                  {[
                    "Licensed waste carriers",
                    "Same-day available",
                    "No hidden fees",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-300 shrink-0"
                        strokeWidth={2.5}
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MOBILE-only eyebrow above the form. Centered and softly
                  shadowed so it stays legible over the photo. */}
              <p
                className="lg:hidden text-center text-[11px] font-semibold tracking-[0.22em] text-white -mb-2"
                style={{
                  textShadow:
                    "0 2px 10px rgba(15,10,40,0.55), 0 1px 2px rgba(15,10,40,0.45)",
                }}
              >
                WASTE REMOVAL SERVICE
              </p>

              {/* RIGHT — quick quote card. Slightly narrower than the
                  House Moving card (max-w-[380px] vs none on desktop)
                  per the brief. Single field — collection address only. */}
              <div className="lg:col-span-5 mx-auto w-full max-w-[340px] lg:max-w-[380px] px-2 lg:px-0 lg:ml-auto">
                <div className="quick-quote-mobile bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-[0_30px_70px_-20px_rgba(20,12,46,0.55)] ring-1 ring-white/30">
                  <div className="mb-3 lg:mb-4">
                    <p className="text-[10px] lg:text-[10.5px] font-semibold tracking-[0.2em] text-purple-700 mb-1 lg:mb-1">
                      QUICK QUOTE
                    </p>
                    <h2 className="text-[16.5px] lg:text-[22px] font-bold text-gray-900 tracking-tight leading-tight">
                      Get your quick quote
                    </h2>
                    <p className="hidden lg:block text-gray-500 text-[12.5px] mt-1">
                      Tell us the collection address — we'll seed it
                      straight into the booking flow.
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
                        className="block text-[10.5px] lg:text-[12px] font-semibold text-gray-700 mb-1 lg:mb-1 uppercase tracking-wide lg:normal-case lg:tracking-normal"
                      >
                        Collection address
                      </label>
                      <AddressAutocomplete
                        id="quick-pickup"
                        value={pickup}
                        onChange={(v) => setPickup(v)}
                        placeholder="Address or postcode"
                        testId="quick-quote-pickup"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-purple w-full inline-flex items-center justify-center gap-2 font-semibold py-2.5 lg:py-3 rounded-full text-[14px] lg:text-[15px] mt-1 lg:mt-2"
                      data-testid="quick-quote-submit"
                    >
                      Get Quote
                      <ArrowRight
                        className="w-4 h-4"
                        strokeWidth={2.25}
                      />
                    </button>

                    <p className="hidden lg:block text-center text-[11.5px] text-gray-400 mt-1">
                      Instant estimate in seconds
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            TRUST STRIP — small reassurance row that ties the hero into
            the rest of the page without a hard section break.
            ============================================================ */}
        <section className="bg-white border-b border-purple-50/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] sm:text-[13.5px] text-gray-600">
              {[
                { icon: ShieldCheck, label: "Licensed waste carriers" },
                { icon: Zap, label: "Same-day collection" },
                { icon: BadgePoundSterling, label: "Transparent pricing" },
                { icon: Recycle, label: "Responsibly recycled" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon
                    className="w-4 h-4 text-purple-700 shrink-0"
                    strokeWidth={2.25}
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS — clean editorial timeline.
            Mobile: vertical rail with numbered chips on the left.
            Desktop: horizontal row with dashed connectors.
            Minimal, not big cards — per brief.
            ============================================================ */}
        <section
          id="waste-how-it-works"
          className="py-10 sm:py-16 bg-white"
          aria-label="How it works"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-7 sm:mb-12">
              <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
                HOW IT WORKS
              </p>
              <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
                Three simple steps
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-[13px] sm:text-base leading-relaxed">
                From your address to a clear space — quick, transparent,
                stress-free.
              </p>
            </div>

            {/* MOBILE: vertical timeline with a continuous left rail.
                Compact and scannable — no large cards. */}
            <ol className="sm:hidden relative pl-10">
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200"
              />
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <li
                    key={s.n}
                    className="relative pb-5 last:pb-0"
                    data-testid={`waste-step-${s.n}`}
                  >
                    <span
                      className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-white ring-2 ring-purple-200 shadow-[0_4px_10px_-4px_rgba(74,49,156,0.35)] flex items-center justify-center text-purple-700 font-bold text-[12.5px]"
                      aria-hidden="true"
                    >
                      {s.n}
                    </span>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className="w-4 h-4 text-purple-600"
                        strokeWidth={2.25}
                      />
                      <h3 className="font-semibold text-gray-900 text-[14.5px] tracking-tight">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-[13px] leading-relaxed">
                      {s.text}
                    </p>
                  </li>
                );
              })}
            </ol>

            {/* DESKTOP: horizontal row with dashed connectors between
                numbered chips. Minimal, not card-heavy. */}
            <ol className="hidden sm:grid sm:grid-cols-3 gap-6 lg:gap-10 relative">
              <span
                aria-hidden="true"
                className="absolute top-[27px] left-[16.6%] right-[16.6%] border-t-2 border-dashed border-purple-200"
              />
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <li
                    key={s.n}
                    className="relative text-center px-2"
                    data-testid={`waste-step-${s.n}`}
                  >
                    <div className="relative z-10 mx-auto w-[54px] h-[54px] rounded-full bg-white ring-2 ring-purple-200 shadow-[0_8px_22px_-8px_rgba(74,49,156,0.45)] flex items-center justify-center mb-4">
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center shadow-[0_3px_8px_-2px_rgba(74,49,156,0.55)]">
                        {s.n}
                      </span>
                      <Icon
                        className="w-6 h-6 text-purple-700"
                        strokeWidth={2.25}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-[15.5px] tracking-tight mb-1">
                      {s.title}
                    </h3>
                    <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-[260px] mx-auto">
                      {s.text}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ============================================================
            WHAT WE HANDLE — 2-col mobile / 3-col tablet / 4-col desktop.
            Last card ("Almost anything") spans the trailing row to read
            as a soft "ask us" CTA.
            ============================================================ */}
        <section
          className="py-9 sm:py-14 bg-[#faf8fd]"
          aria-label="What we handle"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-10">
              <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
                WHAT WE TAKE
              </p>
              <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
                What we handle for you
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-[13px] sm:text-base leading-relaxed">
                From a few bags to a full clearance — we handle almost
                anything across London.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {handled.map(({ icon: Icon, title, text }, i) => {
                const isLast = i === handled.length - 1;
                return (
                  <div
                    key={title}
                    className={[
                      "bg-white rounded-2xl ring-1 ring-purple-100/70 p-3.5 sm:p-5 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(74,49,156,0.18),_0_30px_60px_-24px_rgba(74,49,156,0.30)]",
                      isLast ? "col-span-2 sm:col-span-3 lg:col-span-4" : "",
                    ].join(" ")}
                    data-testid={`waste-handle-${i}`}
                  >
                    <div
                      className={[
                        "flex",
                        isLast
                          ? "flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-center"
                          : "flex-col gap-2",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "text-white rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]",
                          isLast
                            ? "w-10 h-10 sm:w-11 sm:h-11 mx-auto sm:mx-0"
                            : "w-10 h-10",
                        ].join(" ")}
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                        }}
                      >
                        <Icon
                          className="w-[18px] h-[18px]"
                          strokeWidth={2.25}
                        />
                      </div>
                      <div
                        className={
                          isLast ? "sm:text-left" : ""
                        }
                      >
                        <h3 className="font-semibold text-gray-900 text-[13.5px] sm:text-[14.5px] tracking-tight leading-tight mb-0.5 sm:mb-1">
                          {title}
                        </h3>
                        <p className="text-gray-500 text-[12px] sm:text-[13px] leading-relaxed">
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================
            WHY MOVE4U — feature pills + integrated review block.
            Mirrors the /house-moving "Why" section visually so both
            service pages feel like one product family.
            ============================================================ */}
        <section
          className="py-10 sm:py-16 bg-white"
          aria-label="Why choose Move4U"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-10">
              <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
                WHY MOVE4U
              </p>
              <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
                Simple, stress-free clearance
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-[13px] sm:text-base leading-relaxed">
                We make waste removal easy — licensed carriers, fair
                pricing and friendly teams across London.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-7 sm:mb-10">
              {whyFeatures.map(({ icon: Icon, title }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl ring-1 ring-purple-100/70 p-3.5 sm:p-5 flex items-center gap-3 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08)]"
                  data-testid={`waste-why-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                >
                  <div
                    className="text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                    }}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={2.25}
                    />
                  </div>
                  <p className="font-semibold text-gray-900 text-[13px] sm:text-[14px] tracking-tight leading-tight">
                    {title}
                  </p>
                </div>
              ))}
            </div>

            {/* Review card — single hero quote with stars + Google CTA. */}
            <div className="max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl ring-1 ring-purple-100/80 p-5 sm:p-8 shadow-[0_6px_18px_-8px_rgba(74,49,156,0.12),_0_30px_60px_-24px_rgba(74,49,156,0.22)] text-center">
              <Quote
                className="w-7 h-7 sm:w-8 sm:h-8 text-purple-300 mx-auto mb-2 sm:mb-3"
                strokeWidth={2}
              />
              <div
                className="flex justify-center gap-0.5 mb-3 sm:mb-4"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-700 text-[14px] sm:text-[16px] leading-relaxed mb-3 sm:mb-4 italic">
                "Booked a same-day clearance after a flat refurb — the
                Move4U team turned up on time, loaded everything quickly
                and the price matched the quote exactly. Genuinely
                stress-free."
              </p>
              <p className="text-gray-500 text-[12.5px] sm:text-[13.5px] mb-4 sm:mb-5">
                — Daniel R., Camden
              </p>
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 font-semibold text-[13px] sm:text-[14px]"
                data-testid="see-google-reviews"
              >
                See all reviews on Google
                <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            PRICING PREVIEW — premium centered brand block.
            Same purple gradient card pattern as /house-moving.
            Inside: 7 white load cards in a responsive grid using the
            real load illustrations from the waste size guide.
            ============================================================ */}
        <section
          className="relative bg-white py-6 sm:py-16"
          aria-label="Waste removal pricing"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div
              className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl px-3.5 sm:px-10 py-7 sm:py-12 shadow-[0_30px_70px_-30px_rgba(61,18,137,0.55)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #2a0a5e 0%, #3D1289 45%, #5b2ba8 100%)",
              }}
            >
              {/* Subtle accent glows for depth */}
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
                    Pay by the load — no hidden fees
                  </h2>
                  <p className="text-purple-100/85 text-[12.5px] sm:text-[14.5px] max-w-xl mx-auto leading-snug sm:leading-relaxed">
                    Pick the size that matches your waste — we'll
                    confirm the final price on site before we load.
                  </p>
                </div>

                {/* Load cards — 2 col mobile, 3 col tablet, 4 col desktop.
                    Last card spans trailing row on every breakpoint so
                    the grid never has an awkward orphan. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
                  {WASTE_LOADS.map((load, i) => {
                    const isLast = i === WASTE_LOADS.length - 1;
                    return (
                      <div
                        key={load.id}
                        className={[
                          "relative bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] text-center transition-all sm:hover:-translate-y-0.5 flex flex-col",
                          isLast
                            ? "col-span-2 sm:col-span-3 lg:col-span-4 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-4"
                            : "",
                        ].join(" ")}
                        data-testid={`waste-price-${load.id}`}
                      >
                        <div
                          className={[
                            "flex items-center justify-center",
                            isLast
                              ? "h-10 sm:h-14 sm:w-20 sm:shrink-0 mb-1 sm:mb-0"
                              : "h-12 sm:h-20 mb-1.5 sm:mb-2.5",
                          ].join(" ")}
                        >
                          <img
                            src={LOAD_IMAGES[load.id]}
                            alt={`${load.label} — Move4U waste removal`}
                            className="max-h-full max-w-full object-contain select-none"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                        </div>
                        <div
                          className={
                            isLast ? "flex-1 text-center sm:text-left" : ""
                          }
                        >
                          <p className="text-[10px] sm:text-[11.5px] font-semibold tracking-wide text-purple-700 mb-0.5 sm:mb-1 uppercase leading-tight">
                            {load.label}
                          </p>
                          <p className="text-[15px] sm:text-[22px] font-bold text-gray-900 tracking-tight leading-none">
                            <span className="text-gray-400 text-[10px] sm:text-[12px] font-medium mr-1">
                              from
                            </span>
                            {load.displayPrice}
                          </p>
                          <p className="text-gray-500 text-[10.5px] sm:text-[11.5px] mt-1 leading-snug">
                            {loadNotes[load.id]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Helper strip — minimum + add-ons line. Kept compact. */}
                <ul className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl ring-1 ring-white/20 p-2.5 sm:p-4 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3 text-center sm:text-left">
                  <li className="flex items-center justify-center sm:justify-start gap-2 text-[12px] sm:text-[13px]">
                    <BadgePoundSterling
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="text-purple-100/90">
                      <span className="font-semibold text-white">
                        Minimum charge
                      </span>{" "}
                      £60
                    </span>
                  </li>
                  <li className="flex items-center justify-center sm:justify-start gap-2 text-[12px] sm:text-[13px]">
                    <Sofa
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="text-purple-100/90">
                      <span className="font-semibold text-white">
                        Extra items
                      </span>{" "}
                      from £15
                    </span>
                  </li>
                  <li className="flex items-center justify-center sm:justify-end gap-2 text-[11.5px] sm:text-[12.5px] text-purple-100/80">
                    All loaded, swept and disposed
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-stretch sm:items-center">
                  <button
                    onClick={() => setLocation("/book/waste-removal")}
                    className="bg-white text-purple-900 hover:bg-purple-50 hover:-translate-y-0.5 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full inline-flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[14.5px] sm:text-[16px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-white/40"
                    data-testid="pricing-book-now"
                  >
                    Book now
                    <ArrowRight
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      strokeWidth={2.5}
                    />
                  </button>
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

        {/* ============================================================
            FINAL CTA — short, confident close-out per the brief.
            ============================================================ */}
        <section
          className="bg-[#faf8fd] py-10 sm:py-16"
          aria-label="Ready to book"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-[22px] sm:text-3xl font-bold text-gray-900 tracking-tight mb-2 sm:mb-3">
              Ready to clear your space?
            </h2>
            <p className="text-gray-500 text-[13.5px] sm:text-base leading-relaxed max-w-xl mx-auto mb-5 sm:mb-7">
              Get an instant estimate and book your waste collection in
              minutes. Same-day slots often available.
            </p>
            <button
              onClick={() => setLocation("/book/waste-removal")}
              className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-7 sm:px-8 py-3 sm:py-3.5 rounded-full text-[15px] sm:text-[16px] shadow-[0_18px_40px_-16px_rgba(74,49,156,0.55)]"
              data-testid="final-get-quote"
            >
              Get a Quote
              <ArrowRight
                className="w-4 h-4 sm:w-5 sm:h-5"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
