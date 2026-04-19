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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
    <section id="services" className="py-16 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-purple-700 mb-2">
            WHAT WE OFFER
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Our Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            From single items to full house moves — we cover it all across London.
          </p>
        </div>

        {/* Tighter, premium cards. On mobile: full-width tappable rows. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <div
                key={service.id}
                className="group relative bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 transition-all hover:shadow-[0_10px_40px_-15px_rgba(124,58,237,0.25)] hover:border-purple-300 hover:-translate-y-0.5 flex flex-col"
                data-testid={`service-card-${service.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-purple-100 text-purple-700 w-11 h-11 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                    {service.price}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1.5 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                  {service.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/book/${service.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-purple-700 py-2.5 px-3 rounded-full hover:bg-purple-800 transition-colors"
                    data-testid={`book-service-${service.id}`}
                  >
                    Book
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setLocation(`/book/${service.id}?action=quote`)
                    }
                    className="flex-1 text-xs font-semibold text-purple-700 border border-purple-200 py-2.5 px-3 rounded-full hover:bg-purple-50 transition-colors"
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
