import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BadgePoundSterling, MapPin, Truck } from "lucide-react";

/**
 * HouseMovingHowItWorks
 *
 * Three-step "How it works" section for /house-moving.
 *
 * Behaviour mirrors /waste-removal exactly:
 *   - MOBILE (`<sm`): one-step-at-a-time carousel with autoplay + swipe + dots.
 *   - DESKTOP (`sm+`): static 3-step horizontal layout with icon circles,
 *     numbered badges, a thin dashed connector and a subtle hover lift —
 *     identical visual treatment to WasteRemovalHowItWorks so the two
 *     service pages feel like one product family.
 *
 * The carousel state machine still runs on desktop (it's cheap and we
 * keep it for prefers-reduced-motion correctness), but the carousel
 * markup is hidden via `sm:hidden` so desktop users always see all
 * three steps at once.
 */

type Step = {
  n: number;
  title: string;
  text: string;
  /** Icon used only by the desktop static layout. */
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Enter your addresses",
    text: "Tell us where you're moving from and to — postcodes or full addresses both work.",
    icon: MapPin,
  },
  {
    n: 2,
    title: "Get your quote",
    text: "See your van size, hourly rate and any helper add-ons up front. No hidden fees.",
    icon: BadgePoundSterling,
  },
  {
    n: 3,
    title: "We handle your move",
    text: "Our team arrives on time, loads carefully and gets you settled into your new place.",
    icon: Truck,
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

        {/* ======================================================
            MOBILE — one-step-at-a-time carousel.
            Hidden on sm+ so desktop users get the static editorial
            timeline below instead.
            ====================================================== */}
        <div
          className="sm:hidden relative"
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

            {/* No arrow buttons by design — autoplay + swipe + dot taps
                are the only ways to advance. Keeps the section minimal
                and mobile-first. Keyboard arrow keys still work because
                the slide viewport is focusable and listens for them. */}
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

        </div>

        {/* ======================================================
            DESKTOP — static editorial timeline (icon circle, step
            badge, dashed connector). Mirrors WasteRemovalHowItWorks
            exactly so /house-moving and /waste-removal feel like
            one product family at desktop width.

            Subtle hover lift on each step (`hover:-translate-y-0.5`
            + ring darkening) keeps the layout otherwise flat and
            premium. ====================================================== */}
        <ol className="hidden sm:grid sm:grid-cols-3 gap-6 lg:gap-10 relative">
          <span
            aria-hidden="true"
            className="absolute top-[27px] left-[16.6%] right-[16.6%] border-t-2 border-dashed border-purple-200"
          />
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="relative text-center px-2 group"
                data-testid={`house-step-${s.n}`}
              >
                <div className="relative z-10 mx-auto w-[54px] h-[54px] rounded-full bg-white ring-2 ring-purple-200 shadow-[0_8px_22px_-8px_rgba(74,49,156,0.45)] flex items-center justify-center mb-4 transition-transform transition-shadow duration-200 ease-out group-hover:-translate-y-0.5 group-hover:ring-purple-300 group-hover:shadow-[0_14px_30px_-10px_rgba(74,49,156,0.55)]">
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center shadow-[0_3px_8px_-2px_rgba(74,49,156,0.55)]">
                    {s.n}
                  </span>
                  <Icon
                    className="w-6 h-6 text-purple-700"
                    strokeWidth={2.25}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15.5px] tracking-tight mb-1">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-[260px] mx-auto">
                  {s.text}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
