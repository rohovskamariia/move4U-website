// DESIGN PREVIEW — Visit /preview to review this proposed redesign.
// This file does NOT affect the live homepage at "/".
// Delete or keep after approval — up to you.

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight,
  ShieldCheck, BadgePoundSterling, Zap, CalendarClock,
  FileText, Calendar, CheckCircle2, Truck,
  Home, Trash2, Building2, Package, Globe, HelpCircle,
  ArrowRight, Star, ExternalLink, MapPin, Clock, Users,
} from "lucide-react";
import { SLIDES, SERVICES, CONTACT } from "@/data/constants";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

// ─── Fade-up on scroll ────────────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: number | null = null;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          t = window.setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (t !== null) window.clearTimeout(t);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(22px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
    >
      {children}
    </div>
  );
}

// ─── Preview badge (floating, non-intrusive) ──────────────────────────────────
function PreviewBadge() {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2 bg-[#0f0c1a]/95 backdrop-blur-sm text-white text-[12px] font-semibold px-5 py-2.5 rounded-full shadow-2xl ring-1 ring-white/10 pointer-events-none select-none">
      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" style={{ boxShadow: "0 0 6px rgba(251,191,36,0.7)", animation: "pulse 2s infinite" }} />
      DESIGN PREVIEW — not the live homepage
    </div>
  );
}

// ─── Improved hero slider ─────────────────────────────────────────────────────
const AUTO_MS = 6000;

