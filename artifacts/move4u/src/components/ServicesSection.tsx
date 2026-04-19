import { useLocation } from "wouter";
import {
  Home,
  Trash2,
  Building2,
  Package,
  PackageOpen,
  Globe,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { SERVICES } from "@/data/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Home,
  Trash2,
  Building2,
  Package,
  PackageOpen,
  Globe,
  HelpCircle,
};

// Edit service cards in src/data/constants.ts
export default function ServicesSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="services" className="py-9 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-14">
          <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
            WHAT WE OFFER
          </p>
          <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
            Our Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-[13px] sm:text-base leading-relaxed">
            From single items to full house moves — we cover it all across London.
          </p>
        </div>

        {/* MOBILE: tight 2x3 grid — icon + title only, every tile is one tap. */}
        <div className="grid grid-cols-2 gap-2.5 sm:hidden">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setLocation(`/book/${service.id}`)}
                className="bg-white rounded-2xl ring-1 ring-gray-100 p-3.5 flex flex-col items-center justify-center text-center min-h-[108px] active:bg-purple-50/40 active:scale-[0.98] transition-all"
                data-testid={`service-card-${service.id}`}
              >
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-purple-100 mb-2">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-gray-900 text-[12.5px] tracking-tight leading-tight">
                  {service.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* DESKTOP / TABLET: full cards with description, price, CTAs.
            Hidden on mobile — kept identical to the original layout. */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-3xl p-6 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.06)] transition-all duration-300 hover:ring-purple-200/70 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(124,58,237,0.28)] hover:-translate-y-1 flex flex-col"
                data-testid={`service-card-desktop-${service.id}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-purple-100 group-hover:from-purple-700 group-hover:to-purple-800 group-hover:text-white group-hover:ring-purple-700 transition-all duration-300">
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <span className="text-[10.5px] font-semibold text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-full tracking-wide">
                    {service.price}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-[17px] mb-1 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed flex-1 mb-5">
                  {service.description}
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setLocation(`/book/${service.id}`)}
                    className="btn-purple flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-3 rounded-full"
                    data-testid={`book-service-${service.id}`}
                  >
                    Book
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() =>
                      setLocation(`/book/${service.id}?action=quote`)
                    }
                    className="flex-1 text-[12.5px] font-semibold text-purple-700 border border-purple-200/80 py-2.5 px-3 rounded-full hover:bg-purple-50 hover:border-purple-300 hover:-translate-y-0.5 transition-all"
                    data-testid={`quote-service-${service.id}`}
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
