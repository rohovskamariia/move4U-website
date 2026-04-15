import { X } from "lucide-react";
import { VAN_SIZES } from "@/data/constants";

interface VanSizeModalProps {
  onClose: () => void;
}

// Van size guide modal — edit van specs in src/data/constants.ts
export default function VanSizeModal({ onClose }: VanSizeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Van Size Guide</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close"
            data-testid="close-van-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {VAN_SIZES.map((van) => (
            <div key={van.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-4">
                {/* Van icon placeholder */}
                <div className="bg-purple-100 text-purple-700 rounded-lg p-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                    <rect x="9" y="11" width="14" height="10" rx="2" />
                    <circle cx="12" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{van.name}</h3>
                    <span className="text-purple-700 font-bold text-sm">From £{van.basePrice}/hr</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Approx. {van.dimensions}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{van.description}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
            <strong>Not sure?</strong> Select the closest option — we'll review and confirm the best fit for your move.
          </div>
        </div>
      </div>
    </div>
  );
}
