import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Truck } from "lucide-react";
import MobileDrawer from "./MobileDrawer";
import { SCROLL_TARGET_KEY } from "@/lib/sectionNav";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, setLocation] = useLocation();

  // Track scroll so the header gains a touch more depth once the user
  // scrolls past the hero — empty-feeling pure white at top, with
  // soft glass + subtle shadow as content scrolls underneath.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (location !== "/") {
      // Cross-page nav — store the section target so HomePage can jump
      // straight to it before the browser paints (no visible "go to top
      // first" flash). Then SPA-navigate to "/" via wouter.
      sessionStorage.setItem(SCROLL_TARGET_KEY, id);
      setLocation("/");
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const goHome = () => {
    setMenuOpen(false);
    if (location === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Ensure no stale section target — clear before navigating home.
      sessionStorage.removeItem(SCROLL_TARGET_KEY);
      setLocation("/");
    }
  };

  return (
    <>
      {/* Premium glass header — soft translucent lavender wash, never plain
          white or harsh transparent. The shadow strengthens on scroll for
          added depth while the brand tint stays subtle and readable. */}
      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 backdrop-blur-xl border-b ${
          scrolled
            ? "border-purple-200/60 shadow-[0_10px_32px_-12px_rgba(91,33,182,0.22)]"
            : "border-purple-100/60 shadow-[0_4px_18px_-8px_rgba(91,33,182,0.14)]"
        }`}
        style={{
          // Mostly opaque on mobile to stay visually stable inside in-app
          // browsers (Telegram / Instagram) where backdrop-filter can be
          // unreliable. Adds a touch more transparency on desktop where
          // backdrop-blur is consistent.
          backgroundColor: scrolled
            ? "rgba(241,234,255,0.94)"
            : "rgba(244,238,255,0.92)",
          backgroundImage:
            "linear-gradient(180deg, rgba(237,229,255,0.55) 0%, rgba(245,240,255,0.35) 100%)",
          // Promote the header to its own GPU layer so iOS Safari and
          // in-app browsers don't repaint/jitter on scroll.
          transform: "translateZ(0)",
          WebkitBackdropFilter: "blur(20px)",
          willChange: "background-color",
        }}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Slim refined silhouette — slightly taller on desktop for breathing room */}
          <div className="flex items-center justify-between h-[56px] md:h-[68px]">
            {/* Premium wordmark — gradient mark, gradient text, micro-tagline */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="Move4U — home"
            >
              <span
                className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.55)] transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 45%, #5b21b6 100%)",
                }}
              >
                {/* Soft inner highlight for a glassy, premium logo mark */}
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)",
                  }}
                />
                <Truck
                  className="relative w-4 h-4 md:w-5 md:h-5"
                  strokeWidth={2.4}
                />
              </span>
              <span
                className="font-bold text-[18px] md:text-[22px] tracking-tight bg-clip-text text-transparent leading-none"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #6d28d9 100%)",
                }}
              >
                Move4U
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-gray-700">
              <button
                onClick={goHome}
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-home"
              >
                Home
              </button>
              <button
                onClick={() => scrollTo("services")}
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-services"
              >
                Services
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-how-it-works"
              >
                How It Works
              </button>
              <Link
                href="/pricing"
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-pricing"
              >
                Pricing
              </Link>
              <button
                onClick={() => scrollTo("contact")}
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-contact"
              >
                Contact
              </button>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/book?action=quote"
                className="text-sm font-semibold text-purple-700 border border-purple-200 px-4 py-2 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-all"
                data-testid="nav-get-quote"
              >
                Get a Quote
              </Link>
              <Link
                href="/book"
                className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(124,58,237,0.7)]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #5b21b6 100%)",
                  boxShadow: "0 6px 18px -8px rgba(124,58,237,0.5)",
                }}
                data-testid="nav-book-now"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile menu button — refined hit area, no clunky padding */}
            <button
              className="md:hidden -mr-1 p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              onClick={() => setMenuOpen(true)}
              data-testid="mobile-menu-toggle"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </div>
        </nav>
      </header>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSectionLink={scrollTo}
      />
    </>
  );
}
