import { Phone, Mail, MessageCircle } from "lucide-react";
import { CONTACT } from "@/data/constants";

// Edit contact details in src/data/constants.ts
export default function ContactSection() {
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;

  return (
    <section id="contact" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Ready to book or have a question? Contact us any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {/* Driver */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
            <div className="bg-purple-700 text-white w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Driver</h3>
            <p className="text-gray-500 text-xs mb-4">{CONTACT.driverDisplay}</p>
            <div className="flex flex-col gap-2">
              <a
                href={`tel:${CONTACT.driver}`}
                className="text-xs font-semibold text-white bg-purple-700 py-2 px-3 rounded-lg hover:bg-purple-800 transition-colors"
                data-testid="contact-call-driver"
              >
                Call Driver
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-green-700 border border-green-200 py-2 px-3 rounded-lg hover:bg-green-50 transition-colors"
                data-testid="contact-whatsapp"
              >
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
            <div className="bg-purple-700 text-white w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Support / Admin</h3>
            <p className="text-gray-500 text-xs mb-4">{CONTACT.supportDisplay}</p>
            <a
              href={`tel:${CONTACT.support}`}
              className="block text-xs font-semibold text-white bg-purple-700 py-2 px-3 rounded-lg hover:bg-purple-800 transition-colors"
              data-testid="contact-support-line"
            >
              Support Line
            </a>
          </div>

          {/* Email */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
            <div className="bg-purple-700 text-white w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Email</h3>
            <p className="text-gray-500 text-xs mb-4 break-all">{CONTACT.email}</p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="block text-xs font-semibold text-white bg-purple-700 py-2 px-3 rounded-lg hover:bg-purple-800 transition-colors"
              data-testid="contact-email"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
