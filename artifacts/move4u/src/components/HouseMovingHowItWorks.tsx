import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * HouseMovingHowItWorks
 *
 * Step slider/carousel used ONLY on the /house-moving page. Intentionally
 * isolated from the homepage "How It Works" section so future tweaks here
 * cannot affect the homepage layout.
 *
 * Behaviour:
 *   - Shows ONE step at a time (Step 1 → 2 → 3).
 *   - Auto-advances every AUTOPLAY_MS while idle.
 *   - User can swipe left/right (touch + mouse drag), use the chevron
 *     arrows, or tap the dots to jump to a specific step.
 *   - Auto-play pauses while the user is interacting (pointer down,
 *     keyboard focus, hover) and resumes ~6s after the last interaction.
 *   - Respects prefers-reduced-motion (no auto-play, no slide animation).
 *   - Mobile-first: compact card height, large tap targets, full-width
 *     swipe area. Desktop reuses the same compact card centred in the
 *     section so the design feels consistent across breakpoints.
 */

type Step = {
  n: number;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Enter your addresses",
    text: "Tell us where you're moving from and to — postcodes or full addresses both work.",
  },
  {
    n: 2,
    title: "Get your quote",
    text: "See your van size, hourly rate and any helper add-ons up front. No hidden fees.",
  },
  {
    n: 3,
    title: "We handle your move",
    text: "Our team arrives on time, loads carefully and gets you settled into your new place.",
  },
];

const AUTOPLAY_MS = 5500;
const RESUME_AFTER_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export default function HouseMovingHowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Pointer/swipe state lives in refs so we don't re-render on every move.
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);
  const draggingRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  /* ---------- prefers-reduced-motion ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ---------- auto-advance ---------- */
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion]);

  // Helper: pause autoplay during interaction, then resume after a delay.
  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, RESUME_AFTER_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  /* ---------- navigation ---------- */
  const goTo = useCallback(
    (i: number) => {
      setActive(((i % STEPS.length) + STEPS.length) % STEPS.length);
      pauseThenResume();
    },
    [pauseThenResume],
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  /* ---------- swipe / drag ---------- */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only react to primary button (mouse) or touch / pen.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDeltaRef.current = 0;
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragStartXRef.current === null) return;
    dragDeltaRef.current = e.clientX - dragStartXRef.current;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const delta = dragDeltaRef.current;
    dragDeltaRef.current = 0;
    dragStartXRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already have been released — safe to ignore
    }
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta < 0) {
        next();
      } else {
        prev();
      }
    } else {
      // No real swipe — let autoplay resume on the standard timer.
      pauseThenResume();
    }
  };

  return (
    <section
      className="py-8 sm:py-14 bg-white"
      aria-label="How house moving works with Move4U"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-5 sm:mb-8">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2">
            HOW IT WORKS
          </p>
          <h2 className="text-[22px] sm:text-[28px] font-bold text-gray-900 tracking-tight">
            Three simple steps
          </h2>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          /* Pause while hovered/focused. When the cursor leaves or focus
             moves out, we don't restart autoplay immediately — instead
             we schedule a delayed resume so the user always has a beat
             to read the slide they just settled on. This matches the
             behaviour of the click/tap/swipe paths. */
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={pauseThenResume}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={pauseThenResume}
        >
          {/* Slide viewport */}
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-purple-100/70 bg-gradient-to-br from-white to-[#faf8fd] shadow-[0_18px_40px_-22px_rgba(74,49,156,0.25)] touch-pan-y select-none"
            role="region"
            aria-roledescription="carousel"
            aria-label="House moving steps"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* Track — translates to expose the active slide.
                Disabled when reduced-motion is set (snap, no animation). */}
            <div
              className={
                "flex w-full" +
                (reducedMotion ? "" : " transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]")
              }
              style={{ transform: `translateX(-${active * 100}%)` }}
              aria-live="polite"
            >
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="shrink-0 w-full px-6 sm:px-10 py-7 sm:py-10"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Step ${s.n} of ${STEPS.length}`}
                  aria-hidden={i !== active}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Step badge */}
                    <div
                      className="mb-4 sm:mb-5 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white font-bold text-[18px] sm:text-[20px] shadow-[0_10px_24px_-10px_rgba(74,49,156,0.55)]"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                      }}
                      aria-hidden="true"
                    >
                      {s.n}
                    </div>
                    <p className="text-[10.5px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5">
                      STEP {s.n} OF {STEPS.length}
                    </p>
                    <h3 className="text-[18px] sm:text-[22px] font-semibold text-gray-900 tracking-tight mb-2">
                      {s.title}
                    </h3>
                    <p className="text-gray-600 text-[14px] sm:text-[15px] leading-relaxed max-w-md">
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrows — overlaid, anchored vertically centred. Hidden on
                very narrow screens to leave the slide breathing room; the
                user can still swipe + tap dots there. */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous step"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/95 ring-1 ring-purple-100 text-purple-700 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.35)] hover:bg-white hover:text-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              data-testid="house-moving-steps-prev"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next step"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/95 ring-1 ring-purple-100 text-purple-700 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.35)] hover:bg-white hover:text-purple-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              data-testid="house-moving-steps-next"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Dots */}
          <div
            className="mt-4 sm:mt-5 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Select step"
          >
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.n}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to step ${s.n}`}
                  onClick={() => goTo(i)}
                  className={
                    "h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 " +
                    (isActive
                      ? "w-6 bg-purple-700"
                      : "w-2 bg-purple-200 hover:bg-purple-300")
                  }
                  data-testid={`house-moving-steps-dot-${s.n}`}
                />
              );
            })}
          </div>

          {/* Mobile-only arrow row — keeps tap targets accessible on small
              screens where the overlaid arrows are hidden. */}
          <div className="sm:hidden mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous step"
              className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-purple-100 text-purple-700 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.25)] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              data-testid="house-moving-steps-prev-mobile"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next step"
              className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-purple-100 text-purple-700 shadow-[0_6px_16px_-6px_rgba(74,49,156,0.25)] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              data-testid="house-moving-steps-next-mobile"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
