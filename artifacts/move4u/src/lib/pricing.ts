// Centralised price computation helpers — single source of truth used by
// the booking summary, the final-submit step, and the admin display.
//
// The booking flow chooses an hourly van+help combination for House Move,
// Commercial Move and Small Move, but Single Item Delivery uses a fixed
// minimum-plus-half-hour formula that is INDEPENDENT of van/help.

import { HELP_PRICING, SINGLE_ITEM_PRICING } from "@/data/constants";

/**
 * Resolve the hourly rate for a given van size + help option.
 * Falls back to the medium-van noHelp rate for unknown combinations
 * so the UI never shows £NaN/hr.
 */
export function getHourlyRate(vanSize: string, helpOption: string): number {
  const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;
  if (helpOption === "driver-help") return pricing.driverHelp;
  if (helpOption === "driver-plus-helper") return pricing.driverPlusHelper;
  return pricing.noHelp;
}

/**
 * Single Item Delivery base price.
 *   £60 covers up to the first hour, then £30 per additional 30 minutes.
 *   - 1.0h → £60
 *   - 1.5h → £90
 *   - 2.0h → £120
 *
 * Hours are assumed to come from the 30-minute stepper, so we ceil to the
 * next half-hour to absorb any sub-step rounding (matches the booking
 * policy "5 minutes or more = add 30 minutes" rule).
 */
export function computeSingleItemBase(hours: number): number {
  const { baseCharge, baseHours, extraHalfHourRate } = SINGLE_ITEM_PRICING;
  if (hours <= baseHours) return baseCharge;
  const extraHours = hours - baseHours;
  const extraHalves = Math.ceil(extraHours / 0.5);
  return baseCharge + extraHalves * extraHalfHourRate;
}

/**
 * Whether the given service id uses the Single Item formula.
 */
export function isSingleItem(serviceId: string): boolean {
  return serviceId === "single-item";
}

/**
 * Compute the time-portion of the price for a service.
 *   - single-item → fixed formula (van/help ignored)
 *   - everything else → hourly rate × hours
 */
export function computeBaseServiceCharge(
  serviceId: string,
  vanSize: string,
  helpOption: string,
  hours: number,
): number {
  if (isSingleItem(serviceId)) return computeSingleItemBase(hours);
  return getHourlyRate(vanSize, helpOption) * hours;
}
