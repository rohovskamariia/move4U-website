import { useState } from "react";
import { useLocation } from "wouter";
import { usePageMeta } from "@/lib/usePageMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import WasteRemovalHowItWorks from "@/components/WasteRemovalHowItWorks";
import { CONTACT, WASTE_LOADS } from "@/data/constants";
import {
  ArrowRight,
  BadgePoundSterling,
  Briefcase,
  CheckCircle2,
  Hammer,
  MessageCircle,
  Phone,
  Quote,
  Recycle,
  Refrigerator,
  ShieldCheck,
  Sofa,
  Star,
  Trash2,
  TreePine,
  Truck,
  Zap,
} from "lucide-react";

// Hero photo — generated waste-removal scene (Move4U team in purple polos
// loading bin bags, an old armchair, microwave and garden offcuts into a
// white panel van on a sunny suburban London street). Distinct from the
// /house-moving hero so the two service pages read as different services.
import heroImg from "@/assets/hero/waste_hero_v2.webp";

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

  // What we handle — 6 service categories + 1 final card that's a
  // soft "ask us" CTA pointing to WhatsApp. Equal-height cards via
  // h-full + flex layout so the grid never staircases on desktop.
  const handled = [
    { icon: Trash2, title: "Household waste", text: "Bin bags, boxes and general rubbish." },
    { icon: Sofa, title: "Furniture removal", text: "Sofas, beds, wardrobes, tables." },
    { icon: TreePine, title: "Garden waste", text: "Soil, branches and clippings." },
    { icon: Refrigerator, title: "Appliances", text: "Fridges, washers, white goods." },
    { icon: Briefcase, title: "Office clearance", text: "Desks, chairs and IT equipment." },
    { icon: Hammer, title: "Builders waste", text: "Rubble, plasterboard, offcuts." },
  ];

  // WhatsApp CTA — replaces the last "what we handle" card per the brief.
  // Uses CONTACT.whatsapp (single source of truth) and a pre-filled
  // message so the user lands in a ready-to-send chat.
  const whatsAppHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    "Hi, I need help with waste removal",
  )}`;

  // Why Move4U feature pills — design mirrors /house-moving exactly:
  // small purple-50 bubble + icon + title only (no description), 2x2
  // on mobile, 4x1 on desktop. Content is waste-flavoured.
  const whyFeatures = [
    { icon: ShieldCheck, title: "Licensed waste carriers" },
    { icon: Truck, title: "We do the heavy lifting" },
    { icon: BadgePoundSterling, title: "Clear, fixed pricing" },
    { icon: Zap, title: "Same-day availability" },
  ];

  // Page-local annotations for each load size — kept in sync with the
  // brief copy. Numeric prices stay sourced from WASTE_LOADS so the
  // booking flow and this page can never drift apart.
  const loadNotes: Record<string, string> = {
    minimum: "~8 bags · up to 150kg",
    quarter: "~20 bags · up to 250kg",
    third: "~30 bags",
    half: "~40 bags",
    three_quarter: "~60 bags",
    full: "Full van · up to 1000kg",
    extra_large: "Large jobs · on request",
  };

  // Placeholder Google reviews link — defaults to a Google search for
  // the brand until a real Google Business profile URL is wired in.
  const googleReviewsUrl =
    "https://www.google.com/search?q=Move4U+London+removals+reviews";

  // Split pricing into "first six" + "last one" so the desktop grid
  // can render 3 cards on row 1, 3 on row 2, and the seventh centered
  // wider on row 3 (per the brief).
  const firstSixLoads = WASTE_LOADS.slice(0, 6);
  const lastLoad = WASTE_LOADS[WASTE_LOADS.length - 1];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Mobile-only "← Back to home" strip — sits between the navbar
            and the hero so the user always has an obvious one-tap way
            back to the homepage. Desktop has full nav, so we hide it
            there to keep the hero edge-to-edge. */}
        <div className="md:hidden bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
            <BackToHome />
          </div>
        </div>

        {/* ============================================================
            HERO — clean photo + very light overlay so the image stays
            natural while keeping white copy legible.
            Left column: title, subtitle, CTAs, trust line.
            Right column: collection-address-only quick quote card.

            min-h is intentionally identical to /house-moving so both
            service heroes have the same visual presence on every
            viewport — the photo never reads taller on one page than
            the other regardless of how much content the right-column
            quote card has. ============================================================ */}
        <section
          className="relative overflow-hidden isolate min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[560px]"
          style={{ backgroundColor: "#1f1b2e" }}
        >
          {/* React 19 hoists this <link> into <head> when the route mounts,
              giving the browser an explicit high-priority hint for the hero
              photo. Combined with the dark fallback background-color above
              and the eager / fetchPriority / decoding attributes on the
              <img> below, this eliminates the white-flash + late-paint
              behaviour the old uncompressed PNG used to cause. */}
          <link
            rel="preload"
            as="image"
            href={heroImg}
            // @ts-expect-error -- React typings lag the spec
            fetchpriority="high"
          />
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImg}
              alt="Move4U team loading bags and an old armchair into a white panel van during a London waste collection"
              className="waste-hero-img w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {/* Soft horizontal readability gradient — pure black, darker
                on the LEFT where the headline sits and fading to a
                whisper of darkness on the RIGHT so the white quote card
                still gets a faint contrast lift without the photo ever
                looking heavy or filtered. Identical treatment to
                /house-moving so the two service heroes feel consistent. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-7 lg:pt-20 pb-7 lg:pb-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* LEFT — full marketing copy. Hidden on mobile/tablet to
                  keep the hero focused on the conversion form. */}
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

              {/* MOBILE-only eyebrow above the form. */}
              <p
                className="lg:hidden text-center text-[11px] font-semibold tracking-[0.22em] text-white -mb-2"
                style={{
                  textShadow:
                    "0 2px 10px rgba(15,10,40,0.55), 0 1px 2px rgba(15,10,40,0.45)",
                }}
              >
                WASTE REMOVAL SERVICE
              </p>

              {/* RIGHT — quick quote card. Single field — collection
                  address only (waste removal has no drop-off). */}
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
            HOW IT WORKS — extracted to its own component so we can give
            mobile a one-step-at-a-time auto-advancing carousel (matching
            /house-moving's mobile UX exactly) while desktop keeps the
            editorial horizontal timeline. Behaviour and code stay
            isolated from the homepage "How It Works" section.
            ============================================================ */}
        <WasteRemovalHowItWorks />

        {/* ============================================================
            WHAT WE HANDLE — 6 service categories + 1 WhatsApp CTA card
            on row 4. Equal-height grid (h-full + flex-col) so cards
            never staircase on desktop. 2-col mobile, 3-col tablet+
            (clean 3x3 grid where the WhatsApp CTA tops & tails row 3).
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

            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
              {handled.map(({ icon: Icon, title, text }, i) => (
                <li
                  key={title}
                  className="h-full bg-white rounded-2xl ring-1 ring-purple-100/70 p-3.5 sm:p-5 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.08),_0_18px_40px_-22px_rgba(74,49,156,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(74,49,156,0.18),_0_30px_60px_-24px_rgba(74,49,156,0.30)] flex flex-col"
                  data-testid={`waste-handle-${i}`}
                >
                  <div
                    className="text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)] mb-2 sm:mb-2.5"
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
                  <h3 className="font-semibold text-gray-900 text-[13.5px] sm:text-[14.5px] tracking-tight leading-tight mb-0.5 sm:mb-1">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-[12px] sm:text-[13px] leading-relaxed">
                    {text}
                  </p>
                </li>
              ))}

            </ul>

            {/* WhatsApp CTA — replaces the old "Almost anything" card.
                Lives BELOW the service grid as a full-width banner so
                row 3 of the 3-col desktop grid never staircases. On
                mobile it stacks (icon+copy on top, CTA below). On
                desktop it lays out horizontally (icon+copy left, CTA
                button right). Visually distinct (subtle emerald glow)
                so it reads as "ask us" rather than another category. */}
            <div
              className="mt-2.5 sm:mt-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl ring-1 ring-emerald-200/70 p-3.5 sm:p-5 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.10),_0_18px_40px_-22px_rgba(16,185,129,0.20)] transition-all duration-300 hover:shadow-[0_8px_18px_-6px_rgba(16,185,129,0.18),_0_30px_60px_-24px_rgba(16,185,129,0.30)] flex flex-col sm:flex-row sm:items-center sm:gap-5"
              data-testid="waste-handle-whatsapp"
            >
              <div className="flex items-start sm:items-center gap-3 sm:flex-1">
                <div className="text-white w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]">
                  <MessageCircle
                    className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                    strokeWidth={2.25}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[14px] sm:text-[15.5px] tracking-tight leading-tight mb-0.5">
                    Not sure? Just ask
                  </h3>
                  <p className="text-gray-500 text-[12.5px] sm:text-[13.5px] leading-relaxed">
                    Send us a photo on WhatsApp and we'll confirm
                    instantly.
                  </p>
                </div>
              </div>
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1fbf5b] text-white font-semibold px-4 sm:px-5 py-2.5 rounded-full text-[13px] sm:text-[13.5px] transition-colors shrink-0 self-stretch sm:self-auto"
                data-testid="waste-handle-whatsapp-cta"
              >
                Chat on WhatsApp
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================
            WHY MOVE4U — DESIGN MIRRORS /house-moving EXACTLY.
            Heading block → 4 small "feature pill" cards (icon-in-purple-
            bubble + title only) → SEPARATE small review card with quote
            mark, 5 stars, italic line, customer attribution and a
            "See all reviews on Google" link. Same spacing, same
            typography, same layout so both service pages feel like one
            product family.
            ============================================================ */}
        <section
          className="py-10 sm:py-16 bg-[#faf8fd]"
          aria-labelledby="waste-why-move4u-heading"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Heading block */}
            <div className="text-center mb-7 sm:mb-10 max-w-2xl mx-auto">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2.5">
                WHY MOVE4U
              </p>
              <h2
                id="waste-why-move4u-heading"
                className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2 sm:mb-3"
              >
                Why customers choose Move4U
              </h2>
              <p className="text-gray-600 text-[13.5px] sm:text-[15px] leading-relaxed">
                A small, dedicated London team focused on doing your
                clearance properly — not a faceless platform.
              </p>
            </div>

            {/* Feature cards — 2 cols on mobile, 4 cols on desktop. */}
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-7 sm:mb-10">
              {whyFeatures.map(({ icon: Icon, title }) => (
                <li
                  key={title}
                  className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-purple-100 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.06)] hover:shadow-[0_18px_40px_-22px_rgba(74,49,156,0.18)] transition-shadow text-center sm:text-left"
                  data-testid={`waste-why-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                >
                  <div className="inline-flex w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 text-purple-700 items-center justify-center mb-2.5 sm:mb-3">
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[13.5px] sm:text-[15px] tracking-tight leading-snug">
                    {title}
                  </h3>
                </li>
              ))}
            </ul>

            {/* Separate review card — centred, full-width on mobile,
                comfortably sized on desktop. Mirrors house-moving. */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 ring-1 ring-purple-100 shadow-[0_18px_40px_-22px_rgba(74,49,156,0.18)] max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-2.5">
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
              <p className="text-gray-800 text-[14px] sm:text-[15px] leading-relaxed mb-3">
                &ldquo;Same-day collection, fair price, gone in twenty
                minutes.&rdquo;
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[12.5px] text-gray-500">
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
        </section>

        {/* ============================================================
            PRICING — premium centered brand block.
            Layout per brief:
              - Mobile: 2-col grid (compact), last card spans full width.
              - Desktop: 3 cards row 1, 3 cards row 2, last card centered
                wider on row 3 (NOT stretched to full grid width).
            Bottom info strip: ✔ Minimum charge £60 / ✔ Extra items
            from £15 / ✔ We load everything for you.
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
                  <h2 className="text-[20px] sm:text-[28px] font-bold text-white tracking-tight mb-1.5 sm:mb-2 leading-snug">
                    Clear pricing. Pay only for what we remove
                  </h2>
                  <p className="text-purple-100/85 text-[12.5px] sm:text-[14.5px] max-w-xl mx-auto leading-snug sm:leading-relaxed">
                    Choose the load size that fits your waste. We
                    confirm everything on arrival — no surprises.
                  </p>
                </div>

                {/* First six cards — 2 col mobile, 3 col desktop. */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3.5 mb-2 sm:mb-3.5">
                  {firstSixLoads.map((load) => (
                    <div
                      key={load.id}
                      className="relative bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] text-center transition-all sm:hover:-translate-y-0.5 flex flex-col h-full"
                      data-testid={`waste-price-${load.id}`}
                    >
                      <div className="flex items-center justify-center h-12 sm:h-20 mb-1.5 sm:mb-2.5">
                        <img
                          src={LOAD_IMAGES[load.id]}
                          alt={`${load.label} — Move4U waste removal`}
                          className="max-h-full max-w-full object-contain select-none"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      </div>
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
                  ))}
                </div>

                {/* Seventh card — centered wider on its own row.
                    Mobile: full width (2-col grid would orphan it).
                    Desktop: max-w-md, mx-auto, horizontal layout
                    (image left, text right) so it reads as a "wider"
                    card without stretching across the entire grid. */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div
                    className="w-full sm:max-w-md bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 ring-1 ring-white/30 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] transition-all sm:hover:-translate-y-0.5 flex items-center gap-3 sm:gap-4 text-left"
                    data-testid={`waste-price-${lastLoad.id}`}
                  >
                    <div className="flex items-center justify-center h-14 w-20 shrink-0">
                      <img
                        src={LOAD_IMAGES[lastLoad.id]}
                        alt={`${lastLoad.label} — Move4U waste removal`}
                        className="max-h-full max-w-full object-contain select-none"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] sm:text-[11.5px] font-semibold tracking-wide text-purple-700 mb-0.5 uppercase leading-tight">
                        {lastLoad.label}
                      </p>
                      <p className="text-[18px] sm:text-[22px] font-bold text-gray-900 tracking-tight leading-none">
                        <span className="text-gray-400 text-[11px] sm:text-[12px] font-medium mr-1">
                          from
                        </span>
                        {lastLoad.displayPrice}
                      </p>
                      <p className="text-gray-500 text-[11.5px] sm:text-[12.5px] mt-1 leading-snug">
                        {loadNotes[lastLoad.id]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom info strip — three reassurance ticks per the
                    brief. Centered, brand-toned, compact. */}
                <ul className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl ring-1 ring-white/20 p-2.5 sm:p-4 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-3 text-center">
                  {[
                    "Minimum charge £60",
                    "Extra items from £15",
                    "We load everything for you",
                  ].map((label) => (
                    <li
                      key={label}
                      className="flex items-center justify-center gap-2 text-[12px] sm:text-[13px] text-purple-100/95"
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0"
                        strokeWidth={2.5}
                      />
                      <span className="font-medium text-white/95">
                        {label}
                      </span>
                    </li>
                  ))}
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
      </main>

      <Footer />
    </div>
  );
}
