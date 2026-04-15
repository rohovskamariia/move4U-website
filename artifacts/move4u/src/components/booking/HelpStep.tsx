import { HELP_PRICING } from "@/data/constants";

interface HelpStepProps {
  vanSize: string;
  selected: string;
  onSelect: (option: string) => void;
}

// Help option selection — prices update based on van size
// Edit pricing in src/data/constants.ts (HELP_PRICING)
export default function HelpStep({ vanSize, selected, onSelect }: HelpStepProps) {
  const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;

  const options = [
    {
      id: "no-help",
      label: "No help needed",
      description: "Driver only — you load and unload",
      price: pricing.noHelp,
    },
    {
      id: "driver-help",
      label: "Driver help",
      description: "Driver will assist with carrying and loading",
      price: pricing.driverHelp,
    },
    {
      id: "driver-plus-helper",
      label: "Driver + helper",
      description: "Full team — ideal for heavier or larger moves",
      price: pricing.driverPlusHelper,
    },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Help option</h3>
      <p className="text-gray-500 text-sm mb-5">Choose how much assistance you need. Prices are per hour.</p>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`w-full text-left flex items-center justify-between border-2 rounded-xl p-4 transition-all ${
              selected === opt.id
                ? "border-purple-700 bg-purple-50"
                : "border-gray-100 bg-white hover:border-purple-300"
            }`}
            data-testid={`help-option-${opt.id}`}
          >
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{opt.label}</h4>
              <p className="text-gray-500 text-xs mt-0.5">{opt.description}</p>
            </div>
            <div className={`text-base font-bold ml-4 flex-shrink-0 ${selected === opt.id ? "text-purple-700" : "text-gray-700"}`}>
              £{opt.price}/hr
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
