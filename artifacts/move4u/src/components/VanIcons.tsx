/**
 * VanIcons — three distinct side-profile van silhouettes used inside
 * the /house-moving pricing cards to visually convey small / medium /
 * large van size at a glance. Each SVG uses `currentColor` so the
 * caller controls the brand colour via Tailwind text-* classes.
 *
 * Aspect ratios are tuned so all three render at the same Tailwind
 * height while showing visibly different lengths / box heights:
 *   - Small  (panel van)  : short body
 *   - Medium (Sprinter)   : longer body, same height
 *   - Large  (Luton box)  : taller cargo box, longest body
 */

type VanIconProps = { className?: string };

export function SmallVanIcon({ className }: VanIconProps) {
  return (
    <svg
      viewBox="0 0 80 50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body (fill + outline) */}
      <path
        d="M4 36 V18 H22 L28 8 H62 V36 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M4 36 V18 H22 L28 8 H62 V36"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cab window */}
      <path
        d="M30 16 L34 10 H44 V16 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Wheels */}
      <circle cx="16" cy="38" r="5" fill="currentColor" />
      <circle cx="16" cy="38" r="1.6" fill="white" />
      <circle cx="52" cy="38" r="5" fill="currentColor" />
      <circle cx="52" cy="38" r="1.6" fill="white" />
    </svg>
  );
}

export function MediumVanIcon({ className }: VanIconProps) {
  return (
    <svg
      viewBox="0 0 104 50"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 36 V18 H22 L28 8 H86 V36 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M4 36 V18 H22 L28 8 H86 V36"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 16 L34 10 H44 V16 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Side panel divider — hints at long-wheelbase */}
      <line
        x1="58"
        y1="20"
        x2="58"
        y2="34"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="16" cy="38" r="5" fill="currentColor" />
      <circle cx="16" cy="38" r="1.6" fill="white" />
      <circle cx="76" cy="38" r="5" fill="currentColor" />
      <circle cx="76" cy="38" r="1.6" fill="white" />
    </svg>
  );
}

export function LargeVanIcon({ className }: VanIconProps) {
  return (
    <svg
      viewBox="0 0 112 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Tall box cargo body — extends forward over the cab roof
          (Luton-style), making this van clearly the tallest of the three. */}
      <path
        d="M4 44 V8 H86 V44 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M4 44 V8 H86 V44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cab — shorter than the box, sits under it on the front-right */}
      <path
        d="M86 44 V24 H100 L106 32 V44 Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M86 24 H100 L106 32 V44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cab window */}
      <path
        d="M88 32 L92 26 H99 L103 32 Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Box / cab divider line */}
      <line
        x1="86"
        y1="24"
        x2="86"
        y2="44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Wheels */}
      <circle cx="22" cy="46" r="5.5" fill="currentColor" />
      <circle cx="22" cy="46" r="1.8" fill="white" />
      <circle cx="80" cy="46" r="5.5" fill="currentColor" />
      <circle cx="80" cy="46" r="1.8" fill="white" />
    </svg>
  );
}
