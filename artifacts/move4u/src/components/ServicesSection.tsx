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
    <section
      id="services"
      /* MOBILE: ride up over the bottom of the hero (-mt-6) with
         rounded top corners and a soft top shadow so the join feels
         intentional and modern instead of a hard cut. White panel on
         mobile keeps the focus on the service tiles. DESKTOP: unchanged
         — flat full-width gradient as before. */
      className="
        relative z-10 -mt-3 rounded-t-[20px] bg-white shadow-[0_-6px_18px_-14px_rgba(76,29,149,0.14)]
        pt-7 pb-9
        sm:mt-0 sm:rounded-none sm:bg-transparent sm:shadow-none sm:pt-16 sm:pb-16
      "
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--svc-from, #ffffff) 0%, var(--svc-mid, #ffffff) 60%, var(--svc-to, #ffffff) 100%)",
      }}
    >
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
                onClick={() =>
                  setLocation(
                    service.id === "house-move"
                      ? "/house-moving"
                      : service.id === "waste-removal"
                      ? "/waste-removal"
                      : `/book/${service.id}`,
                  )
                }
                className="bg-white rounded-2xl ring-1 ring-purple-100/60 p-3.5 flex flex-col items-center justify-center text-center min-h-[108px] shadow-[0_2px_6px_-2px_rgba(74,49,156,0.08),_0_10px_22px_-12px_rgba(74,49,156,0.18)] active:bg-purple-50/40 active:scale-[0.98] transition-all duration-300"
                data-testid={`service-card-${service.id}`}
              >
                <div
                  className="text-white w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.5)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
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
                className="group relative bg-white rounded-3xl p-6 ring-1 ring-purple-100/70 shadow-[0_4px_12px_-4px_rgba(74,49,156,0.10),_0_18px_40px_-16px_rgba(74,49,156,0.18)] transition-all duration-300 ease-out hover:ring-purple-200 hover:shadow-[0_8px_18px_-6px_rgba(74,49,156,0.18),_0_30px_60px_-20px_rgba(74,49,156,0.40)] hover:-translate-y-1.5 flex flex-col"
                data-testid={`service-card-desktop-${service.id}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="text-white w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(74,49,156,0.55)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_10px_22px_-6px_rgba(74,49,156,0.65)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6d4ed3 0%, #5b3fb8 55%, #4a319c 100%)",
                    }}
                  >
                    <Icon className="w-[19px] h-[19px]" strokeWidth={2.25} />
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
                    onClick={() =>
                      setLocation(
                        service.id === "house-move"
                          ? "/house-moving"
                          : service.id === "waste-removal"
                          ? "/waste-removal"
                          : `/book/${service.id}`,
                      )
                    }
                    className="btn-purple flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-3 rounded-full"
                    data-testid={`book-service-${service.id}`}
                  >
                    {service.id === "house-move" ||
                    service.id === "waste-removal"
                      ? "Learn More"
                      : "Book"}
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
