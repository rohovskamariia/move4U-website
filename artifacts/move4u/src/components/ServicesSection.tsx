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
    <section id="services" className="py-14 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-9 sm:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            WHAT WE OFFER
          </p>
          <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
            Our Services
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-[14px] sm:text-base leading-relaxed">
            From single items to full house moves — we cover it all across London.
          </p>
        </div>

        {/* Lighter, more elegant cards. Reduced visual weight, tighter
            rhythm, smaller icons. Hover state gently lifts the card with a
            soft purple glow rather than a hard shadow. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <div
                key={service.id}
                className="group relative bg-white border border-gray-150 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_14px_40px_-18px_rgba(124,58,237,0.28)] hover:border-purple-200 hover:-translate-y-0.5 flex flex-col"
                style={{ borderColor: "rgb(238 238 242)" }}
                data-testid={`service-card-${service.id}`}
              >
                {/* Header row — small icon chip + price tag */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="bg-purple-50 text-purple-700 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <span className="text-[10.5px] font-semibold text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-full tracking-wide">
                    {service.price}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-[16px] sm:text-[17px] mb-1 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-[13.5px] leading-relaxed flex-1 mb-4">
                  {service.description}
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setLocation(`/book/${service.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-white bg-purple-700 py-2.5 px-3 rounded-full hover:bg-purple-800 hover:shadow-[0_6px_16px_-6px_rgba(124,58,237,0.55)] transition-all"
                    data-testid={`book-service-${service.id}`}
                  >
                    Book
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                  </button>
                  <button
                    onClick={() =>
                      setLocation(`/book/${service.id}?action=quote`)
                    }
                    className="flex-1 text-[12.5px] font-semibold text-purple-700 border border-purple-200/80 py-2.5 px-3 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-all"
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
