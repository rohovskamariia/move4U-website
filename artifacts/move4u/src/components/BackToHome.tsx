import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SCROLL_TARGET_KEY } from "@/lib/sectionNav";

/**
 * Subtle "← Back to home" link shown near the top of every non-home page
 * (booking flows, service pages, guides, policies). Always lands the user
 * at the very top of the homepage — never on a stale section anchor.
 */
export default function BackToHome({
  className = "",
}: {
  className?: string;
}) {
  const [, setLocation] = useLocation();

  const goHome = () => {
    // Clear any pending section target so the home page lands at the top.
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SCROLL_TARGET_KEY);
    }
    setLocation("/");
  };

  return (
    <button
      type="button"
      onClick={goHome}
      className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-purple-700 transition-colors ${className}`}
      data-testid="back-to-home"
    >
      <ArrowLeft className="w-[15px] h-[15px]" strokeWidth={2.25} />
      Back to home
    </button>
  );
}
