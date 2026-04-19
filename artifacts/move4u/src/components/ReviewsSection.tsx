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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {REVIEWS.map((review) => (
            <figure
              key={review.id}
              className="relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.06)] hover:ring-purple-200/70 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(124,58,237,0.3)] sm:hover:-translate-y-1 transition-all duration-300 flex flex-col"
              data-testid={`review-${review.id}`}
            >
              {/* Big editorial quote mark */}
              <Quote
                className="w-6 h-6 sm:w-9 sm:h-9 text-purple-200 -mt-0.5 -ml-0.5 mb-2 sm:mb-3"
                aria-hidden="true"
                fill="currentColor"
              />

              {/* The quote — typographic hierarchy as the hero */}
              <blockquote className="text-gray-800 text-[13.5px] sm:text-[15.5px] leading-[1.55] sm:leading-[1.65] font-normal mb-3 sm:mb-6 flex-1">
                "{review.text}"
              </blockquote>

              {/* Author row — refined, separated from the quote with a hairline */}
              <figcaption className="flex items-center gap-2.5 sm:gap-3 pt-2.5 sm:pt-4 border-t border-gray-100">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[12.5px] sm:text-[14px] ring-1 ring-purple-200/40 shrink-0">
                  {review.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Mobile: name + compact "★ 5.0" rating on a single row.
                      Desktop: name on top, location below; full 5-star row sits to the right. */}
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <p className="font-semibold text-gray-900 text-[13px] sm:text-[14px] leading-tight truncate">{review.name}</p>
                    <span className="sm:hidden inline-flex items-center gap-1 text-[12px] font-semibold text-gray-700 tabular-nums shrink-0">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11.5px] sm:text-[12px] mt-0.5 truncate">{review.location}</p>
                </div>
                {/* Desktop only: traditional 5-star row */}
                <div className="hidden sm:flex items-center gap-0.5">
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
