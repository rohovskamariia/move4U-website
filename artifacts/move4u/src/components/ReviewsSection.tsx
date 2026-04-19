import { Star, Quote } from "lucide-react";
import { REVIEWS } from "@/data/constants";

// Editorial testimonial layout — large pull-quote feel, generous whitespace,
// soft author row instead of stacked admin cards.
export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-14 sm:py-20 bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            REVIEWS
          </p>
          <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-[14px] sm:text-base leading-relaxed">
            Trusted by hundreds of customers across London.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {REVIEWS.map((review) => (
            <figure
              key={review.id}
              className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-7 ring-1 ring-gray-100 hover:ring-purple-200/70 transition-all duration-300 hover:shadow-[0_18px_40px_-22px_rgba(124,58,237,0.35)] flex flex-col"
              data-testid={`review-${review.id}`}
            >
              {/* Big editorial quote mark */}
              <Quote
                className="w-9 h-9 text-purple-200 -mt-1 -ml-1 mb-3"
                aria-hidden="true"
                fill="currentColor"
              />

              {/* The quote — typographic hierarchy as the hero */}
              <blockquote className="text-gray-800 text-[15.5px] leading-[1.65] font-normal mb-6 flex-1">
                "{review.text}"
              </blockquote>

              {/* Author row — refined, separated from the quote with a hairline */}
              <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[14px] ring-1 ring-purple-200/40">
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
