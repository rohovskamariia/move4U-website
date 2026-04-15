import { Star } from "lucide-react";
import { REVIEWS } from "@/data/constants";

// Edit review content in src/data/constants.ts
export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
          <p className="text-gray-500 text-sm sm:text-base">Trusted by hundreds of customers across London.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
              data-testid={`review-${review.id}`}
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{review.text}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                <p className="text-gray-400 text-xs">{review.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
