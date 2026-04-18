import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Truck, Clock, Zap, CalendarDays } from "lucide-react";

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
    <header className="sticky top-0 z-50">
      {/* Gradient trust strip — premium ombre purple.
       * Hidden on mobile (overlapping content + cluttered on small screens);
       * shown from sm: breakpoint upward. */}
      <div
        className="hidden sm:block text-white text-xs"
        style={{
          background:
            "linear-gradient(90deg, #4c1d95 0%, #6d28d9 50%, #7e22ce 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-50/95">
            <Zap className="w-3.5 h-3.5 text-purple-200" />
            <span>Same-day service available</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-50/95">
            <Clock className="w-3.5 h-3.5 text-purple-200" />
            <span>Fast &amp; reliable across London</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-50/95">
            <CalendarDays className="w-3.5 h-3.5 text-purple-200" />
            <span>Available 7 days a week</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-purple-700">
              <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white p-2 rounded-xl shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <span className="tracking-tight">Move4U</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
              <button onClick={() => scrollTo("services")} className="hover:text-purple-700 transition-colors">Services</button>
              <button onClick={() => scrollTo("how-it-works")} className="hover:text-purple-700 transition-colors">How It Works</button>
              <button onClick={() => scrollTo("reviews")} className="hover:text-purple-700 transition-colors">Reviews</button>
              <button onClick={() => scrollTo("contact")} className="hover:text-purple-700 transition-colors">Contact</button>
            </div>

            {/* CTA buttons */}
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
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-3 text-sm font-medium text-gray-700">
              <button onClick={() => scrollTo("services")} className="block w-full text-left py-2 hover:text-purple-700">Services</button>
              <button onClick={() => scrollTo("how-it-works")} className="block w-full text-left py-2 hover:text-purple-700">How It Works</button>
              <button onClick={() => scrollTo("reviews")} className="block w-full text-left py-2 hover:text-purple-700">Reviews</button>
              <button onClick={() => scrollTo("contact")} className="block w-full text-left py-2 hover:text-purple-700">Contact</button>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/book?action=quote"
                  onClick={() => setMenuOpen(false)}
                  className="text-center font-semibold text-purple-700 border border-purple-200 px-4 py-2.5 rounded-full hover:bg-purple-50 transition-colors"
                >
                  Get a Quote
                </Link>
                <Link
                  href="/book"
                  onClick={() => setMenuOpen(false)}
                  className="text-center font-semibold text-white bg-purple-700 px-4 py-2.5 rounded-full hover:bg-purple-800 transition-colors"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
