// Fixed top-bar tagline — never rotates. Single, stable brand line.
const MESSAGE = "We move things. You move on.";

export default function AnnouncementBar() {
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
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[28px] md:h-[32px] flex items-center justify-center overflow-hidden">
        <span className="text-[11px] md:text-[12px] font-medium tracking-wide whitespace-nowrap">
          {MESSAGE}
        </span>
      </div>
    </div>
  );
}
