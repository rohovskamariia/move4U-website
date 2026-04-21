import { useEffect, useRef, useState, useCallback, type TouchEvent } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS } from "@/data/constants";
import customersImg from "@/assets/reviews/move4u_real_move.png";

const AUTO_ROTATE_MS = 6000;
const RESUME_AFTER_MS = 8000;
const SWIPE_THRESHOLD_PX = 40;

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

  // Pause helper — resumes auto-rotation after a short idle
  const pauseTemporarily = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_MS);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }, []);

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

  // Helper for stacked-card offsets — relative position to active.
  // returns 0 (active), 1 (one behind), 2 (two behind), -1 (skip)
  const relativePos = (idx: number): number => {
    const diff = (idx - active + total) % total;
    if (diff === 0) return 0;
    if (diff === 1) return 1;
    if (diff === 2) return 2;
    return -1;
  };

  return (
    <section
      id="reviews"
      className="relative py-9 sm:py-20 bg-gradient-to-b from-[#faf8fd] via-purple-50/40 to-white overflow-hidden"
    >
      {/* Subtle ambient purple glow behind the whole section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 50%, rgba(74,49,156,0.10) 0%, rgba(74,49,156,0) 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-12">
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

        {/* ============ DESKTOP: split image + stacked carousel ============ */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-10 items-center">
          {/* LEFT — clean independent image, no text overlay */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* soft purple backlight */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[2rem] blur-2xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 30% 40%, rgba(74,49,156,0.28), transparent 70%)",
                }}
              />
              <div className="relative rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_30px_70px_-30px_rgba(74,49,156,0.45)]">
                <img
                  src={customersImg}
                  alt="Happy Move4U customers smiling after a successful move in London"
                  className="w-full h-[460px] object-cover"
                  loading="lazy"
                />
              </div>
              {/* small floating rating badge — subtle social proof */}
              <div className="absolute -bottom-5 left-6 bg-white rounded-2xl px-4 py-3 shadow-[0_18px_40px_-18px_rgba(17,12,46,0.25)] ring-1 ring-gray-100 flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="text-[12px] leading-tight">
                  <p className="font-semibold text-gray-900">4.9 / 5</p>
                  <p className="text-gray-500">Hundreds of moves</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — stacked carousel (layered cards, visible back stack) */}
          <div className="lg:col-span-7">
            <div
              className="relative h-[360px] [perspective:1400px] flex items-center justify-center"
              onMouseEnter={() => {
                if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
                setPaused(true);
              }}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Backlight glow centered behind active card */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 flex items-center justify-center"
              >
                <div
                  className="w-[78%] h-[78%] rounded-full blur-3xl opacity-70"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(74,49,156,0.30), rgba(74,49,156,0) 70%)",
                  }}
                />
              </div>

              {REVIEWS.map((review, idx) => {
                const pos = relativePos(idx);
                if (pos < 0) return null;
                // Layered stack — back cards peek UP and slightly to the side
                // so they're clearly visible behind the active card. Front
                // card is full-size; back cards are smaller and faded.
                const styles: React.CSSProperties =
                  pos === 0
                    ? {
                        transform: "translate3d(0, 0, 0) scale(1)",
                        opacity: 1,
                        zIndex: 30,
                        filter: "none",
                      }
                    : pos === 1
                      ? {
                          transform:
                            "translate3d(28px, -26px, 0) scale(0.93)",
                          opacity: 0.7,
                          zIndex: 20,
                          filter: "blur(0.3px)",
                        }
                      : {
                          transform:
                            "translate3d(56px, -50px, 0) scale(0.86)",
                          opacity: 0.45,
                          zIndex: 10,
                          filter: "blur(0.6px)",
                        };

                return (
                  <article
                    key={review.id}
                    aria-hidden={pos !== 0}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] max-w-[420px] bg-white rounded-3xl p-6 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-20px_rgba(74,49,156,0.35)] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:transform,opacity]"
                    style={{
                      ...styles,
                      transform: `translate(-50%, -50%) ${styles.transform}`,
                    }}
                    data-testid={`review-desktop-${review.id}`}
                  >
                    <Quote
                      className="w-7 h-7 text-purple-200 -mt-0.5 -ml-0.5 mb-2"
                      aria-hidden="true"
                      fill="currentColor"
                    />
                    <blockquote className="text-gray-800 text-[14px] leading-[1.6] font-normal mb-5 flex-1 line-clamp-5">
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
                        <p className="text-gray-400 text-[11.5px] mt-0.5 truncate">{review.location}</p>
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
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    prev();
                    pauseTemporarily();
                  }}
                  className="w-10 h-10 rounded-full bg-white ring-1 ring-gray-200 hover:ring-purple-300 hover:text-purple-700 text-gray-500 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Previous review"
                  data-testid="reviews-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    next();
                    pauseTemporarily();
                  }}
                  className="w-10 h-10 rounded-full bg-white ring-1 ring-gray-200 hover:ring-purple-300 hover:text-purple-700 text-gray-500 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Next review"
                  data-testid="reviews-next"
                >
                  <ChevronRight className="w-5 h-5" />
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
                      i === active ? "w-7 bg-purple-700" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============ MOBILE / TABLET: image on top, stacked single-card carousel ============ */}
        <div className="lg:hidden">
          {/* compact top visual */}
          <div className="relative mb-7 sm:mb-9">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -z-10 rounded-3xl blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(74,49,156,0.22), transparent 70%)",
              }}
            />
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-purple-100/70 shadow-[0_20px_50px_-22px_rgba(74,49,156,0.4)]">
              <img
                src={customersImg}
                alt="Happy Move4U customers after a successful move"
                className="w-full h-44 sm:h-72 object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Stacked carousel — centered layered cards, swipeable */}
          <div
            className="relative h-[260px] sm:h-[290px] flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            data-testid="reviews-mobile-stack"
          >
            {/* backlight glow */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div
                className="w-[80%] h-[80%] rounded-full blur-3xl opacity-60"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(74,49,156,0.25), rgba(74,49,156,0) 70%)",
                }}
              />
            </div>

            {REVIEWS.map((review, idx) => {
              const pos = relativePos(idx);
              if (pos < 0 || pos > 1) return null; // mobile: only active + 1 behind
              const styles: React.CSSProperties =
                pos === 0
                  ? {
                      transform: "translate3d(0, 0, 0) scale(1)",
                      opacity: 1,
                      zIndex: 30,
                    }
                  : {
                      transform: "translate3d(16px, -18px, 0) scale(0.94)",
                      opacity: 0.6,
                      zIndex: 20,
                      filter: "blur(0.3px)",
                    };

              return (
                <article
                  key={review.id}
                  aria-hidden={pos !== 0}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.06),_0_22px_44px_-18px_rgba(74,49,156,0.35)] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:transform,opacity]"
                  style={{
                    ...styles,
                    transform: `translate(-50%, -50%) ${styles.transform}`,
                  }}
                  data-testid={`review-mobile-${review.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Quote
                      className="w-5 h-5 sm:w-6 sm:h-6 text-purple-200"
                      aria-hidden="true"
                      fill="currentColor"
                    />
                    <span className="inline-flex items-center gap-1 text-[11.5px] sm:text-[12.5px] font-semibold text-gray-700 tabular-nums">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  <blockquote className="text-gray-800 text-[13.5px] sm:text-[14.5px] leading-[1.55] font-normal mb-3 flex-1 line-clamp-5 sm:line-clamp-none">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>

                  <footer className="flex items-center gap-2.5 pt-2.5 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200/70 text-purple-700 flex items-center justify-center font-semibold text-[12px] ring-1 ring-purple-200/40 shrink-0">
                      {review.name.charAt(0)}
                    </div>
                    <p className="text-[12.5px] text-gray-700 truncate min-w-0">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      <span className="text-gray-400"> · {review.location}</span>
                    </p>
                  </footer>
                </article>
              );
            })}
          </div>

          {/* Mobile dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
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
                  i === active ? "w-6 bg-purple-700" : "w-1.5 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
