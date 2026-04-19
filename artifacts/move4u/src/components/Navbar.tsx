import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Truck } from "lucide-react";
import MobileDrawer from "./MobileDrawer";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (location !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Premium app-style header — translucent, ultra-light hairline
          border, almost no shadow. The translucent background + backdrop
          blur make it feel like a native app bar rather than a default
          web header. */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/70">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Slimmer 52px row on mobile for a more refined silhouette */}
          <div className="flex items-center justify-between h-[52px] md:h-16">
            {/* Logo — smaller, more elegant proportions */}
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-base md:text-xl text-purple-700"
            >
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-1.5 rounded-lg shadow-[0_2px_6px_-2px_rgba(124,58,237,0.4)]">
                <Truck className="w-3.5 h-3.5 md:w-5 md:h-5" strokeWidth={2.25} />
              </div>
              <span className="tracking-tight">Move4U</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
              <button
                onClick={() => scrollTo("services")}
                className="hover:text-purple-700 transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="hover:text-purple-700 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollTo("reviews")}
                className="hover:text-purple-700 transition-colors"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="hover:text-purple-700 transition-colors"
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
                className="text-sm font-semibold text-white bg-purple-700 px-5 py-2 rounded-full hover:bg-purple-800 hover:shadow-[0_8px_20px_-8px_rgba(124,58,237,0.6)] transition-all"
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
