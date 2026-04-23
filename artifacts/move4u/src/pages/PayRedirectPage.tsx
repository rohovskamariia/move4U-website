import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useNoIndex } from "@/lib/usePageMeta";

export default function PayRedirectPage() {
  useNoIndex();
  const [, params] = useRoute("/pay/:ref");
  const ref = params?.ref ?? "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) { setError("No booking reference found in this link."); return; }

    fetch(`/api/pay/${encodeURIComponent(ref)}`)
      .then(async (r) => {
        const data = (await r.json()) as { url?: string; error?: string };
        if (r.ok && data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error ?? "Payment link not found.");
        }
      })
      .catch(() => setError("Could not connect to server. Please try again."));
  }, [ref]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Payment link not found</h1>
          <p className="text-sm text-gray-500 mb-1">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact Move4U if you believe this is an error.
          </p>
          <Link href="/" className="inline-block text-sm text-purple-600 hover:underline font-medium">
            ← Back to Move4U
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-10 h-10 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p className="text-sm font-medium text-gray-700">Redirecting to your secure payment page…</p>
        <p className="text-xs text-gray-400 mt-2">Booking: {ref}</p>
      </div>
    </div>
  );
}
