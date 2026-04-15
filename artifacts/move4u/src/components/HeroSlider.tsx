import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SLIDES, CONTACT } from "@/data/constants";

// Hero slider — auto-advances every 4.5 seconds
// Edit slide content in src/data/constants.ts
export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const handleAction = (action: string) => {
    if (action === "book") setLocation("/book");
    else if (action === "quote") setLocation("/book?action=quote");
    else if (action === "call") {
      window.location.href = `tel:${CONTACT.driver}`;
    }
  };

  const slide = SLIDES[current];

  return (
    <div className="relative bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white" style={{ transform: "translate(-30%, -30%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white" style={{ transform: "translate(30%, 30%)" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-32">
        <div className="max-w-2xl">
          {/* Slide content */}
          <div key={slide.id} className="animate-fade-in">
            <p className="text-purple-200 font-medium text-sm sm:text-base uppercase tracking-wider mb-3">
              {slide.subtitle}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              {slide.title}
            </h1>
            <p className="text-purple-100 text-base sm:text-lg mb-8 leading-relaxed">
              {slide.text}
            </p>
            <button
              onClick={() => handleAction(slide.buttonAction)}
              className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-md text-sm sm:text-base"
              data-testid={`slide-cta-${slide.id}`}
            >
              {slide.buttonText}
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
          aria-label="Previous slide"
          data-testid="slider-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
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
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/40"
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
