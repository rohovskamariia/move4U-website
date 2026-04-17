import { Link } from "wouter";
import { Truck } from "lucide-react";
import { CONTACT } from "@/data/constants";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 pt-14 pb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 font-bold text-xl text-white mb-3">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-2 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              Move4U
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Professional moving, delivery and waste removal services across London.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/book/house-move" className="hover:text-purple-400 transition-colors">House Moving</Link></li>
              <li><Link href="/book/waste-removal" className="hover:text-purple-400 transition-colors">Waste Removal</Link></li>
              <li><Link href="/book/single-item" className="hover:text-purple-400 transition-colors">Single Item Delivery</Link></li>
              <li><Link href="/book/commercial-move" className="hover:text-purple-400 transition-colors">Commercial Moving</Link></li>
              <li><Link href="/book/international" className="hover:text-purple-400 transition-colors">International Moving</Link></li>
              <li><Link href="/#services" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={`tel:${CONTACT.driver}`} className="hover:text-purple-400 transition-colors">Driver: {CONTACT.driverDisplay}</a></li>
              <li><a href={`tel:${CONTACT.support}`} className="hover:text-purple-400 transition-colors">Support: {CONTACT.supportDisplay}</a></li>
              <li><a href={`mailto:${CONTACT.email}`} className="hover:text-purple-400 transition-colors break-all">{CONTACT.email}</a></li>
              <li><Link href="/#contact" className="hover:text-purple-400 transition-colors">All contact options</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Policies</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/booking-policy" className="hover:text-purple-400 transition-colors">Booking Policy</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-purple-400 transition-colors">Cancellation Policy</Link></li>
              <li><Link href="/pricing-guide" className="hover:text-purple-400 transition-colors">Pricing Guide</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {year} Move4U. All rights reserved. London, UK.</p>
          <p>Self-employed removal service</p>
        </div>
      </div>
    </footer>
  );
}
