const TRUSTPILOT_URL = "https://uk.trustpilot.com/review/move4u.uk";

export default function TrustpilotBanner() {
  return (
    <section className="py-9 sm:py-12 bg-white border-t border-gray-100">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-purple-600 uppercase mb-2.5">
          Trustpilot
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2.5">
          Review Move4U on Trustpilot
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-sm mx-auto">
          Have you used Move4U? Share your experience and help other customers book with confidence.
        </p>
        <a
          href={TRUSTPILOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-2.5 rounded-full hover:-translate-y-0.5 transition-all text-sm shadow-sm"
        >
          Leave a Trustpilot Review
        </a>
      </div>
    </section>
  );
}
