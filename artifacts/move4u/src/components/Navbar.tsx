import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Truck } from "lucide-react";

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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-purple-700">
            <div className="bg-purple-700 text-white p-1.5 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            Move4U
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <button onClick={() => scrollTo("services")} className="hover:text-purple-700 transition-colors">Services</button>
            <button onClick={() => scrollTo("about")} className="hover:text-purple-700 transition-colors">About</button>
            <button onClick={() => scrollTo("reviews")} className="hover:text-purple-700 transition-colors">Reviews</button>
            <button onClick={() => scrollTo("contact")} className="hover:text-purple-700 transition-colors">Contact</button>
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/book?action=quote"
              className="text-sm font-semibold text-purple-700 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              data-testid="nav-get-quote"
            >
              Get a Quote
            </Link>
            <Link
              href="/book"
              className="text-sm font-semibold text-white bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors"
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
            <button onClick={() => scrollTo("about")} className="block w-full text-left py-2 hover:text-purple-700">About</button>
            <button onClick={() => scrollTo("reviews")} className="block w-full text-left py-2 hover:text-purple-700">Reviews</button>
            <button onClick={() => scrollTo("contact")} className="block w-full text-left py-2 hover:text-purple-700">Contact</button>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/book?action=quote"
                onClick={() => setMenuOpen(false)}
                className="text-center font-semibold text-purple-700 border border-purple-200 px-4 py-2.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Get a Quote
              </Link>
              <Link
                href="/book"
                onClick={() => setMenuOpen(false)}
                className="text-center font-semibold text-white bg-purple-700 px-4 py-2.5 rounded-lg hover:bg-purple-800 transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
