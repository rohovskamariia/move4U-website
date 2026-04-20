import { Star, Quote } from "lucide-react";
import { REVIEWS } from "@/data/constants";

// Editorial testimonial layout — large pull-quote feel, generous whitespace,
// soft author row instead of stacked admin cards.
export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-9 sm:py-16 bg-gradient-to-b from-[#faf8fd] via-purple-50/40 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-14">
          <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
            REVIEWS
          </p>
          <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-[13px] sm:text-base leading-relaxed">
            Trusted by hundreds of customers across London.
          </p>
        </div>

        {/* MOBILE: horizontal swipe carousel — compact app-style cards.
            Each card ~85vw wide so the next card peeks in, encouraging swipe.
            Quote text is line-clamped to 4 lines to prevent tall cards. */}
        <div
          className="sm:hidden -mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          data-testid="reviews-mobile-carousel"
        >
          {REVIEWS.map((review) => (
            <figure
              key={review.id}
              className="snap-start shrink-0 w-[85%] bg-white rounded-2xl p-3.5 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.05)] flex flex-col"
              data-testid={`review-${review.id}`}
            >
              {/* Compact header row — small quote glyph, rating tag on right */}
              <div className="flex items-start justify-between mb-1.5">
                <Quote
                  className="w-4 h-4 text-purple-200/80"
                  aria-hidden="true"
                  fill="currentColor"
                />
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-700 tabular-nums">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {review.rating.toFixed(1)}
                </span>
              </div>

              {/* Quote — clamped to 4 lines, tight leading */}
              <blockquote className="text-gray-800 text-[13px] leading-[1.5] font-normal mb-3 flex-1 line-clamp-4">
                "{review.text}"
              </blockquote>

              {/* Single-line author row: avatar + "Name • Location" */}
              <figcaption className="flex items-center gap-2 pt-2.5 border-t border-gray-100">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[11.5px] ring-1 ring-purple-200/40 shrink-0">
                  {review.name.charAt(0)}
                </div>
                <p className="text-[12px] text-gray-700 truncate min-w-0">
                  <span className="font-semibold text-gray-900">{review.name}</span>
                  <span className="text-gray-400"> · {review.location}</span>
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* DESKTOP / TABLET: original editorial grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <figure
              key={review.id}
              className="relative bg-white rounded-3xl p-7 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.06)] hover:ring-purple-200/70 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(74,49,156,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
              data-testid={`review-desktop-${review.id}`}
            >
              <Quote
                className="w-9 h-9 text-purple-200 -mt-0.5 -ml-0.5 mb-3"
                aria-hidden="true"
                fill="currentColor"
              />

              <blockquote className="text-gray-800 text-[15.5px] leading-[1.65] font-normal mb-6 flex-1">
                "{review.text}"
              </blockquote>

              <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[14px] ring-1 ring-purple-200/40 shrink-0">
                  {review.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-[14px] leading-tight">{review.name}</p>
                  <p className="text-gray-400 text-[12px] mt-0.5">{review.location}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                    />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
