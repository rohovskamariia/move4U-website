import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SLIDES, CONTACT, type SlideButton } from "@/data/constants";

// Hero slider — auto-advances every 6 seconds with a smooth crossfade.
// Edit slide content and images in src/data/constants.ts
export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const handleAction = (action: SlideButton["action"]) => {
    if (action === "book") setLocation("/book");
    else if (action === "quote") setLocation("/book?action=quote");
    else if (action === "call") {
      window.location.href = `tel:${CONTACT.driver}`;
    }
  };

  const slide = SLIDES[current];

  return (
    // min-h on mobile pins the hero to a stable height so swapping
    // slides (whose title/text lengths differ) never reflows the page.
    // Desktop keeps content-driven sizing.
    <div className="relative bg-gray-900 text-white overflow-hidden min-h-[460px] sm:min-h-0">
      {/* Stacked background images — crossfade between slides. No blur, sharp originals. */}
      <div className="absolute inset-0">
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
              alt=""
              /* On mobile we widen the visible portion of the photograph
                 by switching to object-contain-ish behaviour via a slight
                 scale-down on the container (see hero-img-mobile in
                 index.css), so the subject doesn't feel cropped/zoomed. */
              className="hero-img-mobile w-full h-full object-cover"
              style={{
                objectPosition: s.imagePosition ?? "center",
                ...(s.imageFilter
                  ? { filter: s.imageFilter, transform: "scale(1.015)" }
                  : {}),
              }}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              {...(i === 0 ? { fetchPriority: "high" as const } : { fetchPriority: "low" as const })}
            />
          </div>
        ))}
      </div>

      {/* Soft neutral readability gradient — only darkens the left edge
          where the headline sits, then fades quickly so the photograph
          stays clean, sharp and natural across the rest of the frame.
          No purple tint — the brand colour lives in the CTAs, not on top
          of the photo. */}
      <div
        className="hero-grad-desktop absolute inset-0 pointer-events-none hidden sm:block"
        style={{
          background:
            "linear-gradient(100deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.32) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.02) 78%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* Mobile readability scrim — the headline spans the full width on
          phones, so we apply an even top-to-bottom darken instead of a
          left-only one. Strong enough at the top for white text to read
          cleanly, fades to nothing past the buttons. */}
      <div
        className="absolute inset-0 pointer-events-none sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Whisper-thin bottom vignette so the dot indicators stay readable */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 100%)",
        }}
      />

      {/* Mobile: top-aligned, compact padding, left-aligned text.
          Desktop: unchanged — vertically centred with generous padding. */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:py-32 md:py-36 min-h-[460px] sm:min-h-0 flex flex-col items-start justify-start sm:block">
        {/* Mobile: text sits in the upper-middle area (pt-16 above + the
            min-h on the container keeps total height stable). Buttons
            are absolutely positioned at a fixed bottom offset further
            down, so they stay at the SAME vertical position on every
            slide regardless of how many lines the headline / body
            text take. Desktop layout untouched. */}
        <div className="max-w-2xl w-full text-left sm:block">
          {/* Slide content — re-keyed so each change replays the
              staggered rise-in for headline / subtext / buttons. */}
          <div key={slide.id} className="hero-stagger">
            {/* Eyebrow slot — always rendered so the headline lands at
                the same vertical position on every slide. When a slide
                has no subtitle we render an invisible placeholder of
                the same height to keep the layout perfectly stable. */}
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
              className="text-[30px] sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-3 sm:mb-5"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-white/90 text-[14.5px] sm:text-lg md:text-xl mb-5 sm:mb-8 leading-snug sm:leading-relaxed max-w-xl"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {slide.text}
            </p>
            <div className="absolute bottom-20 left-4 right-4 sm:static sm:left-auto sm:right-auto sm:bottom-auto flex flex-wrap gap-2.5 sm:gap-3">
              {slide.buttons.map((btn, i) => {
                const isPrimary = btn.variant === "primary";
                return (
                  <button
                    key={`${slide.id}-${i}`}
                    onClick={() => handleAction(btn.action)}
                    className={
                      isPrimary
                        ? "btn-purple inline-flex items-center justify-center font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-[13.5px] sm:text-base shadow-[0_8px_22px_-8px_rgba(61,18,137,0.6)]"
                        : /* Secondary CTA: solid white-on-mobile so it
                             never looks weak against the photograph;
                             reverts to translucent glass on desktop. */
                          "inline-flex items-center justify-center bg-white text-purple-800 sm:bg-white/10 sm:backdrop-blur-sm sm:text-white font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full border border-white sm:border-white/60 hover:bg-purple-50 sm:hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-[13.5px] sm:text-base shadow-[0_8px_22px_-12px_rgba(0,0,0,0.5)] sm:shadow-none"
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

        {/* Dots — sit a touch higher on mobile so the rounded white
            services panel can ride up over the hero edge without
            covering them. */}
        <div className="absolute bottom-10 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              data-testid={`slider-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
