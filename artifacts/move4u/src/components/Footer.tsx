import { Link } from "wouter";
import { CONTACT } from "@/data/constants";

const REVIEW_LINKS = [
  {
    label: "Google",
    href: "https://g.page/r/CcLgDnAXKxpzEAE/review",
  },
  {
    label: "Trustpilot",
    href: "https://uk.trustpilot.com/review/move4u.uk",
  },
  {
    label: "Nextdoor",
    href: "https://nextdoor.co.uk/page/move4u-6dq7am?share_platform=10&utm_campaign=1783353258343&share_action_id=9d28e44b-0761-4467-aed3-9d15c46c70d8",
  },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/move4u.uk",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1GjrWcTogU/?mibextid=wwXIfr",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-8 sm:pt-14 pb-5 sm:pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Brand block */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-1.5 font-bold text-lg sm:text-xl text-white mb-2 sm:mb-3">
            <span
              className="block w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden"
              aria-hidden="true"
            >
              <img
                src="/m4u-icon.webp"
                width={128}
                height={128}
                alt="Move4U logo — London removals and man and van service"
                className="w-full h-full object-cover scale-[1.12] select-none block"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </span>
            Move4U
          </div>
          <p className="text-gray-400 text-[13px] sm:text-sm leading-relaxed max-w-md">
            Professional moving, delivery and waste removal services across London.
          </p>
        </div>

        {/* Mobile: 2 columns. Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 sm:gap-x-8 gap-y-6 sm:gap-y-8 mb-7 sm:mb-10">
          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-[13px] sm:text-sm mb-2.5 sm:mb-4">Services</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-sm">
              <li><Link href="/book/house-move" className="hover:text-purple-400 transition-colors">House Moving</Link></li>
              <li><Link href="/waste-removal" className="hover:text-purple-400 transition-colors">Waste Removal</Link></li>
              <li><Link href="/book/single-item" className="hover:text-purple-400 transition-colors">Single Item Delivery</Link></li>
              <li><Link href="/book/commercial-move" className="hover:text-purple-400 transition-colors">Commercial Moving</Link></li>
              <li><Link href="/book/international" className="hover:text-purple-400 transition-colors">International Moving</Link></li>
              <li><Link href="/book/something-else" className="hover:text-purple-400 transition-colors">Custom Request</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-[13px] sm:text-sm mb-2.5 sm:mb-4">Contact</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-sm">
              <li><a href={`tel:${CONTACT.driver}`} className="hover:text-purple-400 transition-colors">Driver: {CONTACT.driverDisplay}</a></li>
              <li><a href={`tel:${CONTACT.support}`} className="hover:text-purple-400 transition-colors">Support: {CONTACT.supportDisplay}</a></li>
              <li><a href={`mailto:${CONTACT.email}`} className="hover:text-purple-400 transition-colors break-all">{CONTACT.email}</a></li>
              <li>
                <a
                  href={CONTACT.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  Telegram: {CONTACT.telegramHandle}
                </a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-semibold text-[13px] sm:text-sm mb-2.5 sm:mb-4">Policies</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-sm">
              <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/booking-policy" className="hover:text-purple-400 transition-colors">Booking Policy</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-purple-400 transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Guides & Pricing */}
          <div>
            <h4 className="text-white font-semibold text-[13px] sm:text-sm mb-2.5 sm:mb-4">Guides &amp; Pricing</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[12.5px] sm:text-sm">
              <li><Link href="/pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
              <li><Link href="/van-guide" className="hover:text-purple-400 transition-colors">Van Size Guide</Link></li>
              <li><Link href="/waste-guide" className="hover:text-purple-400 transition-colors">Waste Load Guide</Link></li>
            </ul>
          </div>
        </div>

        {/* Review us & Follow us strip */}
        <div className="border-t border-gray-800 pt-5 sm:pt-6 pb-4 sm:pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-8">
            {/* Review us */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-gray-500 text-[11px] font-medium uppercase tracking-[0.18em] shrink-0">
                Review us
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {REVIEW_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-700 text-[11.5px] text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Divider — visible on desktop only */}
            <span className="hidden sm:block text-gray-700 text-base select-none">·</span>

            {/* Follow us */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-gray-500 text-[11px] font-medium uppercase tracking-[0.18em] shrink-0">
                Follow us
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SOCIAL_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-700 text-[11.5px] text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-4 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] sm:text-xs text-gray-500">
          <p>&copy; {year} Move4U. All rights reserved. London, UK.</p>
          <p>Self-employed removal service</p>
        </div>
      </div>
    </footer>
  );
}
