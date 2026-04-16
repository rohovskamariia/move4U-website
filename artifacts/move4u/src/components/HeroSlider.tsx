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
    <div className="relative bg-gray-900 text-white overflow-hidden">
      {/* Stacked background images — crossfade between slides */}
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
              className="w-full h-full object-cover"
              style={{ filter: "blur(2px)" }}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Purple gradient overlay — left dark purple, fading to transparent on the right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(88,28,135,0.85) 0%, rgba(88,28,135,0.45) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Subtle bottom darken so dots/arrows always read */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 md:py-36">
        <div className="max-w-2xl">
          {/* Slide content — re-keyed so each change replays the fade */}
          <div key={slide.id} className="animate-fade-in-up">
            {slide.subtitle && (
              <p
                className="text-white/90 font-semibold text-xs sm:text-sm uppercase tracking-[0.18em] mb-4"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
              >
                {slide.subtitle}
              </p>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-5"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-white/90 text-base sm:text-lg md:text-xl mb-8 leading-relaxed max-w-xl"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
            >
              {slide.text}
            </p>
            <div className="flex flex-wrap gap-3">
              {slide.buttons.map((btn, i) => {
                const isPrimary = btn.variant === "primary";
                return (
                  <button
                    key={`${slide.id}-${i}`}
                    onClick={() => handleAction(btn.action)}
                    className={
                      isPrimary
                        ? "inline-flex items-center justify-center bg-white text-gray-900 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-lg shadow-black/10 text-sm sm:text-base"
                        : "inline-flex items-center justify-center bg-transparent text-white font-semibold px-6 py-3 rounded-full border border-white/70 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm sm:text-base"
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

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
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
