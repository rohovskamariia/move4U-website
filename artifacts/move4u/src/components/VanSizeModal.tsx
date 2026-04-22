import { X } from "lucide-react";
import smallVan from "@assets/IMG_3410_1776508670556.webp";
import mediumVan from "@assets/IMG_3409_1776508670556.webp";
import largeVan from "@assets/IMG_3408_1776508670556.webp";

interface VanSizeModalProps {
  onClose: () => void;
}

interface ModalVan {
  id: string;
  name: string;
  description: string;
  image: string;
  scale: number;
  specs: { label: string; value: string }[];
}

const VANS: ModalVan[] = [
  {
    id: "small",
    name: "Small Van",
    description:
      "Suitable for one person's luggage and easy to park. Can fit up to 10 packed suitcases.",
    image: smallVan,
    scale: 0.6,
    specs: [
      { label: "Length", value: "1.7m / 5.58ft" },
      { label: "Width", value: "1.49m / 4.89ft" },
      { label: "Height", value: "1.2m / 3.94ft" },
      { label: "Payload", value: "600–800kg" },
      { label: "Seats (incl. driver)", value: "2" },
    ],
  },
  {
    id: "medium",
    name: "Medium Van",
    description:
      "Suitable for transporting two people's belongings. Offers a large load area without being much bigger than a family car.",
    image: mediumVan,
    scale: 0.78,
    specs: [
      { label: "Length", value: "2.4m / 7.87ft" },
      { label: "Width", value: "1.7m / 5.58ft" },
      { label: "Height", value: "1.4m / 4.59ft" },
      { label: "Payload", value: "800–1200kg" },
      { label: "Seats (incl. driver)", value: "3" },
    ],
  },
  {
    id: "large",
    name: "Large Van",
    description:
      "Suitable for 1–2 bedroom flat removals or business-to-business deliveries. Offers a large internal load space.",
    image: largeVan,
    scale: 1,
    specs: [
      { label: "Length", value: "3.4m / 11.15ft" },
      { label: "Width", value: "1.7m / 5.58ft" },
      { label: "Height", value: "1.8m / 6.20ft" },
      { label: "Payload", value: "1200–1500kg" },
      { label: "Seats (incl. driver)", value: "3" },
    ],
  },
];

// Van size guide modal — opens inside booking flow without losing state.
// Edit van specs in src/data/constants.ts (HELP_PRICING / VAN_SIZES) and content here.
export default function VanSizeModal({ onClose }: VanSizeModalProps) {
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
          {VANS.map((van) => (
            <div
              key={van.id}
              className="border border-gray-100 rounded-xl overflow-hidden"
              data-testid={`van-modal-card-${van.id}`}
            >
              {/* Uniform image frame: same aspect, white bg, baseline-aligned */}
              <div className="bg-white aspect-[12/5] flex items-end justify-center px-5 pt-4 pb-3 border-b border-gray-100">
                <img
                  src={van.image}
                  alt={van.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: `${van.scale * 100}%` }}
                  className="max-h-full object-contain"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{van.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{van.description}</p>
                <ul className="space-y-1 text-xs text-gray-700">
                  {van.specs.map((s) => (
                    <li
                      key={s.label}
                      className="flex justify-between border-b border-gray-50 pb-1 last:border-0"
                    >
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </li>
                  ))}
                </ul>
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
