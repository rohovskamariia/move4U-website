import { useState } from "react";
import { Info } from "lucide-react";
import { HELP_PRICING, VAN_SIZES } from "@/data/constants";
import VanSizeModal from "@/components/VanSizeModal";
import { CONTACT } from "@/data/constants";

interface VanStepProps {
  selected: string;
  onSelect: (id: string) => void;
}

// Van size selection step
// Edit van pricing in src/data/constants.ts
export default function VanStep({ selected, onSelect }: VanStepProps) {
  const [showGuide, setShowGuide] = useState(false);

  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
        <h3 className="text-[15px] sm:text-base font-semibold text-gray-900">Choose your van size</h3>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="text-[11.5px] sm:text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 inline-flex items-center gap-1"
          data-testid="van-guide-link"
        >
          <Info className="w-3.5 h-3.5" />
          View van sizes &amp; pictures
        </button>
      </div>
      <p className="text-gray-500 text-[13px] sm:text-sm mb-3 sm:mb-5">Prices are per hour — select the best fit for your move.</p>

      {/* MOBILE: compact horizontal rows. DESKTOP: 3-column tile grid. */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-5">
        {VAN_SIZES.map((van) => {
          const pricing = HELP_PRICING[van.id];
          const isSelected = selected === van.id;
          return (
            <button
              key={van.id}
              onClick={() => onSelect(van.id)}
              className={`text-left border-2 rounded-xl p-2.5 sm:p-4 transition-all flex sm:block items-center gap-3 ${
                isSelected
                  ? "border-purple-700 bg-purple-50"
                  : "border-gray-100 bg-white hover:border-purple-300"
              }`}
              data-testid={`van-select-${van.id}`}
            >
              <div className={`shrink-0 sm:mb-3 ${isSelected ? "text-purple-700" : "text-gray-400"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                  <rect x="9" y="11" width="14" height="10" rx="2" />
                  <circle cx="12" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2 sm:block">
                <h4 className="font-semibold text-gray-900 text-[13.5px] sm:text-sm sm:mb-1">{van.name}</h4>
                <p className={`text-[13px] sm:text-base font-bold tabular-nums ${isSelected ? "text-purple-700" : "text-gray-700"}`}>
                  From £{pricing.noHelp}/hr
                </p>
              </div>
              {isSelected && (
                <div className="hidden sm:block mt-2 text-xs text-purple-600 font-medium">Selected</div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[11.5px] sm:text-xs text-gray-500 mb-3 sm:mb-4 leading-snug">
        Not sure what to choose? Select the closest option — we'll review and confirm the best fit for your move.
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href={`tel:${CONTACT.driver}`}
          className="text-xs font-medium text-gray-600 underline underline-offset-2"
          data-testid="van-call-us"
        >
          Call us
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-green-700 underline underline-offset-2"
          data-testid="van-whatsapp"
        >
          WhatsApp us
        </a>
      </div>

      {showGuide && <VanSizeModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
