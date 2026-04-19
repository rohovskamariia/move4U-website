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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Compact 56px row on mobile, 64px on desktop */}
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg md:text-xl text-purple-700"
            >
              <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white p-1.5 rounded-lg shadow-sm">
                <Truck className="w-4 h-4 md:w-5 md:h-5" />
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
                className="text-sm font-semibold text-purple-700 border border-purple-200 px-4 py-2 rounded-full hover:bg-purple-50 transition-all"
                data-testid="nav-get-quote"
              >
                Get a Quote
              </Link>
              <Link
                href="/book"
                className="text-sm font-semibold text-white bg-purple-700 px-5 py-2 rounded-full hover:bg-purple-800 hover:shadow-md transition-all"
                data-testid="nav-book-now"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -mr-1 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              onClick={() => setMenuOpen(true)}
              data-testid="mobile-menu-toggle"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
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
