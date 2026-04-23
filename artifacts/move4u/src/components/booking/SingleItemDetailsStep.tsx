import { Info, Package } from "lucide-react";

interface SingleItemDetailsStepProps {
  description: string;
  onDescriptionChange: (value: string) => void;
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
}: SingleItemDetailsStepProps) {
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
