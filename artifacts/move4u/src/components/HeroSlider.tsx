import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SLIDES, CONTACT, type SlideButton } from "@/data/constants";

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 45;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [, setLocation] = useLocation();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean>(false);
  const draggingRef = useRef<boolean>(false);
  // Latest horizontal delta — kept in a ref so onPointerEnd can read the
  // most recent value synchronously, avoiding stale-state misses on fast
  // flicks (React batches setDragOffset updates).
  const latestDxRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startAutoAdvance = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
  }, []);

  const stopAutoAdvance = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return stopAutoAdvance;
  }, [startAutoAdvance, stopAutoAdvance]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
      startAutoAdvance();
    },
    [startAutoAdvance],
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  const handleAction = (action: SlideButton["action"]) => {
    if (action === "book") setLocation("/book");
    else if (action === "quote") setLocation("/book?action=quote");
    else if (action === "call") {
      window.location.href = `tel:${CONTACT.driver}`;
    }
  };

  // ----- Touch / pointer swipe handlers -----------------------------------
  // Works for both touch (mobile) and mouse drag (desktop). We track only
  // horizontal movement; if the user is clearly scrolling vertically we
  // disengage so the page can scroll naturally.
  const onPointerDown = (clientX: number, clientY: number) => {
    pointerStartX.current = clientX;
    pointerStartY.current = clientY;
    isHorizontalSwipe.current = false;
    draggingRef.current = true;
    latestDxRef.current = 0;
    stopAutoAdvance();
  };

  const onPointerMove = (clientX: number, clientY: number) => {
    if (!draggingRef.current || pointerStartX.current === null || pointerStartY.current === null) return;
    const dx = clientX - pointerStartX.current;
    const dy = clientY - pointerStartY.current;
    if (!isHorizontalSwipe.current) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(dy) > 8) {
        // Vertical scroll — give up, let the page scroll.
        draggingRef.current = false;
        setDragOffset(0);
        return;
      }
    }
    if (isHorizontalSwipe.current) {
      // Soft rubber-band so the drag feels alive without exposing seams.
      const width = containerRef.current?.clientWidth ?? 1;
      const limited = Math.max(-width * 0.5, Math.min(width * 0.5, dx));
      latestDxRef.current = limited;
      setDragOffset(limited);
    }
  };

  const onPointerEnd = () => {
    if (!draggingRef.current) {
      startAutoAdvance();
      return;
    }
    draggingRef.current = false;
    // Read from ref, not state, so a fast flick whose final move event
    // hasn't yet flushed through React's batched updates still counts.
    const offset = latestDxRef.current;
    latestDxRef.current = 0;
    setDragOffset(0);
    if (isHorizontalSwipe.current && Math.abs(offset) > SWIPE_THRESHOLD_PX) {
      if (offset < 0) next();
      else prev();
    } else {
      startAutoAdvance();
    }
    pointerStartX.current = null;
    pointerStartY.current = null;
    isHorizontalSwipe.current = false;
  };

  const slide = SLIDES[current];

  return (
    // Stable height on every breakpoint — slides have different title/text
    // lengths, so without a locked height the container resizes between
    // slides and the background image visibly "jumps". Mobile keeps its
    // existing 460px floor; desktop now also has a floor so the photo
    // stays anchored regardless of which slide is showing.
    <div
      ref={containerRef}
      className="relative bg-gray-900 text-white overflow-hidden min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[560px] select-none"
      // Let the browser own vertical scroll; we own horizontal swipe.
      // This both improves perceived smoothness and tells the browser it
      // does not need to wait for our handlers to decide on scroll.
      style={{ touchAction: "pan-y" }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        onPointerDown(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        onPointerMove(t.clientX, t.clientY);
      }}
      onTouchEnd={onPointerEnd}
      onTouchCancel={onPointerEnd}
      onMouseDown={(e) => {
        // Only respond to primary button. Avoid hijacking clicks on
        // interactive children (buttons, links).
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, a")) return;
        onPointerDown(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (!draggingRef.current) return;
        onPointerMove(e.clientX, e.clientY);
      }}
      onMouseUp={onPointerEnd}
      onMouseLeave={() => {
        if (draggingRef.current) onPointerEnd();
      }}
    >
      {/* Stacked background images — crossfade between slides. The image
          stack itself never moves; we only fade opacity so the photograph
          stays perfectly anchored. A small horizontal translate is applied
          while the user is actively swiping for tactile feedback. */}
      <div
        className="absolute inset-0"
        style={{
          transform: dragOffset !== 0 ? `translate3d(${dragOffset * 0.25}px, 0, 0)` : undefined,
          transition: draggingRef.current ? "none" : "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== current}
          >
            <img
              src={s.image}
              alt={`${s.title} — Move4U London removals and man and van service`}
              /* Always fill the container exactly — width/height + object-cover
                 plus a fixed container height means zero CLS and zero shift
                 between slides. */
              className="hero-img-mobile w-full h-full object-cover"
              width={1920}
              height={1080}
              style={{
                objectPosition: s.imagePosition ?? "center",
                ...(s.imageFilter
                  ? { filter: s.imageFilter, transform: "scale(1.015)" }
                  : {}),
              }}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              {...(i === 0 ? { fetchPriority: "high" as const } : { fetchPriority: "low" as const })}
            />
          </div>
        ))}
      </div>

      {/* Soft neutral readability gradient — only darkens the left edge
          where the headline sits, then fades quickly so the photograph
          stays clean, sharp and natural across the rest of the frame. */}
      <div
        className="hero-grad-desktop absolute inset-0 pointer-events-none hidden sm:block"
        style={{
          background:
            "linear-gradient(100deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.02) 78%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* Mobile readability scrim */}
      <div
        className="absolute inset-0 pointer-events-none sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Bottom vignette so the dot indicators stay readable */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 100%)",
        }}
      />

      {/* Content. Desktop now uses min-h matching the outer container with
          flex centering, so text is vertically centered regardless of how
          many lines a slide's title/body wraps to. */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:py-0 min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[560px] flex flex-col items-start justify-start sm:justify-center">
        <div className="max-w-2xl w-full text-left">
          <div key={slide.id} className="hero-stagger">
            {slide.subtitle ? (
              <p
                className="text-white/90 font-semibold text-[11px] sm:text-sm uppercase tracking-[0.18em] mb-2 sm:mb-4"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}
              >
                {slide.subtitle}
              </p>
            ) : (
              <p
                aria-hidden="true"
                className="invisible select-none font-semibold text-[11px] sm:text-sm uppercase tracking-[0.18em] mb-2 sm:mb-4"
              >
                &nbsp;
              </p>
            )}
            <h1
              className="text-[30px] sm:text-[40px] md:text-[44px] lg:text-5xl font-bold leading-[1.1] tracking-tight mb-3 sm:mb-4"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-white/90 text-[14.5px] sm:text-base md:text-lg mb-5 sm:mb-7 leading-snug sm:leading-relaxed max-w-xl"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {slide.text}
            </p>
            <div className="absolute bottom-[92px] left-4 right-4 sm:static sm:left-auto sm:right-auto sm:bottom-auto flex flex-wrap gap-2.5 sm:gap-3">
              {slide.buttons.map((btn, i) => {
                const isPrimary = btn.variant === "primary";
                return (
                  <button
                    key={`${slide.id}-${i}`}
                    onClick={() => handleAction(btn.action)}
                    className={
                      isPrimary
                        ? "btn-purple inline-flex items-center justify-center font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-[13.5px] sm:text-base shadow-[0_8px_22px_-8px_rgba(61,18,137,0.6)]"
                        : "inline-flex items-center justify-center bg-white text-purple-800 font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full border border-white hover:bg-purple-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-[13.5px] sm:text-base shadow-[0_8px_22px_-12px_rgba(0,0,0,0.5)]"
                    }
                    data-testid={`slide-${slide.id}-cta-${i}`}
                  >
                    {btn.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2.5 rounded-full transition-colors items-center justify-center"
          aria-label="Previous slide"
          data-testid="slider-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2.5 rounded-full transition-colors items-center justify-center"
          aria-label="Next slide"
          data-testid="slider-next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots — each button is a true 44×44 hit target (mobile a11y
            minimum) with the small visible pill centred inside. We
            negate the wrapper's vertical/horizontal padding via -mx/-my
            so the visual rhythm of the dots row stays unchanged. */}
        <div className="absolute bottom-4 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              type="button"
              className="group inline-flex items-center justify-center w-11 h-11 -mx-1.5"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
              data-testid={`slider-dot-${i}`}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-8" : "bg-white/40 w-2 group-hover:bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
