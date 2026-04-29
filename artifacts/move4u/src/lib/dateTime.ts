// Shared booking date / time-window helpers.
//
// These rules exist to stop customers from booking something that has
// already passed:
//   - Past calendar dates are blocked at the date input via `min={today}`
//     AND re-checked in JS at submit time (because some mobile browsers
//     ignore `min` if the user types directly).
//   - On TODAY, time windows whose end-hour is already in the past are
//     greyed out and cannot be submitted.
//
// All flows (House Move, Waste Removal, Single Item, Commercial,
// International, Custom Request) call into this same module so the rule
// stays consistent.

export interface TimeWindow {
  /** Display label shown to the customer. */
  label: string;
  /** End hour in 24h local time. After this hour, the slot is "passed". */
  endHour: number;
}

/**
 * Canonical list of bookable time windows. Order matters — it controls
 * the on-screen order of the slot buttons.
 *
 * The end-hour is intentionally inclusive of the slot's display range
 * (Morning ends 12:00, Afternoon ends 17:00, Evening ends 24:00) so the
 * "is this slot in the past?" check is `now.getHours() >= endHour`.
 */
export const TIME_WINDOWS: ReadonlyArray<TimeWindow> = [
  { label: "Morning (8am–12pm)",  endHour: 12 },
  { label: "Afternoon (12pm–5pm)", endHour: 17 },
  { label: "Evening (5pm–12am)",   endHour: 24 },
];

/** Today's date as `YYYY-MM-DD` in the browser's local time zone. */
export function todayIso(): string {
  // We deliberately don't use `toISOString()` — that returns UTC, which
  // for a London user on BST near midnight would mis-classify the day.
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" string as a LOCAL calendar date. We never use
 * `new Date(str)` for date-only inputs because the JS spec treats the
 * short ISO form as UTC midnight, which silently shifts the day in any
 * non-UTC zone.
 */
function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** True iff `dateStr` represents today's local calendar date. */
export function isToday(dateStr: string): boolean {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth()    === t.getMonth() &&
    d.getDate()     === t.getDate()
  );
}

/** True iff `dateStr` is a calendar date strictly before today. */
export function isPastDate(dateStr: string): boolean {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() < t.getTime();
}

/**
 * Whether a time window should be disabled given the selected date.
 * Future dates → never disabled. Today → disabled iff the slot's end
 * hour is in the past relative to `now`.
 */
export function isSlotDisabled(
  windowEndHour: number,
  dateStr: string,
  now: Date = new Date(),
): boolean {
  if (!isToday(dateStr)) return false;
  return now.getHours() >= windowEndHour;
}

/** True iff every slot for the given date is in the past. */
export function allSlotsPassed(dateStr: string, now: Date = new Date()): boolean {
  if (!isToday(dateStr)) return false;
  return TIME_WINDOWS.every((w) => isSlotDisabled(w.endHour, dateStr, now));
}

/**
 * Final submit-time guard. Returns true iff the date+timeWindow combo
 * represents a valid future booking slot. Use this to belt-and-brace
 * client-side validation right before posting to the server.
 */
export function isValidFutureDateTime(
  dateStr: string,
  timeWindowLabel: string,
  now: Date = new Date(),
): boolean {
  if (!dateStr || !timeWindowLabel) return false;
  if (isPastDate(dateStr)) return false;
  const slot = TIME_WINDOWS.find((w) => w.label === timeWindowLabel);
  if (!slot) return false;
  if (isSlotDisabled(slot.endHour, dateStr, now)) return false;
  return true;
}
