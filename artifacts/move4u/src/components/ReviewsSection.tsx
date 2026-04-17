import { Star, Quote } from "lucide-react";
import { REVIEWS } from "@/data/constants";

// Edit review content in src/data/constants.ts
export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-purple-700 mb-2">REVIEWS</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm sm:text-base">Trusted by hundreds of customers across London.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`review-${review.id}`}
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-purple-100" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">"{review.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                  <p className="text-gray-400 text-xs">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
