import { Phone, Mail, MessageCircle, Send } from "lucide-react";
import { CONTACT } from "@/data/constants";

// Edit contact details in src/data/constants.ts
export default function ContactSection() {
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;
  const viberHref = `viber://chat?number=${encodeURIComponent(CONTACT.viber)}`;

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-purple-700 mb-2">CONTACT</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Ready to book or have a question? Reach us any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {/* WhatsApp — primary */}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all group"
            data-testid="contact-whatsapp"
          >
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white mb-1">WhatsApp Us</h3>
            <p className="text-green-50 text-xs mb-4">Fastest reply</p>
            <span className="inline-block text-xs font-semibold bg-white text-green-700 py-2 px-4 rounded-full">
              Open WhatsApp
            </span>
          </a>

          {/* Call */}
          <a
            href={`tel:${CONTACT.driver}`}
            className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center hover:shadow-md hover:border-purple-300 hover:-translate-y-1 transition-all group"
            data-testid="contact-call-driver"
          >
            <div className="bg-purple-700 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-800 transition-colors">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
            <p className="text-gray-500 text-xs mb-4">{CONTACT.driverDisplay}</p>
            <span className="inline-block text-xs font-semibold bg-purple-700 text-white py-2 px-4 rounded-full">
              Call Now
            </span>
          </a>

          {/* Viber */}
          <a
            href={viberHref}
            className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center hover:shadow-md hover:border-purple-300 hover:-translate-y-1 transition-all group"
            data-testid="contact-viber"
          >
            <div className="bg-[#7360f2] text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#5d4ad9] transition-colors">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Viber Us</h3>
            <p className="text-gray-500 text-xs mb-4">{CONTACT.driverDisplay}</p>
            <span className="inline-block text-xs font-semibold bg-[#7360f2] text-white py-2 px-4 rounded-full">
              Open Viber
            </span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${CONTACT.email}`}
            className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center hover:shadow-md hover:border-purple-300 hover:-translate-y-1 transition-all group"
            data-testid="contact-email"
          >
            <div className="bg-purple-700 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-800 transition-colors">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
            <p className="text-gray-500 text-xs mb-4 break-all">{CONTACT.email}</p>
            <span className="inline-block text-xs font-semibold bg-purple-700 text-white py-2 px-4 rounded-full">
              Send Email
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
