import { Link } from "wouter";
import { CheckCircle2, Home, MessageCircle } from "lucide-react";
import { CONTACT } from "@/data/constants";

export default function PaymentSuccessPage() {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
            <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.8} />
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment successful
        </h1>

        {/* Primary message */}
        <p className="text-gray-600 text-base mb-2">
          Thank you — your deposit has been received.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Your booking is now secured.
          <br className="hidden sm:block" />
          If you need to make any changes, please contact us.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Message us on WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl px-6 py-3 text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
