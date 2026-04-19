/**
 * Helpers for navigating to a section on the homepage from any page
 * without a visible "scroll to top first" flash.
 *
 * Flow:
 *  1. Caller stashes the target id under SCROLL_TARGET_KEY in sessionStorage
 *     and triggers SPA navigation to "/".
 *  2. ScrollToTop sees the pending target and skips its top-of-page scroll.
 *  3. HomePage reads the target in a layout effect and instantly jumps the
 *     window to the matching element before the browser paints, then clears
 *     the key. The user lands directly on the section, no flash.
 */
export const SCROLL_TARGET_KEY = "move4u:scrollTarget";

/**
 * Read the pending section target (if any) and clear it. Returns the id
 * to scroll to, or null when nothing is pending.
 */
export function consumeScrollTarget(): string | null {
  if (typeof window === "undefined") return null;
  const target = sessionStorage.getItem(SCROLL_TARGET_KEY);
  if (target) sessionStorage.removeItem(SCROLL_TARGET_KEY);
  return target;
}

/**
 * Whether a section target is currently pending. ScrollToTop uses this to
 * suppress its scroll-to-top behaviour during a section navigation.
 */
export function hasPendingScrollTarget(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SCROLL_TARGET_KEY) !== null;
}

/**
 * Helper kept for symmetry with the call sites — caller still uses wouter's
 * setLocation directly so React stays in control of routing. This stamps
 * the session target.
 */
export function queueHomeSection(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SCROLL_TARGET_KEY, id);
}
