import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import BackToHome from "@/components/BackToHome";
import { MessageCircle } from "lucide-react";
import { usePageMeta } from "@/lib/usePageMeta";
import {
  WASTE_LOADS,
  WASTE_EXTRA_ITEMS,
  CONTACT,
  EXTRA_STOP_CHARGE,
  CONGESTION_CHARGE,
  HELP_PRICING,
  VAN_SIZES,
  OUTSIDE_M25_RATE,
  SINGLE_ITEM_PRICING,
} from "@/data/constants";
import smallVan from "@assets/IMG_3410_1776508670556.webp";
import mediumVan from "@assets/IMG_3409_1776508670556.webp";
import largeVan from "@assets/IMG_3408_1776508670556.webp";
import minLoad from "@assets/IMG_3575_1776610167208.webp";
import quarterLoad from "@assets/IMG_3576_1776610167208.webp";
import thirdLoad from "@assets/IMG_3577_1776610167208.webp";
import halfLoad from "@assets/IMG_3578_1776610167208.webp";
import threeQuarterLoad from "@assets/IMG_3579_1776610167209.webp";
import fullLoad from "@assets/IMG_3580_1776610167209.webp";
import xlLoad from "@assets/IMG_3580_1776610167209.webp";

// Van line-up — base hourly rate (driver-only) is sourced from `HELP_PRICING`
// so this page can never drift out of sync with the booking flow.
const VAN_IMAGES: Record<string, string> = {
  small: smallVan,
  medium: mediumVan,
  large: largeVan,
};
const VANS = VAN_SIZES.map((v) => ({
  id: v.id,
  name: v.name,
  price: `£${HELP_PRICING[v.id]?.noHelp ?? v.basePrice}`,
  desc: v.description,
  image: VAN_IMAGES[v.id] ?? smallVan,
}));

const LOAD_IMAGES: Record<string, string> = {
  minimum: minLoad,
  quarter: quarterLoad,
  third: thirdLoad,
  half: halfLoad,
  three_quarter: threeQuarterLoad,
  full: fullLoad,
  extra_large: xlLoad,
};

// Help-level differentials shown on the page are computed live from
// HELP_PRICING using the medium van as the reference point. This keeps
// the page in lock-step with the booking engine and the per-van grid
// rendered below.
const REFERENCE_VAN = "medium" as const;
const REF = HELP_PRICING[REFERENCE_VAN];
const fmtDelta = (delta: number) =>
  delta === 0 ? "Included" : `+£${delta}/hour`;
const HELP_OPTIONS = [
  {
    label: "No help",
    price: fmtDelta(0),
    note: "Driver drives only — you load & unload.",
  },
  {
    label: "Driver help",
    price: fmtDelta(REF.driverHelp - REF.noHelp),
    note: "Driver helps load and unload as a 2nd pair of hands.",
  },
  {
    label: "Driver + helper",
    price: fmtDelta(REF.driverPlusHelper - REF.noHelp),
    note: "Two professional movers handle everything for you.",
  },
];

