import { useEffect, useRef, useState, useCallback, type TouchEvent } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS } from "@/data/constants";
import customersImg from "@/assets/reviews/move4u_real_move.png";

const AUTO_ROTATE_MS = 5000;
const RESUME_AFTER_MS = 8000;
const SWIPE_THRESHOLD_PX = 40;

// Visible stack — three cards always rendered: 0 = front, 1 = back-left,
// 2 = back-right. Offsets are large enough that back cards clearly peek
// out from behind the front card (no "single card" look).
const STACK_STYLES: Record<number, React.CSSProperties> = {
  0: {
    transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)",
    opacity: 1,
    zIndex: 30,
    filter: "none",
  },
  1: {
    transform: "translate3d(-44px, -28px, 0) rotate(-4deg) scale(0.92)",
    opacity: 0.62,
    zIndex: 20,
    filter: "blur(0.3px)",
  },
  2: {
    transform: "translate3d(44px, -28px, 0) rotate(4deg) scale(0.86)",
    opacity: 0.42,
    zIndex: 10,
    filter: "blur(0.6px)",
  },
};

export default function ReviewsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const total = REVIEWS.length;
  const next = useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setActive((i) => (i - 1 + total) % total), [total]);

  // Auto-rotate
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, AUTO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, next]);

  const pauseTemporarily = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_MS);
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    },
    []
  );

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    pauseTemporarily();
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  // Relative position of card `idx` to the active one (0 / 1 / 2 / -1)
  const relativePos = (idx: number): number => {
    const diff = (idx - active + total) % total;
    return diff <= 2 ? diff : -1;
  };

  return (
    <section
      id="reviews"
      className="relative py-10 sm:py-20 bg-gradient-to-b from-[#faf8fd] via-purple-50/40 to-white overflow-hidden"
    >
      {/* Ambient purple glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 50%, rgba(74,49,156,0.10) 0%, rgba(74,49,156,0) 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-7 sm:mb-12">
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

        {/* Split layout — image left (md+), stacked above on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-12 md:gap-10 items-center">
          {/* IMAGE */}
          <div className="md:col-span-5 mb-8 md:mb-0">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[2rem] blur-2xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 30% 40%, rgba(74,49,156,0.28), transparent 70%)",
                }}
              />
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_30px_70px_-30px_rgba(74,49,156,0.45)]">
                <img
                  src={customersImg}
                  alt="Move4U movers loading a van during a real removals job in London"
                  className="w-full h-52 sm:h-80 md:h-[440px] object-cover"
                  loading="lazy"
                />
              </div>
              {/* floating rating badge */}
              <div className="absolute -bottom-4 left-4 sm:left-6 bg-white rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-[0_18px_40px_-18px_rgba(17,12,46,0.25)] ring-1 ring-gray-100 flex items-center gap-2.5 sm:gap-3">
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
                  <p className="text-gray-500">Hundreds of moves</p>
                </div>
              </div>
            </div>
          </div>

          {/* STACKED CAROUSEL */}
          <div className="md:col-span-7">
            <div
              className="relative h-[320px] sm:h-[360px] flex items-center justify-center [perspective:1400px]"
              onMouseEnter={() => {
                if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
                setPaused(true);
              }}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              data-testid="reviews-stack"
            >
              {/* central glow behind active card */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 flex items-center justify-center"
              >
                <div
                  className="w-[70%] h-[70%] rounded-full blur-3xl opacity-70"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(74,49,156,0.30), rgba(74,49,156,0) 70%)",
                  }}
                />
              </div>

              {REVIEWS.map((review, idx) => {
                const pos = relativePos(idx);
                if (pos < 0) return null;
                const cardStyle = STACK_STYLES[pos];
                return (
                  <article
                    key={review.id}
                    aria-hidden={pos !== 0}
                    className="absolute top-1/2 left-1/2 w-[86%] max-w-[400px] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-20px_rgba(74,49,156,0.35)] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:transform,opacity]"
                    style={{
                      ...cardStyle,
                      // Compose centering + stack offset
                      transform: `translate(-50%, -50%) ${cardStyle.transform}`,
                    }}
                    data-testid={`review-card-${review.id}`}
                  >
                    <Quote
                      className="w-6 h-6 sm:w-7 sm:h-7 text-purple-200 -mt-0.5 -ml-0.5 mb-2"
                      aria-hidden="true"
                      fill="currentColor"
                    />
                    <blockquote className="text-gray-800 text-[13.5px] sm:text-[14px] leading-[1.6] font-normal mb-4 sm:mb-5 flex-1 line-clamp-5">
                      &ldquo;{review.text}&rdquo;
                    </blockquote>
                    <footer className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[13px] ring-1 ring-purple-200/40 shrink-0">
                        {review.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-[13px] leading-tight truncate">
                          {review.name}
                        </p>
                        <p className="text-gray-400 text-[11.5px] mt-0.5 truncate">
                          {review.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>

            {/* Controls + dots */}
            <div className="mt-5 sm:mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    prev();
                    pauseTemporarily();
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white ring-1 ring-gray-200 hover:ring-purple-300 hover:text-purple-700 text-gray-500 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Previous review"
                  data-testid="reviews-prev"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    next();
                    pauseTemporarily();
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white ring-1 ring-gray-200 hover:ring-purple-300 hover:text-purple-700 text-gray-500 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Next review"
                  data-testid="reviews-next"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {REVIEWS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActive(i);
                      pauseTemporarily();
                    }}
                    aria-label={`Go to review ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active
                        ? "w-6 sm:w-7 bg-purple-700"
                        : "w-1.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
