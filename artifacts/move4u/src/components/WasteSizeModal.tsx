import { X } from "lucide-react";
import { WASTE_LOADS } from "@/data/constants";
import minLoad from "@assets/IMG_3575_1776610167208.webp";
import quarterLoad from "@assets/IMG_3576_1776610167208.webp";
import thirdLoad from "@assets/IMG_3577_1776610167208.webp";
import halfLoad from "@assets/IMG_3578_1776610167208.webp";
import threeQuarterLoad from "@assets/IMG_3579_1776610167209.webp";
import fullLoad from "@assets/IMG_3580_1776610167209.webp";
import xlLoad from "@assets/IMG_3580_1776610167209.webp";

interface WasteSizeModalProps {
  onClose: () => void;
}

const LOAD_IMAGES: Record<string, string> = {
  minimum: minLoad,
  quarter: quarterLoad,
  third: thirdLoad,
  half: halfLoad,
  three_quarter: threeQuarterLoad,
  full: fullLoad,
  extra_large: xlLoad,
};

// Waste removal size guide modal — opens inside booking flow without losing state.
// Edit load prices and details in src/data/constants.ts (WASTE_LOADS).
export default function WasteSizeModal({ onClose }: WasteSizeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 z-10">
          <h2 className="text-lg font-bold text-gray-900">Waste Removal Size Guide</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close"
            data-testid="close-waste-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-gray-500 mb-4">Prices</p>

          <div className="space-y-4">
            {WASTE_LOADS.map((load) => (
              <div
                key={load.id}
                className="border border-gray-100 rounded-xl overflow-hidden"
                data-testid={`waste-modal-card-${load.id}`}
              >
                {/* Uniform image frame: same aspect, baseline-aligned */}
                <div className="bg-white aspect-[12/5] flex items-end justify-center px-5 pt-4 pb-3 border-b border-gray-100">
                  <img
                    src={LOAD_IMAGES[load.id]}
                    alt={`${load.label} visual`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{load.label}</h3>
                    <span className="text-purple-700 font-bold text-sm">{load.displayPrice}</span>
                  </div>

                  <ul className="space-y-1 text-sm text-gray-700">
                    {load.labour && (
                      <li className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                          <span className="text-gray-500">Labour:</span>{" "}
                          <span className="font-medium">{load.labour}</span>
                        </span>
                      </li>
                    )}
                    {load.cubicYards && (
                      <li className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                          <span className="text-gray-500">Cubic yards:</span>{" "}
                          <span className="font-medium">{load.cubicYards}</span>
                        </span>
                      </li>
                    )}
                    {load.maxWeight && (
                      <li className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                          <span className="text-gray-500">Max weight:</span>{" "}
                          <span className="font-medium">{load.maxWeight}</span>
                        </span>
                      </li>
                    )}
                    {load.equivalent && (
                      <li className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <span>
                          <span className="text-gray-500">Equivalent to:</span>{" "}
                          <span className="font-medium">{load.equivalent}</span>
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
            <strong>Not sure?</strong> Pick the closest match — our team will confirm the price before the job starts.
          </div>
        </div>
      </div>
    </div>
  );
}
