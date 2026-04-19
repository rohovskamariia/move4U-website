import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  X,
  ChevronDown,
  Home,
  Trash2,
  Package,
  Building2,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  CreditCard,
  XCircle,
  Tag,
  Truck,
  Recycle,
  Phone,
  Star,
  Compass,
} from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Scroll to a section on the home page (handles cross-page nav). */
  onSectionLink: (id: string) => void;
}

interface DrawerLinkRow {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_LINKS: DrawerLinkRow[] = [
  { href: "/book/house", label: "House Moving", Icon: Home },
  { href: "/book/waste", label: "Waste Removal", Icon: Trash2 },
  { href: "/book/single-item", label: "Single Item Delivery", Icon: Package },
  { href: "/book/commercial", label: "Commercial Moving", Icon: Building2 },
  { href: "/book/international", label: "International Moving", Icon: Globe },
  { href: "/book/something-else", label: "Custom Request", Icon: HelpCircle },
];

const POLICY_LINKS: DrawerLinkRow[] = [
  { href: "/terms", label: "Terms & Conditions", Icon: FileText },
  { href: "/privacy", label: "Privacy Policy", Icon: Shield },
  { href: "/booking-policy", label: "Booking Policy", Icon: CreditCard },
  { href: "/cancellation-policy", label: "Cancellation Policy", Icon: XCircle },
  { href: "/pricing-guide", label: "Pricing Guide", Icon: Tag },
  { href: "/van-guide", label: "Van Size Guide", Icon: Truck },
  { href: "/waste-guide", label: "Waste Load Guide", Icon: Recycle },
];

/**
 * Side drawer mobile menu — slides in from the right with a dimmed
 * overlay behind it. Designed to feel like a modern booking-app menu
 * (Uber / Bolt / Deliveroo). Includes collapsible Services and Policies
 * sections plus pinned CTA buttons at the bottom.
 */
export default function MobileDrawer({
  open,
  onClose,
  onSectionLink,
}: MobileDrawerProps) {
  const [servicesOpen, setServicesOpen] = useState(true);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  // Lock body scroll while open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleSection = (id: string) => {
    onClose();
    onSectionLink(id);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-[100dvh] w-[85%] max-w-[320px] bg-white shadow-2xl rounded-l-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        data-testid="mobile-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-bold text-purple-700">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200"
            data-testid="mobile-drawer-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {/* Services group */}
          <Group
            label="Services"
            open={servicesOpen}
            onToggle={() => setServicesOpen((v) => !v)}
            testId="drawer-group-services"
          >
            {SERVICE_LINKS.map(({ href, label, Icon }) => (
              <DrawerLink
                key={href}
                href={href}
                label={label}
                Icon={Icon}
                onClick={onClose}
              />
            ))}
          </Group>

          {/* Policies group */}
          <Group
            label="Policies & Guides"
            open={policiesOpen}
            onToggle={() => setPoliciesOpen((v) => !v)}
            testId="drawer-group-policies"
          >
            {POLICY_LINKS.map(({ href, label, Icon }) => (
              <DrawerLink
                key={href}
                href={href}
                label={label}
                Icon={Icon}
                onClick={onClose}
              />
            ))}
          </Group>

          {/* Other */}
          <div className="mt-2 mb-1 px-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            Other
          </div>
          <button
            type="button"
            onClick={() => handleSection("how-it-works")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            data-testid="drawer-how-it-works"
          >
            <Compass className="w-4 h-4 text-purple-600" />
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleSection("reviews")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            data-testid="drawer-reviews"
          >
            <Star className="w-4 h-4 text-purple-600" />
            Reviews
          </button>
          <button
            type="button"
            onClick={() => handleSection("contact")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            data-testid="drawer-contact"
          >
            <Phone className="w-4 h-4 text-purple-600" />
            Contact
          </button>
        </div>

        {/* Pinned CTAs */}
        <div className="border-t border-gray-100 p-4 space-y-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            href="/book?action=quote"
            onClick={onClose}
            className="block w-full text-center font-semibold text-purple-700 border-2 border-purple-200 px-4 py-3 rounded-full hover:bg-purple-50 transition-colors text-sm"
            data-testid="drawer-get-quote"
          >
            Get a Quote
          </Link>
          <Link
            href="/book"
            onClick={onClose}
            className="block w-full text-center font-semibold text-white bg-purple-700 px-4 py-3 rounded-full hover:bg-purple-800 transition-colors text-sm shadow-sm"
            data-testid="drawer-book-now"
          >
            Book Now
          </Link>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Subcomponents ---------------- */

function Group({
  label,
  open,
  onToggle,
  testId,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100"
        aria-expanded={open}
        data-testid={testId}
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-1 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DrawerLink({
  href,
  label,
  Icon,
  onClick,
}: DrawerLinkRow & { onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
    >
      <Icon className="w-4 h-4 text-purple-600 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
