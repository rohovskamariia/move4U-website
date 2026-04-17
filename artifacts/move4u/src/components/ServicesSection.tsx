import { useLocation } from "wouter";
import {
  Home, Trash2, Building2, Package, PackageOpen, Globe, HelpCircle
} from "lucide-react";
import { SERVICES } from "@/data/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Trash2, Building2, Package, PackageOpen, Globe, HelpCircle,
};

// Edit service cards in src/data/constants.ts
export default function ServicesSection() {
  const [, setLocation] = useLocation();

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-purple-700 mb-2">WHAT WE OFFER</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Our Services</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            From single items to full house moves — we cover it all across London.
          </p>
        </div>

        {/* 2 rows × 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-300 hover:-translate-y-1 transition-all group flex flex-col"
                data-testid={`service-card-${service.id}`}
              >
                <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{service.title}</h3>
                <p className="text-purple-700 text-sm font-semibold mb-3">{service.price}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{service.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/book/${service.id}`)}
                    className="flex-1 text-center text-xs font-semibold text-white bg-purple-700 py-2.5 px-3 rounded-full hover:bg-purple-800 transition-colors"
                    data-testid={`book-service-${service.id}`}
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setLocation(`/book/${service.id}?action=quote`)}
                    className="flex-1 text-center text-xs font-semibold text-purple-700 border border-purple-200 py-2.5 px-3 rounded-full hover:bg-purple-50 transition-colors"
                    data-testid={`quote-service-${service.id}`}
                  >
                    Get a Quote
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
