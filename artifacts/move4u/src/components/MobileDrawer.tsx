import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  X,
  ChevronDown,
  Home,
  FileText,
  Shield,
  CreditCard,
  XCircle,
  Tag,
  Truck,
  Recycle,
  Phone,
  Compass,
  Briefcase,
  BookOpen,
} from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Scroll to a section on the home page (handles cross-page nav). */
  onSectionLink: (id: string) => void;
  /** Always go to the very top of the homepage. */
  onHome: () => void;
}

interface DrawerLinkRow {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const POLICY_LINKS: DrawerLinkRow[] = [
  { href: "/pricing", label: "Pricing Guide", Icon: Tag },
  { href: "/van-guide", label: "Van Size Guide", Icon: Truck },
  { href: "/waste-guide", label: "Waste Removal Guide", Icon: Recycle },
  { href: "/booking-policy", label: "Booking Policy", Icon: CreditCard },
  { href: "/cancellation-policy", label: "Cancellation Policy", Icon: XCircle },
  { href: "/terms", label: "Terms & Conditions", Icon: FileText },
  { href: "/privacy", label: "Privacy Policy", Icon: Shield },
];

/**
 * Side drawer mobile menu — slides in from the right with a dimmed
 * overlay behind it. Designed to feel like a modern booking-app menu.
 *
 * Structure (top → bottom):
 *   Main nav: Home, Services, How It Works, Pricing, Contact (one tap each)
 *   Policies & Guides (collapsible)
 *   Pinned CTAs: Get a Quote, Book Now
 *
 * Each main nav item is a single, intentional destination — no nested
 * service list under "Services" so the menu never feels repetitive.
 */
export default function MobileDrawer({
  open,
  onClose,
  onSectionLink,
  onHome,
}: MobileDrawerProps) {
  const [policiesOpen, setPoliciesOpen] = useState(false);

  // Reset the collapsible to closed every time the drawer opens so the
  // first impression is always clean and compact.
  useEffect(() => {
    if (open) setPoliciesOpen(false);
  }, [open]);

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

      {/* Drawer panel — soft off-white surface with a faint lavender wash so
          it ties to the header without feeling stark. */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-[100dvh] w-[86%] max-w-[340px] shadow-2xl rounded-l-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          // Clean near-white surface — the drawer should feel light and
          // airy, not a heavy lavender block. Brand purple stays reserved
          // for the logo, the pinned Book Now CTA, and key icons.
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(180deg, #fbfafe 0%, #ffffff 14%, #ffffff 100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        data-testid="mobile-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            data-testid="mobile-drawer-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {/* Main nav */}
          <SectionLabel>Navigate</SectionLabel>

          <NavRow
            icon={<Home className="w-[18px] h-[18px] text-gray-500" />}
            label="Home"
            onClick={onHome}
            testId="drawer-home"
          />
          <NavRow
            icon={<Briefcase className="w-[18px] h-[18px] text-gray-500" />}
            label="Services"
            onClick={() => handleSection("services")}
            testId="drawer-services"
          />
          <NavRow
            icon={<Compass className="w-[18px] h-[18px] text-gray-500" />}
            label="How It Works"
            onClick={() => handleSection("how-it-works")}
            testId="drawer-how-it-works"
          />
          <NavRow
            icon={<Tag className="w-[18px] h-[18px] text-gray-500" />}
            label="Pricing"
            href="/pricing"
            onClick={onClose}
            testId="drawer-pricing"
          />
          <NavRow
            icon={<Phone className="w-[18px] h-[18px] text-gray-500" />}
            label="Contact"
            onClick={() => handleSection("contact")}
            testId="drawer-contact"
          />

          {/* Spacer */}
          <div className="h-3" />

          {/* Policies group */}
          <SectionLabel>More</SectionLabel>
          <Group
            label="Policies & Guides"
            icon={<BookOpen className="w-[18px] h-[18px] text-gray-500" />}
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
        </div>

        {/* Pinned CTAs */}
        <div
          className="border-t border-gray-100 p-4 space-y-2.5"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            backgroundColor: "rgba(255,255,255,0.96)",
          }}
        >
          <Link
            href="/book?action=quote"
            onClick={onClose}
            className="block w-full text-center font-semibold text-purple-700 border border-purple-200 px-4 py-3 rounded-full hover:bg-purple-50 transition-colors text-sm"
            data-testid="drawer-get-quote"
          >
            Get a Quote
          </Link>
          <Link
            href="/book"
            onClick={onClose}
            className="block w-full text-center font-semibold text-white px-4 py-3 rounded-full hover:opacity-95 transition-opacity text-sm shadow-[0_8px_20px_-10px_rgba(124,58,237,0.6)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #5b21b6 100%)",
            }}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mb-1.5 text-[10.5px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
      {children}
    </div>
  );
}

/**
 * Single nav row — works as either a wouter Link (when href is set) or a
 * button (when only onClick is set). Uniform spacing, subtle hover.
 */
function NavRow({
  icon,
  label,
  href,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  testId?: string;
}) {
  const className =
    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14.5px] font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors";

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className} data-testid={testId}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      data-testid={testId}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * Collapsible group — header row with icon + chevron, animated expanding
 * body for the inner links. Closed by default each time drawer opens.
 */
function Group({
  label,
  icon,
  open,
  onToggle,
  testId,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14.5px] font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-expanded={open}
        data-testid={testId}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-250 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-7 mr-1 my-1 pl-2 border-l border-gray-100 space-y-0.5">
            {children}
          </div>
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
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <Icon className="w-[15px] h-[15px] text-gray-400 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
