import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BadgePoundSterling, Recycle, Truck } from "lucide-react";

/**
 * WasteRemovalHowItWorks
 *
 * Three-step "How it works" section for /waste-removal.
 *
 * Behaviour mirrors /house-moving:
 *   - MOBILE: a one-step-at-a-time carousel with autoplay + swipe + dots
 *     (same interaction model as HouseMovingHowItWorks).
 *   - DESKTOP: a clean horizontal editorial timeline (dashed connectors
 *     between numbered chips) — kept as-is per the design brief.
 *
 * The two layouts share the SAME step data so the only thing that
 * changes across breakpoints is presentation, not content.
 */

type Step = {
  n: number;
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Enter your address",
    text: "Tell us where the collection is and what needs to go.",
    icon: Recycle,
  },
  {
    n: 2,
    title: "Get a fixed quote",
    text: "We estimate based on size and type of waste — no surprises.",
    icon: BadgePoundSterling,
  },
  {
    n: 3,
    title: "We collect and remove",
    text: "Our team arrives, loads everything and clears the space.",
    icon: Truck,
  },
];

const AUTOPLAY_MS = 5500;
const RESUME_AFTER_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export default function WasteRemovalHowItWorks() {
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
      pauseThenResume();
    }
  };

  return (
    <section
      className="py-8 sm:py-14 bg-white"
      aria-label="How waste removal works with Move4U"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Heading — identical typography to /house-moving so the two
            service pages feel like one product family. */}
        <div className="text-center mb-5 sm:mb-8">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-1.5 sm:mb-2">
            HOW IT WORKS
          </p>
          <h2 className="text-[22px] sm:text-[28px] font-bold text-gray-900 tracking-tight">
            Three simple steps
          </h2>
        </div>

        {/* ======================================================
            MOBILE — one-at-a-time carousel.
            Auto-advance + swipe + dot taps, identical UX to the
            HouseMovingHowItWorks mobile carousel.
            ====================================================== */}
        <div
          className="sm:hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={pauseThenResume}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={pauseThenResume}
        >
          <div
            className="relative overflow-hidden rounded-2xl ring-1 ring-purple-100/70 bg-gradient-to-br from-white to-[#faf8fd] shadow-[0_18px_40px_-22px_rgba(74,49,156,0.25)] touch-pan-y select-none"
            role="region"
            aria-roledescription="carousel"
            aria-label="Waste removal steps"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className={
                "flex w-full" +
                (reducedMotion
                  ? ""
                  : " transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]")
              }
              style={{ transform: `translateX(-${active * 100}%)` }}
              aria-live="polite"
            >
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="shrink-0 w-full px-6 py-7"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Step ${s.n} of ${STEPS.length}`}
                  aria-hidden={i !== active}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-[18px] shadow-[0_10px_24px_-10px_rgba(74,49,156,0.55)]"
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
                    <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight mb-2">
                      {s.title}
                    </h3>
                    <p className="text-gray-600 text-[14px] leading-relaxed max-w-md">
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div
            className="mt-4 flex items-center justify-center gap-2"
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
                  data-testid={`waste-removal-steps-dot-${s.n}`}
                />
              );
            })}
          </div>
        </div>

        {/* ======================================================
            DESKTOP — horizontal editorial timeline (dashed
            connectors between numbered chips). Kept minimal per
            the brief: not card-heavy.
            ====================================================== */}
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
                data-testid={`waste-step-${s.n}`}
              >
                {/* Hover lift kept identical to HouseMovingHowItWorks
                    so the two pages share the exact same micro-interaction. */}
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
