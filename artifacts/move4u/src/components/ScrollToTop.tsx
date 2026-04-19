import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls the window to the top whenever the route path changes.
 * Skipped if the URL contains a hash (so anchor links to homepage
 * sections like /#services still scroll to that section).
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}