export default function PricingGuidePage() {
  usePageMeta({
    title: "Pricing Guide — Removals & Man and Van Rates in London | Move4U",
    description:
      "Transparent Move4U pricing for London removals: van sizes, hourly rates, waste removal loads, extra-stop and congestion charges. No hidden fees.",
    path: "/pricing",
  });
  const whatsappHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;

  return (
    <div className="min-h-screen bg-[#faf8fd]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-14">
        {/* Page header */}
        <header className="mb-6 sm:mb-12">
          <BackToHome className="mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-1 sm:mb-2">
            Pricing
          </h1>
          <p className="text-gray-500 text-[14px] sm:text-lg">
            Simple, transparent pricing. No hidden fees.
          </p>
        </header>

        {/* SECTION 1 — House & Commercial Moving (van + help + stairs) */}
        <SectionHeading>House &amp; Commercial Moving</SectionHeading>

        <Section title="Choose your van" subtitle="Hourly rate. Minimum 2 hours.">
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-5">
            {VANS.map((v) => (
              <div
                key={v.name}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden flex sm:block shadow-[0_4px_18px_-10px_rgba(76,29,149,0.18)] hover:shadow-[0_10px_30px_-12px_rgba(76,29,149,0.28)] sm:hover:-translate-y-0.5 transition-all"
              >
                <div className="w-32 sm:w-auto shrink-0 sm:aspect-[5/3] bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-2.5 sm:p-4">
                  <img
                    src={v.image}
                    alt={v.name}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col justify-center sm:block">
                  <div className="flex items-baseline justify-between gap-2 mb-1 sm:mb-1.5">
                    <h3 className="font-semibold text-gray-900 text-[14.5px] sm:text-[15px]">{v.name}</h3>
                    <span className="text-purple-700 font-bold tabular-nums text-[14px] sm:text-base">
                      {v.price}
                      <span className="text-[11px] sm:text-xs font-medium text-gray-500">/hr</span>
                    </span>
                  </div>
                  <p className="text-[12.5px] sm:text-[13px] text-gray-600 leading-snug">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SECTION 2 — Help options */}
        <Section title="Choose your help level">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)]">
            {HELP_OPTIONS.map((h) => (
              <div key={h.label} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-[14px]">{h.label}</p>
                  <p className="text-[12.5px] text-gray-500 leading-snug">{h.note}</p>
                </div>
                <span className="text-purple-700 font-semibold text-sm shrink-0 tabular-nums">
                  {h.price}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-gray-600 bg-purple-50/70 border border-purple-100 rounded-xl px-4 py-2.5">
            <span className="font-semibold text-gray-900">Example:</span>{" "}
            Medium van + driver help ={" "}
            <span className="font-semibold text-purple-700">
              £{REF.driverHelp}/hour
            </span>{" "}
            · with a helper ={" "}
            <span className="font-semibold text-purple-700">
              £{REF.driverPlusHelper}/hour
            </span>
          </p>
        </Section>

        {/* Per-van × help-level grid — the full hourly-rate matrix so
            customers can read the exact rate for any combination at a
            glance, instead of doing the addition themselves. */}
        <Section
          title="Hourly rates by van and help level"
          subtitle="Final price = hourly rate × hours (minimum 2 hours)."
        >
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] sm:text-sm">
                <thead className="bg-purple-50/60 text-gray-700">
                  <tr>
                    <th className="text-left font-semibold px-4 py-2.5">Van</th>
                    <th className="text-right font-semibold px-4 py-2.5">No help</th>
                    <th className="text-right font-semibold px-4 py-2.5">+ Driver help</th>
                    <th className="text-right font-semibold px-4 py-2.5">+ Helper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {VAN_SIZES.map((v) => {
                    const p = HELP_PRICING[v.id];
                    return (
                      <tr key={v.id}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{v.name}</td>
                        <td className="px-4 py-2.5 text-right text-purple-700 font-semibold tabular-nums">£{p.noHelp}/hr</td>
                        <td className="px-4 py-2.5 text-right text-purple-700 font-semibold tabular-nums">£{p.driverHelp}/hr</td>
                        <td className="px-4 py-2.5 text-right text-purple-700 font-semibold tabular-nums">£{p.driverPlusHelper}/hr</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* SECTION 3 — Additional charges */}
        <Section
          title="Additional charges"
          subtitle="Optional or route-dependent fees added to your booking when relevant."
        >
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)]">
            <ExtraChargeRow
              label={`Congestion Charge (per address inside zone)`}
              price={`£${CONGESTION_CHARGE}`}
            />
            <ExtraChargeRow
              label="Outside the M25"
              price={`£${OUTSIDE_M25_RATE} per mile`}
            />
            <ExtraChargeRow
              label="Stairs (no lift) — every 4 steps counts as 1 floor"
              price="£10 per floor"
            />
            <ExtraChargeRow
              label="Additional stops"
              price={`£${EXTRA_STOP_CHARGE} per stop`}
            />
            <ExtraChargeRow label="Extra time" price="From £17.50 / 30 min" />
          </div>
        </Section>

        {/* SECTION 4 — Waste removal pricing */}
        <SectionHeading>Waste Removal</SectionHeading>

        <Section
          title="Choose your load size"
          subtitle="Pay by load size — quick, fixed and clear."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {WASTE_LOADS.map((load) => (
              <div
                key={load.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)] hover:shadow-[0_8px_22px_-10px_rgba(76,29,149,0.25)] transition-shadow"
              >
                <div className="w-28 sm:w-32 shrink-0 bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-2.5">
                  <img
                    src={LOAD_IMAGES[load.id]}
                    alt={load.label}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3.5 flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-[14.5px] leading-tight">
                      {load.label}
                    </h3>
                    <span className="text-purple-700 font-bold text-sm tabular-nums">
                      {load.displayPrice}
                    </span>
                  </div>
                  <ul className="text-[12px] text-gray-600 space-y-0.5">
                    {load.equivalent && <li>~ {load.equivalent}</li>}
                    {load.cubicYards && <li>{load.cubicYards} cu yd</li>}
                    {load.maxWeight && <li>Up to {load.maxWeight}</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SECTION 5 — Additional waste charges */}
        <Section title="Additional waste charges">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)]">
            {WASTE_EXTRA_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <p className="font-medium text-gray-800 text-[14px]">{item.label}</p>
                <span className="text-purple-700 font-semibold text-sm tabular-nums">
                  +£{item.price}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-gray-500 italic">
            Additional charges apply for bulky or heavy items.
          </p>
        </Section>

        {/* SECTION 6 + 7 — Single Item & International (side by side on desktop) */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mb-12 sm:mb-14">
          <InfoCard
            title="Single Item Delivery"
            highlight={`From £${SINGLE_ITEM_PRICING.baseCharge}`}
            desc={`£${SINGLE_ITEM_PRICING.baseCharge} covers up to ${SINGLE_ITEM_PRICING.baseHours} hour. £${SINGLE_ITEM_PRICING.extraHalfHourRate} per extra 30 minutes after that.`}
          />
          <InfoCard
            title="International Moving"
            highlight="Custom pricing"
            desc="Based on distance and load. Contact us for a tailored quote."
          />
        </div>

        {/* SECTION 8 — CTA */}
        <div
          className="rounded-3xl p-6 sm:p-10 text-white text-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #5b3fb8 0%, #4a319c 55%, #3a267f 100%)",
            boxShadow: "0 18px 40px -18px rgba(74,49,156,0.55)",
          }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Ready to move? Let's make it easy.
          </h2>
          <p className="text-purple-100 text-sm sm:text-base mb-6">
            Get a fast quote, book online, or chat with us on WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book?action=quote"
              className="inline-flex items-center justify-center bg-white text-purple-700 font-semibold px-6 py-3 rounded-full hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
              data-testid="pricing-cta-quote"
            >
              Get a Quote
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-purple-900/40 text-white font-semibold px-6 py-3 rounded-full border border-white/40 hover:bg-purple-900/60 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
              data-testid="pricing-cta-book"
            >
              Book Now
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#1ea855] hover:-translate-y-0.5 transition-all text-sm sm:text-base"
              data-testid="pricing-cta-whatsapp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Top-level section heading — used for the two main pricing pillars
 * ("House & Commercial Moving", "Waste Removal"). These are visually
 * the strongest titles on the page so users can find each pillar fast.
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 sm:mt-10 mb-4 sm:mb-6 first:mt-0">
      <h2 className="text-[20px] sm:text-2xl font-bold text-gray-900 tracking-tight">
        {children}
      </h2>
    </div>
  );
}

/**
 * Subsection within a pillar (e.g. "Choose your van"). Deliberately
 * less heavy than the top-level heading: medium weight, softer dark
 * grey, slightly smaller — so it reads as a child of the pillar
 * rather than a peer.
 */
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 sm:mb-10">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-[14px] sm:text-[16px] font-medium text-gray-700 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[12px] sm:text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ExtraChargeRow({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <p className="font-medium text-gray-800 text-[14px]">{label}</p>
      <span className="text-purple-700 font-semibold text-sm shrink-0 tabular-nums">
        {price}
      </span>
    </div>
  );
}

function InfoCard({
  title,
  highlight,
  desc,
}: {
  title: string;
  highlight: string;
  desc: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-[0_4px_18px_-10px_rgba(76,29,149,0.15)]">
      <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-purple-700 text-xl sm:text-2xl font-bold tracking-tight mb-1.5 sm:mb-2">
        {highlight}
      </p>
      <p className="text-[13px] sm:text-[13.5px] text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}
