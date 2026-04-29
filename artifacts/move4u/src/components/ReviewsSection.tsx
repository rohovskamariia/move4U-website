import { ShieldCheck } from "lucide-react";
import customersImg from "@/assets/reviews/move4u_real_move.webp";

/**
 * "Trusted by customers" section.
 *
 * Replaces the old fake reviews carousel + Google Reviews placeholders.
 * No clickable review links, no fake quotes, no fabricated star ratings —
 * just a clean, premium trust statement and a real photo of our team
 * working a London removals job.
 *
 * The section keeps its original id, padding, and gradient background so
 * the surrounding page layout / scroll anchors stay unchanged.
 */
export default function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="relative py-10 sm:py-20 bg-gradient-to-b from-[#faf8fd] via-purple-50/40 to-white overflow-hidden"
    >
      {/* Ambient glow — preserved from previous design for visual continuity. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 50%, rgba(74,49,156,0.10) 0%, rgba(74,49,156,0) 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-12 md:gap-10 lg:gap-12 items-center">
          {/* IMAGE — kept as the visual anchor of the section. No rating
              badges, no clickable overlays — just the genuine photo of
              our movers on a real job. */}
          <div className="md:col-span-5 order-1">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 sm:-inset-6 -z-10 rounded-[2rem] blur-2xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 30% 40%, rgba(74,49,156,0.28), transparent 70%)",
                }}
              />
              <div className="relative rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_30px_70px_-30px_rgba(74,49,156,0.45)]">
                <img
                  src={customersImg}
                  alt="Move4U movers loading a van during a real removals job in London"
                  className="w-full h-[280px] sm:h-[420px] object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* COPY */}
          <div className="md:col-span-7 order-2 mt-6 md:mt-0 text-center md:text-left">
            <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
              REVIEWS
            </p>
            <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-5">
              Trusted by customers across London
            </h2>
            <p className="text-gray-600 text-[14px] sm:text-base leading-relaxed sm:leading-[1.7] max-w-xl mx-auto md:mx-0">
              Our clients consistently highlight our reliability,
              professionalism, and careful handling of their belongings. We
              take pride in delivering a smooth and stress-free moving
              experience every time.
            </p>

            <div
              className="mt-5 sm:mt-6 inline-flex items-center gap-2 text-[12px] sm:text-[13px] text-gray-500 bg-white/70 backdrop-blur-sm ring-1 ring-purple-100/70 rounded-full px-3.5 py-1.5"
              data-testid="customer-feedback-line"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              <span>Customer feedback available upon request</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
