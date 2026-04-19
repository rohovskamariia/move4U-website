import { Phone, Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { CONTACT } from "@/data/constants";

// Premium contact strip — three intentional, refined cards.
// Less "blocky" than before: lighter borders, smaller icons, hairline
// dividers between label and CTA, soft purple glow on hover.
export default function ContactSection() {
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappDefaultMessage)}`;

  return (
    <section id="contact" className="py-12 sm:py-16 bg-[#faf8fd]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-purple-700 mb-2.5">
            CONTACT
          </p>
          <h2 className="text-[26px] sm:text-4xl font-bold text-gray-900 tracking-tight mb-2.5">
            Get in Touch
          </h2>
          <p className="text-gray-500 text-[14px] sm:text-base leading-relaxed">
            Ready to book or have a question? Reach us any time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
          {/* WhatsApp — premium gradient, primary contact method */}
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-green-600 text-white rounded-3xl p-6 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(34,197,94,0.25)] hover:-translate-y-1 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(34,197,94,0.55)] transition-all duration-300"
            data-testid="contact-whatsapp"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-start justify-between mb-5">
              <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2.25} />
            </div>
            <p className="text-white/80 text-[11px] font-semibold tracking-wider uppercase mb-1">Fastest reply</p>
            <h3 className="font-semibold text-white text-[17px] tracking-tight mb-1">WhatsApp Us</h3>
            <p className="text-green-50/90 text-[13px]">Usually within minutes</p>
          </a>

          {/* Call — soft purple */}
          <a
            href={`tel:${CONTACT.driver}`}
            className="group relative bg-white rounded-3xl p-6 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.06)] hover:-translate-y-1 hover:ring-purple-200/70 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(124,58,237,0.3)] transition-all duration-300"
            data-testid="contact-call-driver"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-purple-50 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Phone className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2.25} />
            </div>
            <p className="text-purple-700 text-[11px] font-semibold tracking-wider uppercase mb-1">Direct line</p>
            <h3 className="font-semibold text-gray-900 text-[17px] tracking-tight mb-1">Call Us</h3>
            <p className="text-gray-500 text-[13px] tabular-nums">{CONTACT.driverDisplay}</p>
          </a>

          {/* Email */}
          <a
            href={`mailto:${CONTACT.email}`}
            className="group relative bg-white rounded-3xl p-6 ring-1 ring-gray-100/80 shadow-[0_2px_6px_-2px_rgba(17,12,46,0.04),_0_10px_30px_-12px_rgba(17,12,46,0.06)] hover:-translate-y-1 hover:ring-purple-200/70 hover:shadow-[0_4px_10px_-2px_rgba(17,12,46,0.06),_0_24px_50px_-18px_rgba(124,58,237,0.3)] transition-all duration-300"
            data-testid="contact-email"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="bg-purple-50 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Mail className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-purple-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2.25} />
            </div>
            <p className="text-purple-700 text-[11px] font-semibold tracking-wider uppercase mb-1">Quotes & questions</p>
            <h3 className="font-semibold text-gray-900 text-[17px] tracking-tight mb-1">Email Us</h3>
            <p className="text-gray-500 text-[13px] break-all">{CONTACT.email}</p>
          </a>
        </div>
      </div>
    </section>
  );
}
