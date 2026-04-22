import { Phone, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { CONTACT } from "@/data/constants";

// Premium contact strip — three intentional, refined cards.
// Less "blocky" than before: lighter borders, smaller icons, hairline
// dividers between label and CTA, soft purple glow on hover.
export default function ContactSection() {
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;

  return (
    <section id="contact" className="py-9 sm:py-16 bg-[#faf8fd]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-14">
          <p className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2">
            CONTACT
          </p>
          <h2 className="text-[22px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-1.5 sm:mb-2.5">
            Get in Touch
          </h2>
          <p className="text-gray-500 text-[13px] sm:text-base leading-relaxed">
            Ready to book or have a question? Reach us any time.
          </p>
        </div>

        {/* MOBILE: compact 3-button row — consistent neutral styling */}
        <div className="grid grid-cols-3 gap-2 sm:hidden max-w-md mx-auto">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 bg-white border border-[#eee] rounded-xl py-3.5 px-2 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_-12px_rgba(17,12,46,0.18)] active:scale-[0.97] transition-all duration-300"
            data-testid="contact-mobile-whatsapp"
          >
            <span className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <MessageCircle className="w-[17px] h-[17px]" strokeWidth={2.25} />
            </span>
            <span className="text-[12px] font-semibold text-gray-800">WhatsApp</span>
          </a>
          <a
            href={`tel:${CONTACT.driver}`}
            className="flex flex-col items-center justify-center gap-1.5 bg-white border border-[#eee] rounded-xl py-3.5 px-2 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_-12px_rgba(17,12,46,0.18)] active:scale-[0.97] transition-all duration-300"
            data-testid="contact-mobile-call"
          >
            <span className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <Phone className="w-[17px] h-[17px]" strokeWidth={2.25} />
            </span>
            <span className="text-[12px] font-semibold text-gray-800">Call</span>
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex flex-col items-center justify-center gap-1.5 bg-white border border-[#eee] rounded-xl py-3.5 px-2 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_-12px_rgba(17,12,46,0.18)] active:scale-[0.97] transition-all duration-300"
            data-testid="contact-mobile-email"
          >
            <span className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <Mail className="w-[17px] h-[17px]" strokeWidth={2.25} />
            </span>
            <span className="text-[12px] font-semibold text-gray-800">Email</span>
          </a>
        </div>

        {/* DESKTOP: three consistent neutral contact cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* WhatsApp */}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-[#eee] rounded-xl p-6 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(17,12,46,0.18)] transition-all duration-300"
            data-testid="contact-whatsapp"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-purple-50 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-gray-300 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                strokeWidth={2.25}
              />
            </div>
            <h3 className="font-semibold text-gray-900 text-[17px] tracking-tight mb-1">
              WhatsApp
            </h3>
            <p className="text-gray-500 text-[13px]">Fast reply</p>
          </a>

          {/* Call */}
          <a
            href={`tel:${CONTACT.driver}`}
            className="group bg-white border border-[#eee] rounded-xl p-6 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(17,12,46,0.18)] transition-all duration-300"
            data-testid="contact-call-driver"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-purple-50 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Phone className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-gray-300 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                strokeWidth={2.25}
              />
            </div>
            <h3 className="font-semibold text-gray-900 text-[17px] tracking-tight mb-1">
              Call
            </h3>
            <p className="text-gray-500 text-[13px]">Direct line</p>
          </a>

          {/* Email */}
          <a
            href={`mailto:${CONTACT.email}`}
            className="group bg-white border border-[#eee] rounded-xl p-6 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(17,12,46,0.18)] transition-all duration-300"
            data-testid="contact-email"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-purple-50 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Mail className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight
                className="w-4 h-4 text-gray-300 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                strokeWidth={2.25}
              />
            </div>
            <h3 className="font-semibold text-gray-900 text-[17px] tracking-tight mb-1">
              Email
            </h3>
            <p className="text-gray-500 text-[13px]">Quotes &amp; enquiries</p>
          </a>
        </div>
      </div>
    </section>
  );
}
