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
              className="flex items-center gap-3 group"
              aria-label="Move4U — home"
            >
              <img
                src="/m4u-icon.png"
                alt=""
                aria-hidden="true"
                className="w-11 h-11 md:w-[54px] md:h-[54px] rounded-full object-cover shadow-[0_6px_18px_-6px_rgba(74,49,156,0.5)] transition-transform duration-200 group-hover:-translate-y-0.5 select-none"
                draggable={false}
              />
              <span className="flex flex-col leading-none">
                <span className="font-extrabold text-[22px] md:text-[27px] tracking-tight">
                  <span style={{ color: "#0F172A" }}>Move</span>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #7B5CFF 0%, #6a4ae8 50%, #5A3BFF 100%)",
                    }}
                  >
                    4U
                  </span>
                </span>
                <span className="hidden sm:block mt-1.5 text-[10.5px] md:text-[11.5px] font-medium tracking-wide text-gray-400">
                  We move things. You move on.
                </span>
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
                className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(74,49,156,0.7)]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #5b3fb8 0%, #4a319c 60%, #3a267f 100%)",
                  boxShadow: "0 6px 18px -8px rgba(74,49,156,0.5)",
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
