import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { hasPendingScrollTarget } from "@/lib/sectionNav";

/**
 * Scrolls the window to the top whenever the route path changes — and on
 * page refresh / first mount. We also disable the browser's automatic
 * scroll restoration so reloads always land at the top of the page,
 * even in mobile Safari and in-app browsers (Telegram, Instagram) which
 * tend to hold the previous scroll position on reload.
 *
 * Skipped if:
 *   - the URL contains a hash (native anchor handling), or
 *   - a section nav is pending (HomePage will jump to that section
 *     in its own layout effect, and we don't want to flash to top first).
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  // Disable browser scroll restoration once on mount so refreshes never
  // restore the previous scroll position. Also force a top scroll on the
  // very first mount (covers the cold-load / refresh case).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {
        // Some embedded browsers throw on this — safe to ignore.
      }
    }
    if (window.location.hash) return;
    if (hasPendingScrollTarget()) return;
    // Defer to the next frame so iOS Safari / Telegram in-app browsers
    // don't snap back after their own restoration pass.
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    if (hasPendingScrollTarget()) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}
