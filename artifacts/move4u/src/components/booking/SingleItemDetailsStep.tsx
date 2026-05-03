import { Info, Package, User, Users } from "lucide-react";
import { SINGLE_ITEM_HELPER_FEE } from "@/lib/pricing";

interface SingleItemDetailsStepProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  /** "driver-only" (default, included) or "driver-plus-helper" (+£30). */
  helperOption: string;
  onHelperChange: (value: string) => void;
}

/**
 * Single Item Delivery — simplified details step.
 *
 * Replaces the van + help selection that the standard flow uses with a
 * single required "What are you moving?" field plus a clear "Please
 * note" panel summarising the £60 / £30-per-30-min pricing and the
 * conditions (large/heavy items may need an extra team member, fragile
 * items must be packed, waiting time may apply, etc.).
 *
 * Photos are kept available so the team can review bulky / fragile
 * items accurately before pricing.
 */
export default function SingleItemDetailsStep({
  description,
  onDescriptionChange,
  helperOption,
  onHelperChange,
}: SingleItemDetailsStepProps) {
  const helperOptions: {
    id: string;
    label: string;
    sub: string;
    price: string;
    Icon: typeof User;
  }[] = [
    {
      id: "driver-only",
      label: "Driver will help",
      sub: "Included in price",
      price: "Included",
      Icon: User,
    },
    {
      id: "driver-plus-helper",
      label: "Driver + 1 extra helper",
      sub: "Faster & easier for heavy items",
      price: `+£${SINGLE_ITEM_HELPER_FEE}`,
      Icon: Users,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Tell us about your item
        </h3>
        <p className="text-gray-500 text-sm">
          A short description helps us prepare the right team and equipment.
        </p>
      </div>

      {/* Required item description field */}
      <div>
        <label
          htmlFor="single-item-description"
          className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1.5"
        >
          <Package className="w-4 h-4 text-purple-600" />
          What are you moving?
          <span className="text-red-500" aria-hidden>
            *
          </span>
        </label>
        <textarea
          id="single-item-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="e.g. Sofa, washing machine, table, wardrobe, fragile items, boxes, etc."
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors"
          data-testid="single-item-description"
          required
        />
        <p className="text-[12px] text-gray-500 mt-1.5 leading-snug">
          Please describe your item clearly so we can prepare the right
          equipment and team.
        </p>
      </div>

      {/* Help with loading — additive add-on. Driver-only is included
          in the £60 base; the extra helper is +£30 and adds to the
          estimated total. Defaults to driver-only. */}
      <div data-testid="single-item-help-section">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1.5">
          <Users className="w-4 h-4 text-purple-600" />
          Help with loading
        </label>
        <p className="text-[12px] text-gray-500 mb-2 leading-snug">
          The driver always helps. Add an extra helper for heavy or bulky items.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {helperOptions.map((opt) => {
            const selected = helperOption === opt.id;
            const Icon = opt.Icon;
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => onHelperChange(opt.id)}
                aria-pressed={selected}
                data-testid={`single-item-helper-${opt.id}`}
                className={`text-left rounded-xl border px-3.5 py-3 transition-colors flex items-start gap-2.5 ${
                  selected
                    ? "border-purple-500 bg-purple-50/60 ring-2 ring-purple-100"
                    : "border-gray-200 bg-white hover:border-purple-300"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    selected ? "text-purple-600" : "text-gray-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-gray-900 leading-snug">
                      {opt.label}
                    </p>
                    <span
                      className={`text-[12px] font-semibold tabular-nums shrink-0 ${
                        selected ? "text-purple-700" : "text-gray-500"
                      }`}
                    >
                      {opt.price}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                    {opt.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Please note — surfaces the operating rules so customers know
          exactly what to expect from a Single Item booking. */}
      <div
        className="bg-purple-50/70 border border-purple-100 rounded-xl p-4"
        data-testid="single-item-please-note"
      >
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="text-[13px] font-semibold text-gray-900">Please note</p>
        </div>
        <ul className="text-[12.5px] text-gray-700 space-y-1.5 list-disc pl-5 leading-relaxed">
          <li>Minimum charge is £60 (covers up to 1 hour).</li>
          <li>Additional time is charged at £30 per 30 minutes.</li>
          <li>
            If the item is large, heavy, bulky, or requires extra handling,
            an additional team member may be required and charged separately.
          </li>
          <li>
            Fragile or valuable items must be properly packed and protected
            before collection.
          </li>
          <li>
            If the item is not ready, not accessible, or delayed, waiting
            time may be charged.
          </li>
          <li>Final price will be confirmed after reviewing the request.</li>
        </ul>
      </div>
    </div>
  );
}
