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
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">What would you like to do?</h2>
      <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-6">
        Select the service that best matches your request
      </p>

      {/*
        Mobile: 2 compact columns — icon stacked above title, no description,
        so the whole step fits without scrolling.
        Desktop (sm+): original horizontal card layout with description.
      */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
        {SERVICES.map((service) => {
          const Icon = iconMap[service.icon] || Package;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service.id)}
              className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-2 sm:gap-4 bg-white border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-purple-300 hover:shadow-md transition-all group min-h-[88px] sm:min-h-0"
              data-testid={`select-service-${service.id}`}
            >
              <div className="bg-purple-100 text-purple-700 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-[13px] sm:text-sm leading-snug">
                  {service.title}
                </h3>
                <p className="hidden sm:block text-gray-500 text-xs mt-0.5 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
