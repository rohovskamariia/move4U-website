// ============================================================
// SECURE YOUR BOOKING PAGE
// ============================================================
// All visible text lives in the TEXT object below — edit it here
// to change anything shown on this page.
//
// STRIPE INTEGRATION:
// Search for "STRIPE_CONNECT_HERE" in this file to find the
// exact place where the payment handler should be wired up.
// ============================================================

import { useState } from "react";
import { Link } from "wouter";
import { ShieldCheck, Lock, CalendarCheck, CreditCard, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";
import { CONTACT } from "@/data/constants";

// ── STRIPE PAYMENT LINK ───────────────────────────────────────
// Paste your Stripe Payment Link URL here.
// Get it from: Stripe Dashboard → Payment Links → Copy link
// It looks like: https://buy.stripe.com/xxxxxxxxxxxxxxxx
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/YOUR_LINK_HERE";
// ─────────────────────────────────────────────────────────────

// ── Editable text ─────────────────────────────────────────────
const TEXT = {
  pageTitle: "Secure Your Booking",
  introParagraph1:
    "Your booking is only secured once the required deposit has been paid.",
  introParagraph2:
    "After we confirm availability, final details, and price, you may be asked to pay a deposit to secure your slot.",

  trustHeading: "Why pay a deposit?",
  trustItems: [
    { icon: "shield", text: "Secure, encrypted payment — your card details are never stored." },
    { icon: "calendar", text: "Your deposit locks in your booking slot exclusively for you." },
    { icon: "credit", text: "The remaining balance can be paid on the day of your move." },
    { icon: "ref", text: "Your booking reference is used to confirm and track your booking." },
  ],

  formHeading: "Your Booking Details",
  fieldLabels: {
    bookingRef: "Booking Reference",
    name: "Customer Name",
    phone: "Phone Number",
    agreedQuote: "Agreed Quote (£)",
    depositAmount: "Deposit Amount (£)",
  },
  fieldPlaceholders: {
    bookingRef: "e.g. MV4U-1001",
    name: "Your full name",
    phone: "Your phone number",
    agreedQuote: "e.g. 150",
    depositAmount: "e.g. 50",
  },

  depositHelperText:
    "Deposit is calculated automatically as 10% of the agreed quote (minimum £20).",

  paymentHeading: "Choose Payment Method",
  notSecuredNote:
    "Your booking is not fully secured until the deposit payment has been received.",

  payButtonText: "Pay Deposit",
  payingText: "Processing…",

  supportHeading: "Have questions before paying?",
  supportText:
    "If you have any questions before paying your deposit, please contact us.",

  helperText: "Already confirmed by our team?",
  helperLink: "You can secure your booking here.",

  confirmationTitle: "Deposit Received",
  confirmationLine1:
    "Thank you. Your deposit has been received and your booking is now secured.",
  confirmationLine2:
    "You will receive confirmation of your secured booking and your booking reference.",
};
// ── End of editable text ──────────────────────────────────────

type PayMethod = "apple" | "google" | "card";

export default function SecureBookingPage() {
  const [form, setForm] = useState({
    bookingRef: "",
    name: "",
    phone: "",
    agreedQuote: "",
  });
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const quoteNum = parseFloat(form.agreedQuote) || 0;
  const depositAmount = quoteNum > 0 ? Math.max(20, Math.round(quoteNum * 0.1 * 100) / 100) : 0;
  const depositDisplay = depositAmount > 0 ? `£${depositAmount.toFixed(2)}` : "—";

  const canSubmit =
    form.bookingRef.trim() &&
    form.name.trim() &&
    form.phone.trim() &&
    depositAmount > 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePay() {
    if (!canSubmit) return;
    // Opens the Stripe Payment Link in a new tab.
    // The customer completes payment on Stripe's hosted page.
    //
    // NEXT STEP — webhook integration:
    // When Stripe confirms payment it will POST to your webhook endpoint.
    // That webhook should: update Google Sheets column N to "Deposit paid"
    // and send a Telegram notification with the booking reference.
    // Implement this in artifacts/api-server/src/routes/bookings.ts
    // after the user confirms they want the webhook built.
    window.open(STRIPE_PAYMENT_LINK, "_blank", "noopener,noreferrer");
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PageHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
              <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {TEXT.confirmationTitle}
              </h2>
              {form.bookingRef && (
                <div className="inline-block bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-4">
                  <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mb-0.5">
                    Booking Reference
                  </p>
                  <p className="text-xl font-bold text-purple-700">{form.bookingRef.toUpperCase()}</p>
                </div>
              )}
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {TEXT.confirmationLine1}
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                {TEXT.confirmationLine2}
              </p>
            </div>
            <Link href="/" className="inline-block mt-8 text-sm text-purple-700 hover:underline">
              ← Back to homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader />

      <main className="flex-1 px-4 py-10 max-w-lg mx-auto w-full">

        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{TEXT.pageTitle}</h1>
          <p className="text-gray-600 text-sm leading-relaxed">{TEXT.introParagraph1}</p>
          <p className="text-gray-600 text-sm leading-relaxed mt-1">{TEXT.introParagraph2}</p>
        </div>

        {/* Trust section */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            {TEXT.trustHeading}
          </h2>
          <ul className="space-y-3">
            {TEXT.trustItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <TrustIcon type={item.icon} />
                <span className="text-sm text-gray-600 leading-snug">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Booking details form */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{TEXT.formHeading}</h2>
          <div className="space-y-4">
            {(
              [
                { key: "bookingRef", type: "text" },
                { key: "name", type: "text" },
                { key: "phone", type: "tel" },
                { key: "agreedQuote", type: "number" },
              ] as { key: keyof typeof form; type: string }[]
            ).map(({ key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {TEXT.fieldLabels[key]}
                  {key !== "agreedQuote" && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <input
                  type={type}
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  placeholder={TEXT.fieldPlaceholders[key]}
                  min={type === "number" ? "0" : undefined}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            ))}

            {/* Deposit — auto-calculated, read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {TEXT.fieldLabels.depositAmount}
              </label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-purple-700">
                {depositDisplay}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                {TEXT.depositHelperText}
              </p>
            </div>
          </div>
        </div>

        {/* Payment method picker */}
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{TEXT.paymentHeading}</h2>
          <div className="grid grid-cols-3 gap-3">
            <PayMethodButton
              active={payMethod === "apple"}
              onClick={() => setPayMethod("apple")}
              label="Apple Pay"
              logo={<ApplePayLogo />}
            />
            <PayMethodButton
              active={payMethod === "google"}
              onClick={() => setPayMethod("google")}
              label="Google Pay"
              logo={<GooglePayLogo />}
            />
            <PayMethodButton
              active={payMethod === "card"}
              onClick={() => setPayMethod("card")}
              label="Card"
              logo={<CreditCard className="w-6 h-6 text-gray-600" />}
            />
          </div>
        </div>

        {/* Not-secured note */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800 leading-snug">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          {TEXT.notSecuredNote}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={!canSubmit || submitting}
          className="w-full py-4 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-8"
        >
          <Lock className="w-4 h-4" />
          {submitting ? TEXT.payingText : TEXT.payButtonText}
        </button>

        {/* Support section */}
        <div className="border-t border-gray-100 pt-6 mb-6 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">{TEXT.supportHeading}</p>
          <p className="text-sm text-gray-500 mb-3">{TEXT.supportText}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${CONTACT.support}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              {CONTACT.supportDisplay}
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          <Lock className="w-3 h-3 inline mr-1" />
          Payments are processed securely. Your card details are never stored.
        </p>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function PageHeader() {
  return (
    <header className="border-b border-gray-100 px-4 py-4 flex items-center justify-between max-w-lg mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 text-purple-700 text-sm font-medium hover:text-purple-900 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Move4U
      </Link>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Lock className="w-3.5 h-3.5" />
        Secure payment
      </div>
    </header>
  );
}

function TrustIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 text-purple-600 mt-0.5 shrink-0";
  if (type === "shield") return <ShieldCheck className={cls} />;
  if (type === "calendar") return <CalendarCheck className={cls} />;
  if (type === "credit") return <CreditCard className={cls} />;
  return <CheckCircle className={cls} />;
}

function PayMethodButton({
  active,
  onClick,
  label,
  logo,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  logo: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-medium transition-all ${
        active
          ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-500"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      }`}
    >
      {logo}
      {label}
    </button>
  );
}

function ApplePayLogo() {
  return (
    <svg viewBox="0 0 50 20" className="h-5 w-auto" fill="currentColor">
      <text x="0" y="16" fontSize="16" fontFamily="system-ui, -apple-system" fontWeight="600">
        Pay
      </text>
    </svg>
  );
}

function GooglePayLogo() {
  return (
    <svg viewBox="0 0 60 24" className="h-5 w-auto">
      <text x="0" y="18" fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="500" fill="#5F6368">
        G Pay
      </text>
    </svg>
  );
}
