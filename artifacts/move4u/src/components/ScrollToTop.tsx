import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { hasPendingScrollTarget } from "@/lib/sectionNav";

/**
 * Scrolls the window to the top whenever the route path changes.
 * Skipped if:
 *   - the URL contains a hash (native anchor handling), or
 *   - a section nav is pending (HomePage will jump to that section
 *     in its own layout effect, and we don't want to flash to top first).
 *
 * Using useLayoutEffect avoids a paint at scroll position 0 on subpages.
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    if (hasPendingScrollTarget()) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}
