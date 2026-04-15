import {
  Home, Trash2, Building2, Package, PackageOpen, Globe, HelpCircle
} from "lucide-react";
import { SERVICES } from "@/data/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Trash2, Building2, Package, PackageOpen, Globe, HelpCircle,
};

interface ServiceSelectorProps {
  onSelect: (serviceId: string) => void;
}

// First screen of booking — select a service type
export default function ServiceSelector({ onSelect }: ServiceSelectorProps) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">What would you like to do?</h2>
      <p className="text-gray-500 text-sm mb-6">Select the service that best matches your request</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((service) => {
          const Icon = iconMap[service.icon] || Package;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service.id)}
              className="flex items-start gap-4 text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all group"
              data-testid={`select-service-${service.id}`}
            >
              <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{service.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{service.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
