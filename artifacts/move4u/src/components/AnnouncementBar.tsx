import { useEffect, useState } from "react";

const MESSAGES = [
  "We move things. You move on.",
  "Same-day service available",
  "From £35/hour in London",
  "Fast. Reliable. Professional.",
];

const ROTATE_MS = 4000;
const FADE_MS = 450;

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, FADE_MS);
      return () => clearTimeout(swap);
    }, ROTATE_MS);
    return () => clearInterval(tick);
  }, []);

  return (
    <div
      className="w-full text-white text-center select-none"
      style={{
        /* Subtle gradient sampled from the M4U logo: lighter purple at the
           edges, deeper purple in the centre — same shape as the logo's
           own light-to-dark inner falloff. Smooth, premium, never neon. */
        backgroundImage:
          "linear-gradient(90deg, #461A9E 0%, #2C0966 50%, #461A9E 100%)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[28px] md:h-[32px] flex items-center justify-center overflow-hidden">
        <span
          key={index}
          className="text-[11px] md:text-[12px] font-medium tracking-wide whitespace-nowrap transition-all ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-4px)",
            transitionDuration: `${FADE_MS}ms`,
          }}
        >
          {MESSAGES[index]}
        </span>
      </div>
    </div>
  );
}