function PreviewHeroSlider() {
  const [current, setCurrent] = useState(0);
  const [, setLocation] = useLocation();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((p) => (p + 1) % SLIDES.length), AUTO_MS);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = useCallback(
    (i: number) => {
      setCurrent(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
      startTimer();
    },
    [startTimer],
  );

  const handleAction = (action: "book" | "quote" | "call") => {
    if (action === "book") setLocation("/book");
    else if (action === "quote") setLocation("/book?action=quote");
    else window.location.href = `tel:${CONTACT.driver}`;
  };

  const slide = SLIDES[current];

  return (
    <div className="relative bg-gray-900 text-white overflow-hidden min-h-[530px] sm:min-h-[590px] md:min-h-[630px] lg:min-h-[700px] select-none">
      {/* Background images — same crossfade as original */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== current}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: s.imagePosition ?? "center" }}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
          />
        </div>
      ))}

      {/* Desktop overlay — much stronger left gradient so text pops cleanly */}
      <div
        className="absolute inset-0 pointer-events-none hidden sm:block"
        style={{
          background:
            "linear-gradient(108deg, rgba(10,7,20,0.85) 0%, rgba(10,7,20,0.68) 28%, rgba(10,7,20,0.30) 52%, rgba(10,7,20,0.06) 76%, transparent 100%)",
        }}
      />
      {/* Mobile overlay — top-weighted so headline & CTA above fold are readable */}
      <div
        className="absolute inset-0 pointer-events-none sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,7,20,0.82) 0%, rgba(10,7,20,0.68) 38%, rgba(10,7,20,0.38) 68%, rgba(10,7,20,0.12) 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(10,7,20,0.25) 100%)" }}
      />

      {/* Content — desktop: vertically centred. Mobile: near-top so headline + CTA are above the fold */}
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 flex flex-col justify-start sm:justify-center min-h-[530px] sm:min-h-[590px] md:min-h-[630px] lg:min-h-[700px] pt-[88px] pb-20 sm:pt-0 sm:pb-0">
        <div className="max-w-[640px]">
          {/* key forces the fade-in animation to re-run on each slide change */}
          <div key={slide.id} className="preview-hero-stagger">
            {slide.subtitle && (
              <p
                className="text-white/90 font-semibold text-[11px] sm:text-[12px] uppercase tracking-[0.22em] mb-3 sm:mb-4"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
              >
                {slide.subtitle}
              </p>
            )}
            <h1
              className="text-[38px] sm:text-[52px] md:text-[58px] lg:text-[68px] font-bold leading-[1.05] tracking-tight mb-4 sm:mb-5"
              style={{ textShadow: "0 2px 22px rgba(0,0,0,0.55)" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-white/88 text-[15px] sm:text-[17px] mb-7 sm:mb-8 leading-relaxed max-w-lg"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}
            >
              {slide.text}
            </p>
            {/* CTAs flow with text on mobile — no absolute positioning */}
            <div className="flex flex-wrap gap-3">
              {slide.buttons.map((btn, bi) => (
                <button
                  key={bi}
                  onClick={() => handleAction(btn.action)}
                  className={
                    btn.variant === "primary"
                      ? "btn-purple inline-flex items-center justify-center font-semibold px-7 py-3 rounded-full text-[14.5px]"
                      : "inline-flex items-center justify-center bg-white/80 backdrop-blur-sm text-purple-900 font-semibold px-7 py-3 rounded-full border border-white/60 hover:bg-white hover:-translate-y-0.5 transition-all duration-200 text-[14.5px] shadow-md"
                  }
                >
                  {btn.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prev / Next */}
        <button
          onClick={() => goTo(current - 1)}
          className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/22 backdrop-blur-sm text-white p-3 rounded-full transition-colors items-center justify-center"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goTo(current + 1)}
          className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/22 backdrop-blur-sm text-white p-3 rounded-full transition-colors items-center justify-center"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group flex items-center justify-center w-10 h-10 -mx-1.5"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-8" : "bg-white/40 w-2 group-hover:bg-white/65"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .preview-hero-stagger {
          animation: previewHeroIn 0.65s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes previewHeroIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Trust bar (new) ──────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { icon: Users,  label: "100+ happy customers" },
    { icon: MapPin, label: "London & surrounding areas" },
    { icon: Clock,  label: "Same-day slots available" },
    { icon: Zap,    label: "WhatsApp reply in minutes" },
  ];
  return (
    <div className="bg-white border-b border-purple-100/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center sm:justify-between items-center gap-y-2 py-3 sm:py-4">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3 sm:px-0">
              <Icon className="w-[15px] h-[15px] text-purple-600 shrink-0" strokeWidth={2} />
              <span className="text-[12.5px] sm:text-[13px] font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Services (both CTAs preserved, improved card depth + accent) ─────────────
const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Home, Trash2, Building2, Package, Globe, HelpCircle,
};

function PreviewServicesSection() {
  const [, setLocation] = useLocation();

  const navigate = (id: string) => {
    if (id === "house-move") setLocation("/house-moving");
    else if (id === "waste-removal") setLocation("/waste-removal");
    else setLocation(`/book/${id}`);
  };

  return (
    <section
      id="services"
      className="relative z-10 -mt-3 rounded-t-[20px] shadow-[0_-6px_18px_-14px_rgba(76,29,149,0.14)] pt-7 pb-9 sm:mt-0 sm:rounded-none sm:shadow-none sm:pt-16 sm:pb-16"
      style={{
        backgroundImage: "linear-gradient(180deg, #ffffff 0%, #faf8fd 55%, #f5f2fc 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-6 sm:mb-14">
          <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
            WHAT WE OFFER
          </p>
          <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
            Our Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-[13px] sm:text-base leading-relaxed">
            From single items to full house moves — we cover it all across London.
          </p>
        </FadeUp>

        {/* Mobile: unchanged 2×3 icon grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {SERVICES.map((svc) => {
            const Icon = iconMap[svc.icon] || Package;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => navigate(svc.id)}
                className="bg-white rounded-2xl ring-1 ring-purple-100/60 p-3.5 flex flex-col items-center justify-center text-center min-h-[108px] shadow-[0_2px_6px_-2px_rgba(74,49,156,0.08),_0_10px_22px_-12px_rgba(74,49,156,0.18)] active:bg-purple-50/40 active:scale-[0.98] transition-all duration-300"
              >
                <div
                  className="text-white w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.5)]"
                  style={{ backgroundImage: "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)" }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </div>
                <h3 className="font-semibold text-gray-900 text-[12.5px] tracking-tight leading-tight">
                  {svc.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Desktop: improved card — purple left accent on hover, stronger shadow, bolder title */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((svc, idx) => {
            const Icon = iconMap[svc.icon] || Package;
            return (
              <FadeUp key={svc.id} delay={idx * 65}>
                <div className="group relative bg-white rounded-3xl p-6 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.10),_0_18px_40px_-16px_rgba(74,49,156,0.18)] transition-all duration-300 ease-out hover:ring-purple-200 hover:shadow-[0_10px_22px_-6px_rgba(74,49,156,0.22),_0_36px_64px_-20px_rgba(74,49,156,0.44)] hover:-translate-y-2 flex flex-col overflow-hidden">
                  {/* Purple left accent — slides in on hover */}
                  <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-gradient-to-b from-purple-400 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="text-white w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)] transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)" }}
                    >
                      <Icon className="w-[19px] h-[19px]" strokeWidth={2.25} />
                    </div>
                    <span className="text-[10.5px] font-semibold text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-full tracking-wide">
                      {svc.price}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-[17px] mb-1.5 tracking-tight">{svc.title}</h3>
                  <p className="text-gray-500 text-[13.5px] leading-relaxed flex-1 mb-5">{svc.description}</p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => navigate(svc.id)}
                      className="btn-purple flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-3 rounded-full"
                    >
                      {svc.id === "house-move" || svc.id === "waste-removal" ? "Learn More" : "Book"}
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                    <button
                      onClick={() => setLocation(`/book/${svc.id}?action=quote`)}
                      className="flex-1 text-[12.5px] font-semibold text-purple-700 border border-purple-200/80 py-2.5 px-3 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:-translate-y-0.5 transition-all"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works (redesigned — large ghost step numbers) ─────────────────────
function PreviewHowItWorks() {
  const steps = [
    { icon: FileText,     num: "01", title: "Get a Quote",     text: "Tell us what you need and get a quick estimate online or via WhatsApp." },
    { icon: Calendar,     num: "02", title: "Choose Your Time", text: "Pick a date and time that works for you — 7 days a week." },
    { icon: CheckCircle2, num: "03", title: "Confirm Details",  text: "We review your details and contact you to finalise the booking." },
    { icon: Truck,        num: "04", title: "We Get It Done",   text: "Our team arrives and completes the job professionally." },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">PROCESS</p>
          <h2 className="text-[26px] sm:text-[44px] font-bold text-gray-900 tracking-tight mb-2.5">How It Works</h2>
          <p className="text-gray-500 text-[14px] sm:text-[15.5px] max-w-xl mx-auto leading-relaxed">
            Booking with Move4U is simple — from first quote to job done.
          </p>
        </FadeUp>

        {/* Mobile — vertical rail */}
        <ol className="lg:hidden relative pl-11">
          <div
            className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-purple-300 via-purple-200 to-transparent"
            aria-hidden
          />
          {steps.map(({ icon: Icon, num, title, text }, i) => (
            <FadeUp key={num} delay={i * 80}>
              <li className="relative pb-8 last:pb-0">
                <div className="absolute -left-11 top-0.5 w-[30px] h-[30px] rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-md">
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-[15.5px] tracking-tight mb-0.5">{title}</h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed">{text}</p>
              </li>
            </FadeUp>
          ))}
        </ol>

        {/* Desktop — 4 columns with large ghost numbers behind each step */}
        <div className="hidden lg:grid grid-cols-4 gap-8 relative">
          {/* Thin connector line */}
          <div
            className="absolute top-[30px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px"
            style={{ background: "linear-gradient(to right, #d8b4fe, #a78bfa, #d8b4fe)" }}
            aria-hidden
          />

          {steps.map(({ icon: Icon, num, title, text }, i) => (
            <FadeUp key={num} delay={i * 90} className="relative flex flex-col items-center text-center">
              {/* Ghost step number — decorative */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 font-black leading-none select-none pointer-events-none"
                style={{
                  fontSize: "clamp(80px, 10vw, 110px)",
                  color: "rgba(93,63,184,0.055)",
                  letterSpacing: "-0.04em",
                }}
                aria-hidden
              >
                {num}
              </div>

              {/* Icon circle */}
              <div className="relative z-10 bg-white ring-2 ring-purple-100 shadow-[0_8px_24px_-8px_rgba(74,49,156,0.35)] w-[60px] h-[60px] rounded-full flex items-center justify-center text-purple-700">
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="absolute -top-1.5 -right-1.5 bg-purple-700 text-white w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                  {i + 1}
                </span>
              </div>

              <div className="mt-6 relative z-10">
                <h3 className="font-bold text-gray-900 text-[16.5px] tracking-tight mb-1.5">{title}</h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed max-w-[13rem] mx-auto">{text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why Choose Us — premium dark split section ───────────────────────────────
function PreviewWhyChooseUs() {
  const points = [
    { icon: ShieldCheck,        label: "Reliable & experienced",  text: "Trained movers who treat your belongings like our own." },
    { icon: BadgePoundSterling, label: "Transparent pricing",     text: "Clear hourly rates from £35/hr — no hidden fees, ever." },
    { icon: Zap,                label: "Fast response",           text: "Quick replies on WhatsApp, phone or email." },
    { icon: CalendarClock,      label: "Flexible booking",        text: "Same-day slots and bookings 7 days a week." },
  ];

  return (
    <section id="why-choose-us" className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Left — photo panel */}
        <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[520px] overflow-hidden">
          <img
            src={SLIDES[0].image}
            alt="Move4U professional movers loading a van in London"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "62% center" }}
            loading="lazy"
          />
          {/* Overlay — darker toward the right so it bleeds into the dark panel */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(15,12,26,0.10) 0%, rgba(15,12,26,0.50) 85%, rgba(15,12,26,0.98) 100%)",
            }}
          />
          {/* Hard seam cover on desktop */}
          <div
            className="hidden lg:block absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
            style={{ background: "#0f0c1a" }}
          />
        </div>

        {/* Right — dark content panel */}
        <div
          className="relative py-14 sm:py-16 lg:py-20 px-6 sm:px-10 lg:px-14 flex flex-col justify-center"
          style={{ background: "#0f0c1a" }}
        >
          {/* Ambient purple glows */}
          <div
            aria-hidden
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(93,63,184,0.20) 0%, transparent 68%)",
              transform: "translate(35%, -35%)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(93,63,184,0.12) 0%, transparent 68%)",
              transform: "translate(-35%, 35%)",
            }}
          />

          <div className="relative">
            <FadeUp>
              <p className="text-[10.5px] font-semibold tracking-[0.22em] text-purple-400 mb-3">
                WHY MOVE4U
              </p>
              <h2 className="text-[28px] sm:text-[38px] lg:text-[44px] font-bold text-white tracking-tight leading-tight mb-3">
                Why Customers
                <br />
                Choose Us
              </h2>
              <p className="text-gray-400 text-[13.5px] sm:text-[15px] mb-10 leading-relaxed max-w-sm">
                Hundreds of customers across London trust Move4U for professional, stress-free moves.
              </p>
            </FadeUp>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-7">
              {points.map(({ icon: Icon, label, text }, i) => (
                <FadeUp key={label} delay={i * 80}>
                  <div className="flex gap-3.5 items-start">
                    <div
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(93,63,184,0.20)",
                        border: "1px solid rgba(93,63,184,0.38)",
                      }}
                    >
                      <Icon className="w-[17px] h-[17px] text-purple-400" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-[14.5px] mb-0.5 tracking-tight">{label}</h3>
                      <p className="text-gray-400 text-[13px] leading-relaxed">{text}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── About strip (SEO content unchanged) ─────────────────────────────────────
function PreviewAbout() {
  const [, setLocation] = useLocation();
  return (
    <section
      id="about"
      className="py-14 sm:py-[72px] bg-white border-y border-gray-100 relative overflow-hidden scroll-mt-[calc(84px+env(safe-area-inset-top,0px))] md:scroll-mt-[calc(100px+env(safe-area-inset-top,0px))]"
    >
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeUp>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            ABOUT MOVE4U
          </p>
          <h2 className="text-[24px] sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            London's Trusted Removals, Man and Van &amp; International Moving Service
          </h2>
          <p className="text-gray-600 text-[14px] sm:text-base leading-relaxed max-w-2xl mx-auto mb-7">
            Move4U is a London-based removals company offering house moving, man and van, furniture
            delivery, commercial moving, waste removal and international moving services across London,
            the UK and Europe. From single-item drop-offs to full house moves, office relocations and
            international moves, we provide a reliable moving service with clear hourly pricing from
            £35/hour and friendly, professional movers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setLocation("/book")}
              className="btn-purple inline-flex items-center justify-center font-semibold px-7 py-3 rounded-full text-[14px]"
            >
              Book Now
            </button>
            <a
              href={`tel:${CONTACT.driver}`}
              className="border border-gray-200 text-gray-800 font-semibold px-7 py-3 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-[14px]"
            >
              Call: {CONTACT.driverDisplay}
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Reviews — Google CTA (no unverified review text) ────────────────────────
// NOTE: current REVIEWS in constants.ts are not confirmed real customer reviews.
// Showing Google CTA only. Replace with real verified reviews after confirmation.
// TODO: get the correct public Google Business Profile *listing* URL (read reviews link)
//       and replace GOOGLE_READ_LINK below.
const GOOGLE_LEAVE_REVIEW = "https://g.page/r/CcLgDnAXKxpzEAI/review";
const GOOGLE_READ_REVIEWS  = "https://g.page/r/CcLgDnAXKxpzEAI/review"; // TODO: replace with the public reviews listing URL

function PreviewReviews() {
  return (
    <section id="reviews" className="py-16 sm:py-20 bg-[#faf8fd]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeUp>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">REVIEWS</p>
          <h2 className="text-[26px] sm:text-[38px] font-bold text-gray-900 tracking-tight mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-[14px] sm:text-[15.5px] max-w-xl mx-auto leading-relaxed mb-10">
            Read genuine customer reviews on Google, or share your experience after your move.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href={GOOGLE_READ_REVIEWS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 font-semibold px-7 py-3.5 rounded-full hover:bg-gray-50 hover:-translate-y-0.5 transition-all shadow-sm text-[14.5px]"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Read our Google Reviews
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <a
              href={GOOGLE_LEAVE_REVIEW}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-purple inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-full text-[14.5px]"
            >
              Leave us a Review
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>
          </div>

          <p className="text-[12.5px] text-gray-400">
            Also find us on{" "}
            <a
              href="https://www.trustpilot.com/review/move4u.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 transition-colors"
            >
              Trustpilot
            </a>{" "}
            and{" "}
            <a
              href="https://nextdoor.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 transition-colors"
            >
              Nextdoor
            </a>
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Main preview page ────────────────────────────────────────────────────────
export default function HomePagePreview() {
  return (
    <div className="min-h-screen bg-[#faf8fd]">
      <Navbar />
      <main>
        <PreviewHeroSlider />
        <TrustBar />
        <PreviewServicesSection />
        <PreviewHowItWorks />
        <PreviewWhyChooseUs />
        <PreviewAbout />
        <PreviewReviews />
        <ContactSection />
      </main>
      <Footer />
      <PreviewBadge />
    </div>
  );
}
