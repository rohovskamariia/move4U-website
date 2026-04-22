import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import MobileDrawer from "./MobileDrawer";
import AnnouncementBar from "./AnnouncementBar";
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
          added depth while the brand tint stays subtle and readable.

          Uses position: fixed (not sticky) so the header stays fully visible
          on mobile Safari and Telegram / Instagram in-app browsers where
          sticky elements can rubber-band half-offscreen during dynamic
          browser-chrome resizes. A spacer below pushes content down by
          the same height + iOS safe-area-inset-top. */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <AnnouncementBar />
      <header
        className={`transition-[background-color,box-shadow,border-color] duration-300 backdrop-blur-xl border-b ${
          scrolled
            ? "border-gray-200/80 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)]"
            : "border-gray-100/80 shadow-[0_2px_10px_-8px_rgba(15,23,42,0.10)]"
        }`}
        style={{
          backgroundColor: scrolled
            ? "rgba(255,255,255,0.94)"
            : "rgba(252,251,254,0.92)",
          transform: "translateZ(0)",
          WebkitBackdropFilter: "blur(20px)",
          willChange: "background-color",
        }}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Slim refined silhouette — slightly taller on desktop for breathing room */}
          <div className="flex items-center justify-between h-[56px] md:h-[68px]">
            {/* Brand mark — circular van+M icon + wordmark + slogan */}
            <Link
              href="/"
              className="flex items-center gap-1 group"
              aria-label="Move4U — home"
            >
              {/* The source PNG has a non-transparent white background and a
                  small margin around the purple disc, so plain rounded-full
                  would leave a thin white rim on dark/coloured backgrounds.
                  We wrap in a clipped container and scale the image up
                  ~12% so the purple disc fills the visible circle edge —
                  the white margin is pushed entirely outside the clip. */}
              <span
                className="block w-11 h-11 md:w-[52px] md:h-[52px] rounded-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5"
                aria-hidden="true"
              >
                <img
                  src="/m4u-icon.png"
                  alt=""
                  className="w-full h-full object-cover scale-[1.12] select-none block"
                  draggable={false}
                />
              </span>
              <span className="font-extrabold text-[22px] md:text-[27px] tracking-tight leading-none">
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #1a1340 0%, #2d1b69 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Move
                </span>
                <span style={{ color: "#3D1289" }}>4U</span>
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
                onClick={() => scrollTo("about")}
                className="hover:text-purple-700 transition-colors"
                data-testid="nav-about"
              >
                About
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
                className="btn-purple text-sm font-semibold px-5 py-2 rounded-full"
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
      </div>

      {/* Spacer matches: announcement bar (28/32) + header (56/68) + safe-area inset. */}
      <div
        aria-hidden="true"
        className="h-[84px] md:h-[100px]"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      />

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSectionLink={scrollTo}
        onHome={goHome}
      />
    </>
  );
}
