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
    <section id="services" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            From single items to full house moves — we cover it all across London.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SERVICES.map((service) => {
            const Icon = iconMap[service.icon] || Package;
            return (
              <div
                key={service.id}
                className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all group"
                data-testid={`service-card-${service.id}`}
              >
                <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm sm:text-base">{service.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-4">{service.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/book/${service.id}`)}
                    className="flex-1 text-center text-xs font-semibold text-white bg-purple-700 py-2 px-3 rounded-lg hover:bg-purple-800 transition-colors"
                    data-testid={`book-service-${service.id}`}
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setLocation(`/book/${service.id}?action=quote`)}
                    className="flex-1 text-center text-xs font-semibold text-purple-700 border border-purple-200 py-2 px-3 rounded-lg hover:bg-purple-50 transition-colors"
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
