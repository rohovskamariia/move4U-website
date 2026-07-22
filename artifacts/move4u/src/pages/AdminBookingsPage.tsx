import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  LogOut, Phone, MapPin, ExternalLink, AlertCircle, Loader2,
  MessageCircle, MessageSquare, Mail, PhoneCall, Plus, X, Trash2,
} from "lucide-react";
import { toE164, toWhatsAppDigits } from "@/lib/validators";
import { useNoIndex } from "@/lib/usePageMeta";
import { getHourlyRate } from "@/lib/pricing";
import { CONGESTION_CHARGE, OUTSIDE_M25_RATE, EXTRA_STOP_CHARGE } from "@/data/constants";

// ── Types ─────────────────────────────────────────────────────

interface AdminExtraStop {
  address: string;
  charge:  string;
  notes:   string;
}

interface AdminExtraCharge {
  type:   string;
  amount: string;
  notes:  string;
}

interface BookingRecord {
  rowNumber: number;
  timestamp: string;
  service: string;
  name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  vanSize: string;
  helpOption: string;
  estimatedPrice: string;
  date: string;
  notes: string;
  contactMethod: string;
  bookingStatus: string;
  paymentStatus: string;
  bookingReference: string;
  agreedQuote: string;
  depositAmount: string;
  confirmedDate: string;
  confirmedTime: string;
  driverNotes: string;
  paymentLink: string;
  photoUrls: string; // comma-separated serving URLs for uploaded photos
  timeWindow: string; // customer's preferred time slot (e.g. "Morning (8am–12pm)")
  invoiceId: string;
  invoiceUrl: string;
  invoiceType: string;
  // Extra detail columns AB–AQ
  pickupFloorDetail: string;
  extraStop1: string;
  extraStop2: string;
  extraStop3: string;
  dropoffFloorDetail: string;
  duration: string;
  hourlyRate: string;
  baseCharge: string;
  extraStopCharge: string;
  stairsCharge: string;
  congestionCharge: string;
  outsideM25Charge: string;
  confirmationSent: string;
  confirmationSentAt: string;
  confirmationSubject: string;
  confirmationSentBy: string;
  adminExtraStops:          string; // JSON [{address,charge,notes}]
  adminExtraCharges:        string; // JSON [{type,amount,notes}]
  telegramPaymentsMessageId: string; // AT
  isDeleted:                string; // AU
  deletedAt:                string; // AV
  deletedBy:                string; // AW
  previousBookingStatus:    string; // AX
}

interface EditForm {
  bookingStatus:     string;
  paymentStatus:     string;
  // Editable booking core
  service:           string;
  vanSize:           string;
  helpOption:        string;
  timeWindow:        string;
  // Scheduling
  agreedQuote:       string;
  depositAmount:     string;
  confirmedDate:     string;
  confirmedTime:     string;
  // Addresses & duration
  pickup:            string;
  dropoff:           string;
  duration:          string;
  // Notes
  driverNotes:       string;
  notes:             string;
  // Extra route stops
  adminExtraStops:   AdminExtraStop[];
  // Structured pricing fields (serialised to adminExtraCharges on save)
  pickupFloors:      string;   // floors as string, 0–8
  dropoffFloors:     string;
  congestionEntries: string;   // "0" | "1" | "2"
  outsideM25Miles:   string;   // miles as decimal string
  extraTimeMinutes:  string;   // "0" | "30" | "60" | "90" | "120" | "180"
  // Manual freeform charges (non-structured AdminExtraCharge entries)
  adminExtraCharges: AdminExtraCharge[];
}

// ── Constants ─────────────────────────────────────────────────

// Feature flag — must match server-side ENABLE_STRIPE_INVOICES env var.
// Keep false until the invoice feature is intentionally re-enabled.
const ENABLE_STRIPE_INVOICES = false;

const BOOKING_STATUSES   = ["New", "Contacted", "Confirmed", "Denied", "Booked", "Completed"];
const PAYMENT_STATUSES   = ["Unpaid", "Payment link ready", "Payment link sent", "Deposit paid", "Fully paid", "Payment failed", "Refunded"];
const STATUS_FILTERS     = ["All", "New", "Contacted", "Confirmed", "Booked", "Completed", "Denied", "Deleted"];

const SERVICE_OPTIONS    = ["House Moving", "Commercial Moving", "Single Item Delivery", "Waste Removal", "International Moving", "Something Else"];
const VAN_SIZE_OPTIONS   = ["Small Van", "Medium Van", "Large Van", "Luton Van"];
const HELP_OPTION_OPTIONS = ["No help needed", "Driver help", "Driver + Helper"];
const TIME_SLOT_OPTIONS  = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Flexible"];
const FLOOR_OPTIONS      = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
const EXTRA_TIME_OPTIONS = [
  { label: "None",        value: "0"   },
  { label: "+30 min",     value: "30"  },
  { label: "+1 hour",     value: "60"  },
  { label: "+1.5 hours",  value: "90"  },
  { label: "+2 hours",    value: "120" },
  { label: "+3 hours",    value: "180" },
];
const CONGESTION_OPTIONS = [
  { label: "None (£0)",       value: "0" },
  { label: `1 address (£${CONGESTION_CHARGE})`,  value: "1" },
  { label: `2 addresses (£${CONGESTION_CHARGE * 2})`, value: "2" },
];

function initEditForm(b: BookingRecord): EditForm {
  const safeParse = <T,>(s: string): T[] => { try { return JSON.parse(s || "[]") as T[]; } catch { return []; } };

  const allCharges = safeParse<AdminExtraCharge>(b.adminExtraCharges);
  const STRUCTURED = new Set(["Stairs - pickup", "Stairs - drop-off", "Congestion charge", "Outside M25", "Extra time"]);
  const find = (type: string) => allCharges.find((c) => c.type === type);

  const stairsPickup  = find("Stairs - pickup");
  const stairsDropoff = find("Stairs - drop-off");
  const congestion    = find("Congestion charge");
  const m25           = find("Outside M25");
  const extraTime     = find("Extra time");
  const manualCharges = allCharges.filter((c) => !STRUCTURED.has(c.type));

  function floorsFromCharge(c?: AdminExtraCharge): string {
    if (!c) return "0";
    const fromNotes = (c.notes || "").match(/^(\d+)/)?.[1];
    if (fromNotes) return String(Math.min(8, parseInt(fromNotes)));
    return String(Math.max(0, Math.min(8, Math.round(parseFloat(c.amount || "0") / 10))));
  }
  function entriesFromCharge(c?: AdminExtraCharge): string {
    if (!c) return "0";
    const fromNotes = (c.notes || "").match(/^(\d+)/)?.[1];
    if (fromNotes) return String(Math.min(2, parseInt(fromNotes)));
    return String(Math.max(0, Math.min(2, Math.round(parseFloat(c.amount || "0") / CONGESTION_CHARGE))));
  }
  function milesFromCharge(c?: AdminExtraCharge): string {
    if (!c) return "";
    const fromNotes = (c.notes || "").match(/^(\d+(?:\.\d+)?)/)?.[1];
    return fromNotes || String(parseFloat(c.amount || "0"));
  }
  function minutesFromCharge(c?: AdminExtraCharge): string {
    if (!c) return "0";
    const fromNotes = (c.notes || "").match(/\+?(\d+)\s*min/)?.[1];
    if (!fromNotes) return "0";
    const v = parseInt(fromNotes);
    const valid = [30, 60, 90, 120, 180] as const;
    return String(valid.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a));
  }

  return {
    bookingStatus:     b.bookingStatus  || "New",
    paymentStatus:     b.paymentStatus  || "Unpaid",
    service:           b.service        || "",
    vanSize:           b.vanSize        || "",
    helpOption:        b.helpOption     || "",
    timeWindow:        b.timeWindow     || "",
    agreedQuote:       b.agreedQuote    || "",
    depositAmount:     b.depositAmount  || "",
    confirmedDate:     b.confirmedDate  || "",
    confirmedTime:     b.confirmedTime  || "",
    driverNotes:       b.driverNotes    || "",
    notes:             b.notes          || "",
    pickup:            b.pickup         || "",
    dropoff:           b.dropoff        || "",
    duration:          b.duration       || "",
    adminExtraStops:   safeParse<AdminExtraStop>(b.adminExtraStops),
    pickupFloors:      floorsFromCharge(stairsPickup),
    dropoffFloors:     floorsFromCharge(stairsDropoff),
    congestionEntries: entriesFromCharge(congestion),
    outsideM25Miles:   milesFromCharge(m25),
    extraTimeMinutes:  minutesFromCharge(extraTime),
    adminExtraCharges: manualCharges,
  };
}

// ── Quick-contact helpers ─────────────────────────────────────
//
// The booking system stores the customer's preferred contact method as a
// free-form string like "WhatsApp", "Phone", "Email — alice@x.com" or
// "Any — alice@x.com". These helpers normalise that into a single
// channel id and pull out the email when present.

type ContactChannel = "whatsapp" | "sms" | "email" | "call";

function parseEmailFromContactMethod(s: string): string {
  if (!s) return "";
  const m = s.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : "";
}

function normalizeChannel(contactMethod: string): ContactChannel | null {
  const s = (contactMethod || "").toLowerCase();
  if (!s) return null;
  if (s.includes("whatsapp")) return "whatsapp";
  if (s.includes("text") || s.includes("sms")) return "sms";
  if (s.includes("email")) return "email";
  if (s.includes("phone") || s.includes("call")) return "call";
  // "Any" or unknown — no strong preference
  return null;
}

const CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  call: "Call",
};

// Build the digits-only form wa.me requires. New bookings are stored in
// E.164 already, but legacy rows in the sheet may still be in raw form
// ("07123 456789", "0044…", etc) — toWhatsAppDigits handles both.
function normalizeUKPhone(phone: string): string {
  return toWhatsAppDigits(phone);
}

// Best-effort E.164 for tel: / sms: links. Falls back to whatever the
// admin saved if normalisation fails, so the link still tries to dial.
function dialablePhone(phone: string): string {
  return toE164(phone) || phone;
}

// Pre-filled greeting used when the booking is still NEW. The driver
// can keep typing after this as a normal conversation opener.
function buildIntroMessage(b: BookingRecord): string {
  const name = b.name?.trim() || "there";
  return (
    `Hi ${name},\n` +
    `this is Move4U regarding your booking (Reference: ${b.bookingReference}).\n` +
    `We're contacting you to confirm your booking details.`
  );
}

function buildContactHref(channel: ContactChannel, b: BookingRecord, message: string): string {
  const encoded = encodeURIComponent(message);
  const email = parseEmailFromContactMethod(b.contactMethod);
  switch (channel) {
    case "whatsapp": {
      const wa = normalizeUKPhone(b.phone);
      return `https://wa.me/${wa}?text=${encoded}`;
    }
    case "sms":
      // `sms:NUMBER?body=...` works on iOS, Android, and most desktop
      // handlers. Some older Android builds prefer `&body=` — modern
      // browsers normalise both.
      return `sms:${dialablePhone(b.phone)}?body=${encoded}`;
    case "email": {
      const addr = email || "";
      const subject = `Move4U — Booking ${b.bookingReference}`;
      return `mailto:${encodeURIComponent(addr)}?subject=${encodeURIComponent(subject)}&body=${encoded}`;
    }
    case "call":
      return `tel:${dialablePhone(b.phone)}`;
  }
}

function isChannelAvailable(channel: ContactChannel, b: BookingRecord): boolean {
  if (channel === "email") return Boolean(parseEmailFromContactMethod(b.contactMethod));
  // whatsapp / sms / call all need a phone number
  return Boolean(b.phone);
}

function calcSuggestedDeposit(quote: string): string {
  const n = parseFloat(quote);
  if (!n || n <= 0) return "";
  return (Math.round(n * 0.3 * 100) / 100).toFixed(2);
}

// ── Pricing engine helpers ────────────────────────────────────

function parseDurationToHours(duration: string): number {
  if (!duration) return 0;
  const m = duration.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]!) : 0;
}

function getVanPricingKey(vanSizeDisplay: string): string {
  const s = (vanSizeDisplay || "").toLowerCase();
  if (s.includes("small")) return "small";
  if (s.includes("large") || s.includes("luton")) return "large";
  return "medium";
}

function getHelpPricingKey(helpOptionDisplay: string): string {
  const s = (helpOptionDisplay || "").toLowerCase();
  if (s.includes("driver +") || s.includes("driver+") || s.includes("helper")) return "driver-plus-helper";
  if (s.includes("driver")) return "driver-help";
  return "no-help";
}

function helpWorkerCount(helpOptionDisplay: string): number {
  const key = getHelpPricingKey(helpOptionDisplay);
  if (key === "driver-plus-helper") return 2;
  if (key === "driver-help")        return 1;
  return 0;
}

function computeAdminPricing(form: EditForm): {
  base: number; extraTime: number; stairsPickup: number; stairsDropoff: number;
  ccz: number; m25: number; stopsTotal: number; manualTotal: number;
  total: number; hourlyRate: number;
} {
  const rate = getHourlyRate(getVanPricingKey(form.vanSize), getHelpPricingKey(form.helpOption));
  const dH   = parseDurationToHours(form.duration);
  const base = dH > 0 ? Math.max(2, dH) * rate : 0;

  const etMin     = parseInt(form.extraTimeMinutes || "0") || 0;
  const extraTime = etMin > 0 ? Math.round(rate * etMin / 60 * 100) / 100 : 0;

  const pF = parseInt(form.pickupFloors  || "0") || 0;
  const dF = parseInt(form.dropoffFloors || "0") || 0;
  const cE = parseInt(form.congestionEntries || "0") || 0;
  const miles = parseFloat(form.outsideM25Miles || "0") || 0;
  const workers = helpWorkerCount(form.helpOption);

  const stairsPickup  = pF * 10 * workers;
  const stairsDropoff = dF * 10 * workers;
  const ccz = cE * CONGESTION_CHARGE;
  const m25 = Math.round(miles * OUTSIDE_M25_RATE * 100) / 100;
  const stopsTotal  = form.adminExtraStops.reduce((s, x) => s + (parseFloat(x.charge) || 0), 0);
  const manualTotal = form.adminExtraCharges.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const total = base + extraTime + stairsPickup + stairsDropoff + ccz + m25 + stopsTotal + manualTotal;
  return { base, extraTime, stairsPickup, stairsDropoff, ccz, m25, stopsTotal, manualTotal, total, hourlyRate: rate };
}

// Serialises all pricing (structured + manual) into the adminExtraCharges JSON that gets saved.
function serializeAdminCharges(form: EditForm): string {
  const charges: AdminExtraCharge[] = [];
  const workers = helpWorkerCount(form.helpOption);
  const pF = parseInt(form.pickupFloors  || "0") || 0;
  if (pF > 0 && workers > 0) charges.push({ type: "Stairs - pickup",  amount: String(pF * 10 * workers), notes: `${pF} stair flight${pF !== 1 ? "s" : ""}${workers > 1 ? ` × ${workers}` : ""}` });
  const dF = parseInt(form.dropoffFloors || "0") || 0;
  if (dF > 0 && workers > 0) charges.push({ type: "Stairs - drop-off", amount: String(dF * 10 * workers), notes: `${dF} stair flight${dF !== 1 ? "s" : ""}${workers > 1 ? ` × ${workers}` : ""}` });
  const cE = parseInt(form.congestionEntries || "0") || 0;
  if (cE > 0) charges.push({ type: "Congestion charge", amount: String(cE * CONGESTION_CHARGE), notes: `${cE} entr${cE === 1 ? "y" : "ies"}` });
  const miles = parseFloat(form.outsideM25Miles || "0") || 0;
  if (miles > 0) charges.push({ type: "Outside M25", amount: String(Math.round(miles * OUTSIDE_M25_RATE * 100) / 100), notes: `${miles} miles` });
  const etMin = parseInt(form.extraTimeMinutes || "0") || 0;
  if (etMin > 0) {
    const rate = getHourlyRate(getVanPricingKey(form.vanSize), getHelpPricingKey(form.helpOption));
    charges.push({ type: "Extra time", amount: String(Math.round(rate * etMin / 60 * 100) / 100), notes: `+${etMin} min` });
  }
  charges.push(...form.adminExtraCharges);
  return JSON.stringify(charges);
}

function statusBadge(status: string) {
  // Brand-only palette — no blue. Different shades of purple/violet/fuchsia
  // keep statuses visually distinct while staying on-brand.
  const map: Record<string, string> = {
    New:        "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    Contacted:  "bg-amber-100 text-amber-700",
    Confirmed:  "bg-green-100 text-green-700",
    Denied:     "bg-red-100 text-red-700",
    Booked:     "bg-purple-100 text-purple-700",
    Completed:  "bg-gray-100 text-gray-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

function payBadge(status: string) {
  if (status === "Fully paid" || status === "Deposit paid") return "bg-green-100 text-green-700";
  if (status === "Payment link ready" || status === "Payment link sent") return "bg-fuchsia-100 text-fuchsia-700";
  if (status === "Payment failed") return "bg-red-100 text-red-600";
  if (status === "Refunded") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

// ── Waiting-time helpers ──────────────────────────────────────

type Priority = "normal" | "warning" | "urgent" | "overdue";

const NEEDS_ACTION = new Set(["", "New"]);

function parseTimestamp(ts: string): number {
  if (!ts) return 0;

  // Check for the legacy en-GB locale format FIRST, before passing anything
  // to new Date().
  //
  // Background: toLocaleString("en-GB") produces "03/05/2026, 15:30:00"
  // (DD/MM/YYYY with a comma).  V8's Date constructor parses that string
  // "successfully" but treats it as MM/DD (US order), so "03/05/2026"
  // becomes March 5 instead of 3 May — making every booking appear
  // ~59 days (~1415 h) old.
  //
  // Solution: detect the DD/MM/YYYY pattern explicitly, parse each
  // component by hand with Date.UTC, and never let the Date constructor
  // guess the locale.  The stored time is London local time (BST = UTC+1
  // in summer); treating it as UTC is at most 1 h off — negligible for
  // "N minutes / hours ago" display purposes.
  const legacy = ts.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2}):(\d{2})/,
  );
  if (legacy) {
    const [, dd, mm, yyyy, hh, min, sec] = legacy;
    return Date.UTC(+yyyy, +mm - 1, +dd, +hh, +min, +sec);
  }

  // ISO 8601 and any other standard format (new bookings store toISOString()).
  // e.g. "2026-05-03T15:30:00.000Z" — new Date() handles this correctly.
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function getWaitingInfo(timestamp: string): { label: string; priority: Priority; minutesAgo: number } {
  const ts = parseTimestamp(timestamp);
  if (!ts) return { label: "", priority: "normal", minutesAgo: 0 };
  const minutesAgo = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  let label: string;
  if (minutesAgo < 1)   label = "just now";
  else if (minutesAgo < 60) label = `${minutesAgo}m ago`;
  else {
    const h = Math.floor(minutesAgo / 60), mn = minutesAgo % 60;
    label = mn > 0 ? `${h}h ${mn}m ago` : `${h}h ago`;
  }
  const priority: Priority =
    minutesAgo < 15 ? "normal" :
    minutesAgo < 30 ? "warning" :
    minutesAgo < 60 ? "urgent"  : "overdue";
  return { label, priority, minutesAgo };
}

function priorityBadgeClass(p: Priority) {
  if (p === "warning") return "bg-amber-100 text-amber-700";
  if (p === "urgent")  return "bg-orange-100 text-orange-700";
  if (p === "overdue") return "bg-red-100 text-red-700";
  return "";
}

function priorityBadgeText(p: Priority) {
  if (p === "warning") return "Attention";
  if (p === "urgent")  return "Urgent";
  if (p === "overdue") return "Overdue";
  return "";
}

function priorityCardBorder(p: Priority) {
  if (p === "overdue") return "border-red-300";
  if (p === "urgent")  return "border-orange-300";
  if (p === "warning") return "border-amber-300";
  return "border-gray-200";
}

// ── Password gate ─────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (key: string) => void }) {
  const [pw, setPw] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: { "X-Admin-Key": pw },
      });
      if (res.ok) {
        onAuth(pw);
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Move4U Admin</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your admin password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Admin password"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!pw || checking}
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50"
          >
            {checking ? "Checking…" : "Sign in"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to website</Link>
        </div>
      </div>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────

export default function AdminBookingsPage() {
  useNoIndex();
  const [authed,        setAuthed]        = useState(() => !!sessionStorage.getItem("mv4u_admin_key"));
  const [adminKey,      setAdminKey]      = useState(() => sessionStorage.getItem("mv4u_admin_key") ?? "");
  const [bookings,      setBookings]      = useState<BookingRecord[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [fetchError,    setFetchError]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [expandedRef,   setExpandedRef]   = useState<string | null>(null);
  const [editForms,     setEditForms]     = useState<Record<string, EditForm>>({});
  const [depositOverridden, setDepositOverridden] = useState<Record<string, boolean>>({});
  const [savingRef,     setSavingRef]     = useState<string | null>(null);
  const [saveErrors,    setSaveErrors]    = useState<Record<string, string>>({});
  const [linkBusy,      setLinkBusy]      = useState<string | null>(null);
  const [linkErrors,    setLinkErrors]    = useState<Record<string, string>>({});
  const [copied,        setCopied]        = useState<string | null>(null);
  const [copiedMsg,     setCopiedMsg]     = useState<string | null>(null);
  const [invoiceBusy,   setInvoiceBusy]   = useState<string | null>(null);
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});
  const [invoiceModal,  setInvoiceModal]  = useState<string | null>(null); // ref of booking showing options
  const [copiedInvoice, setCopiedInvoice] = useState<string | null>(null);
  const [confirmBusy,   setConfirmBusy]   = useState<string | null>(null);
  const [emailPreview,  setEmailPreview]  = useState<{ ref: string; to: string; subject: string; body: string } | null>(null);
  const [emailSentRef,  setEmailSentRef]  = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({});
  const [paymentLinkType, setPaymentLinkType] = useState<Record<string, "deposit" | "remaining" | "full">>({});
  const [deletedBookings,           setDeletedBookings]           = useState<BookingRecord[]>([]);
  const [deletedFetched,            setDeletedFetched]            = useState(false);
  const [deletedLoading,            setDeletedLoading]            = useState(false);
  const [deleteConfirmRef,          setDeleteConfirmRef]          = useState<string | null>(null);
  const [deletingRef,               setDeletingRef]               = useState<string | null>(null);
  const [permanentDeleteConfirmRef, setPermanentDeleteConfirmRef] = useState<string | null>(null);
  const [permanentDeletingRef,      setPermanentDeletingRef]      = useState<string | null>(null);
  const [restoringRef,              setRestoringRef]              = useState<string | null>(null);
  const [selectedRefs,     setSelectedRefs]     = useState<Set<string>>(new Set());
  const [bulkConfirm,      setBulkConfirm]      = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);
  const [bulkBusy,         setBulkBusy]         = useState(false);
  const [bulkStatusPicker, setBulkStatusPicker] = useState<"status" | "payment" | null>(null);

  const apiFetch = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey, ...(init?.headers ?? {}) },
      }),
    [adminKey],
  );

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      // cache: 'no-store' tells the browser to bypass its HTTP cache and never
      // send If-None-Match, so the server always returns a fresh 200 with
      // current Sheets data rather than a stale 304.
      const res = await apiFetch("/api/admin/bookings", { cache: "no-store" });
      if (res.status === 401) { signOut(); return; }
      if (!res.ok) throw new Error("server error");
      const data = (await res.json()) as { bookings: BookingRecord[] };
      setBookings(data.bookings);
    } catch {
      setFetchError("Could not load bookings. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { if (authed) void fetchBookings(); }, [authed, fetchBookings]);

  function signOut() {
    sessionStorage.removeItem("mv4u_admin_key");
    setAuthed(false);
    setAdminKey("");
    setBookings([]);
  }

  function handleAuth(key: string) {
    sessionStorage.setItem("mv4u_admin_key", key);
    setAdminKey(key);
    setAuthed(true);
  }

  const fetchDeletedBookings = useCallback(async () => {
    setDeletedLoading(true);
    try {
      const res = await apiFetch("/api/admin/bookings?deleted=true", { cache: "no-store" });
      if (res.status === 401) { signOut(); return; }
      if (!res.ok) throw new Error("server error");
      const data = (await res.json()) as { bookings: BookingRecord[] };
      setDeletedBookings(data.bookings);
      setDeletedFetched(true);
    } catch {
      setDeletedFetched(true);
    } finally {
      setDeletedLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (statusFilter === "Deleted" && !deletedFetched) void fetchDeletedBookings();
  }, [statusFilter, deletedFetched, fetchDeletedBookings]);

  async function handleDeleteBooking(ref: string) {
    const booking = bookings.find((b) => b.bookingReference === ref);
    setDeletingRef(ref);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setBookings((prev) => prev.filter((b) => b.bookingReference !== ref));
      if (booking) {
        setDeletedBookings((prev) => [...prev, {
          ...booking, isDeleted: "true",
          deletedAt: new Date().toISOString(), deletedBy: "admin",
        }]);
      }
      setExpandedRef(null);
    } catch {
      // ignore
    } finally {
      setDeletingRef(null);
      setDeleteConfirmRef(null);
    }
  }

  async function handleRestoreBooking(ref: string) {
    const booking = deletedBookings.find((b) => b.bookingReference === ref);
    setRestoringRef(ref);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("restore failed");
      setDeletedBookings((prev) => prev.filter((b) => b.bookingReference !== ref));
      if (booking) {
        setBookings((prev) => [...prev, { ...booking, isDeleted: "false", deletedAt: "", deletedBy: "" }]);
      }
    } catch {
      // ignore
    } finally {
      setRestoringRef(null);
    }
  }

  async function handlePermanentDeleteBooking(ref: string) {
    setPermanentDeletingRef(ref);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}/permanent`, { method: "DELETE" });
      if (!res.ok) throw new Error("permanent delete failed");
      setDeletedBookings((prev) => prev.filter((b) => b.bookingReference !== ref));
    } catch {
      // ignore
    } finally {
      setPermanentDeletingRef(null);
      setPermanentDeleteConfirmRef(null);
    }
  }

  // ── Clear selection when filter tab changes ──────────────────
  useEffect(() => { setSelectedRefs(new Set()); setBulkStatusPicker(null); }, [statusFilter]);

  // ── Selection helpers ─────────────────────────────────────────
  function toggleSelect(ref: string) {
    setSelectedRefs((prev) => {
      const n = new Set(prev);
      n.has(ref) ? n.delete(ref) : n.add(ref);
      return n;
    });
  }

  function selectAll() {
    setSelectedRefs(new Set(filtered.map((b) => b.bookingReference)));
  }

  function clearSelection() {
    setSelectedRefs(new Set());
    setBulkStatusPicker(null);
  }

  // ── Bulk executors ────────────────────────────────────────────
  async function executeBulkDelete(refs: string[]) {
    setBulkBusy(true);
    try {
      // Use the bulk endpoint which processes refs SEQUENTIALLY on the server.
      // Never fire parallel individual deletes — concurrent Sheets API writes
      // get rate-limited (429) and updateBookingAdmin silently returns false,
      // causing the endpoint to return 200 even though nothing was persisted.
      await apiFetch("/api/admin/bookings/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ refs }),
      });
    } finally {
      // Always refetch from the server — never rely on optimistic local state
      // for destructive operations. This ensures the UI matches Sheets truth.
      setSelectedRefs(new Set());
      setBulkBusy(false);
      setBulkConfirm(null);
      await fetchBookings();
      await fetchDeletedBookings();
    }
  }

  async function executeBulkRestore(refs: string[]) {
    setBulkBusy(true);
    try {
      await apiFetch("/api/admin/bookings/bulk-restore", {
        method: "POST",
        body: JSON.stringify({ refs }),
      });
    } finally {
      setSelectedRefs(new Set());
      setBulkBusy(false);
      setBulkConfirm(null);
      await fetchBookings();
      await fetchDeletedBookings();
    }
  }

  async function executeBulkPermanentDelete(refs: string[]) {
    setBulkBusy(true);
    try {
      await apiFetch("/api/admin/bookings/bulk-permanent-delete", {
        method: "POST",
        body: JSON.stringify({ refs }),
      });
    } finally {
      setSelectedRefs(new Set());
      setBulkBusy(false);
      setBulkConfirm(null);
      await fetchBookings();
      await fetchDeletedBookings();
    }
  }

  async function executeBulkStatusChange(refs: string[], bookingStatus: string) {
    setBulkBusy(true);
    await Promise.allSettled(refs.map(async (ref) => {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT", body: JSON.stringify({ bookingStatus, notify: "false" }),
      });
      if (res.ok) setBookings((prev) => prev.map((b) => b.bookingReference === ref ? { ...b, bookingStatus } : b));
    }));
    setSelectedRefs(new Set());
    setBulkBusy(false);
    setBulkStatusPicker(null);
  }

  async function executeBulkPaymentStatusChange(refs: string[], paymentStatus: string) {
    setBulkBusy(true);
    await Promise.allSettled(refs.map(async (ref) => {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT", body: JSON.stringify({ paymentStatus, notify: "false" }),
      });
      if (res.ok) setBookings((prev) => prev.map((b) => b.bookingReference === ref ? { ...b, paymentStatus } : b));
    }));
    setSelectedRefs(new Set());
    setBulkBusy(false);
    setBulkStatusPicker(null);
  }

  function toggleExpand(ref: string, booking: BookingRecord) {
    if (expandedRef === ref) {
      setExpandedRef(null);
      return;
    }
    setExpandedRef(ref);
    // Always re-seed the edit form from the LATEST booking record for this
    // exact reference. This guarantees the panel never shows cached values
    // from a previously-opened booking — every expansion is keyed to its
    // own booking ID and pulls the freshest server state.
    setEditForms((prev) => ({ ...prev, [ref]: initEditForm(booking) }));
    // Reset the manual deposit-override flag too, so a new auto-suggested
    // deposit is computed from THIS booking's quote, not a previous one.
    // Preserve any existing deposit so admin quote changes don't wipe it out.
    // Only auto-suggest when the booking has no deposit yet.
    setDepositOverridden((prev) => ({
      ...prev,
      [ref]: !!booking.depositAmount,
    }));
    // Debug trace — confirms which booking the form is bound to.
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug(
        "[admin] expanded booking",
        ref,
        "quote=", booking.agreedQuote || "(none)",
        "photos=", booking.photoUrls ? booking.photoUrls.split(",").filter(Boolean).length : 0,
      );
    }
  }

  function updateField(ref: string, field: keyof EditForm, value: string) {
    if (field === "depositAmount") {
      setDepositOverridden((prev) => ({ ...prev, [ref]: true }));
    }
    setEditForms((prev) => {
      const form = { ...(prev[ref] ?? {}), [field]: value } as EditForm;
      if (field === "agreedQuote" && !depositOverridden[ref]) {
        form.depositAmount = calcSuggestedDeposit(value);
      }
      return { ...prev, [ref]: form };
    });
  }

  // ── Collapsible section helpers ──────────────────────────────
  function isSectionOpen(ref: string, name: string) {
    return expandedSections[ref]?.has(name) ?? false;
  }

  function toggleSection(ref: string, name: string) {
    setExpandedSections((prev) => {
      const s = new Set(prev[ref] ?? []);
      if (s.has(name)) s.delete(name); else s.add(name);
      return { ...prev, [ref]: s };
    });
  }

  // ── Extra stop helpers ───────────────────────────────────────
  function addExtraStop(ref: string) {
    setEditForms((prev) => ({
      ...prev,
      [ref]: { ...(prev[ref] ?? {}), adminExtraStops: [...(prev[ref]?.adminExtraStops ?? []), { address: "", charge: String(EXTRA_STOP_CHARGE), notes: "" }] } as EditForm,
    }));
  }

  function updateExtraStop(ref: string, idx: number, field: keyof AdminExtraStop, value: string) {
    setEditForms((prev) => {
      const stops = [...(prev[ref]?.adminExtraStops ?? [])];
      stops[idx] = { ...stops[idx], [field]: value };
      return { ...prev, [ref]: { ...(prev[ref] ?? {}), adminExtraStops: stops } as EditForm };
    });
  }

  function removeExtraStop(ref: string, idx: number) {
    setEditForms((prev) => ({
      ...prev,
      [ref]: { ...(prev[ref] ?? {}), adminExtraStops: (prev[ref]?.adminExtraStops ?? []).filter((_, i) => i !== idx) } as EditForm,
    }));
  }

  // ── Extra charge helpers ─────────────────────────────────────
  function addExtraCharge(ref: string) {
    setEditForms((prev) => ({
      ...prev,
      [ref]: { ...(prev[ref] ?? {}), adminExtraCharges: [...(prev[ref]?.adminExtraCharges ?? []), { type: "", amount: "", notes: "" }] } as EditForm,
    }));
  }

  function updateExtraCharge(ref: string, idx: number, field: keyof AdminExtraCharge, value: string) {
    setEditForms((prev) => {
      const charges = [...(prev[ref]?.adminExtraCharges ?? [])];
      charges[idx] = { ...charges[idx], [field]: value };
      return { ...prev, [ref]: { ...(prev[ref] ?? {}), adminExtraCharges: charges } as EditForm };
    });
  }

  function removeExtraCharge(ref: string, idx: number) {
    setEditForms((prev) => ({
      ...prev,
      [ref]: { ...(prev[ref] ?? {}), adminExtraCharges: (prev[ref]?.adminExtraCharges ?? []).filter((_, i) => i !== idx) } as EditForm,
    }));
  }

  // ── Save: silent (no Telegram) ───────────────────────────────
  async function saveChanges(ref: string) {
    const form = editForms[ref];
    if (!form) return;
    setSavingRef(ref);
    setSaveErrors((e) => ({ ...e, [ref]: "" }));
    const serializedCharges = serializeAdminCharges(form);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          service:    form.service,
          vanSize:    form.vanSize,
          helpOption: form.helpOption,
          timeWindow: form.timeWindow,
          bookingStatus:  form.bookingStatus,
          paymentStatus:  form.paymentStatus,
          agreedQuote:    form.agreedQuote,
          depositAmount:  form.depositAmount,
          confirmedDate:  form.confirmedDate,
          confirmedTime:  form.confirmedTime,
          driverNotes:    form.driverNotes,
          notes:          form.notes,
          pickup:         form.pickup,
          dropoff:        form.dropoff,
          duration:       form.duration,
          adminExtraStops:   JSON.stringify(form.adminExtraStops),
          adminExtraCharges: serializedCharges,
          notify: "false",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, ...form, adminExtraStops: JSON.stringify(form.adminExtraStops), adminExtraCharges: serializedCharges }
            : b,
        ),
      );
    } catch {
      setSaveErrors((e) => ({ ...e, [ref]: "Save failed. Please try again." }));
    } finally {
      setSavingRef(null);
    }
  }

  // ── Save + Notify Driver (sends Telegram) ────────────────────
  async function saveAndNotify(ref: string) {
    const form = editForms[ref];
    if (!form) return;
    setSavingRef(ref);
    setSaveErrors((e) => ({ ...e, [ref]: "" }));
    const serializedCharges = serializeAdminCharges(form);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          service:    form.service,
          vanSize:    form.vanSize,
          helpOption: form.helpOption,
          timeWindow: form.timeWindow,
          bookingStatus:  form.bookingStatus,
          paymentStatus:  form.paymentStatus,
          agreedQuote:    form.agreedQuote,
          depositAmount:  form.depositAmount,
          confirmedDate:  form.confirmedDate,
          confirmedTime:  form.confirmedTime,
          driverNotes:    form.driverNotes,
          notes:          form.notes,
          pickup:         form.pickup,
          dropoff:        form.dropoff,
          duration:       form.duration,
          adminExtraStops:   JSON.stringify(form.adminExtraStops),
          adminExtraCharges: serializedCharges,
          notify: "true",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, ...form, adminExtraStops: JSON.stringify(form.adminExtraStops), adminExtraCharges: serializedCharges }
            : b,
        ),
      );
    } catch {
      setSaveErrors((e) => ({ ...e, [ref]: "Save failed. Please try again." }));
    } finally {
      setSavingRef(null);
    }
  }

  async function confirmBooking(ref: string) {
    const form = editForms[ref];
    if (!form) return;
    const confirmedForm = { ...form, bookingStatus: "Confirmed", paymentStatus: "Payment link ready" };
    setEditForms((prev) => ({ ...prev, [ref]: confirmedForm }));
    setSavingRef(ref);
    setSaveErrors((e) => ({ ...e, [ref]: "" }));
    const serializedCharges = serializeAdminCharges(confirmedForm);
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          service:    confirmedForm.service,
          vanSize:    confirmedForm.vanSize,
          helpOption: confirmedForm.helpOption,
          timeWindow: confirmedForm.timeWindow,
          bookingStatus:  confirmedForm.bookingStatus,
          paymentStatus:  confirmedForm.paymentStatus,
          agreedQuote:    confirmedForm.agreedQuote,
          depositAmount:  confirmedForm.depositAmount,
          confirmedDate:  confirmedForm.confirmedDate,
          confirmedTime:  confirmedForm.confirmedTime,
          driverNotes:    confirmedForm.driverNotes,
          notes:          confirmedForm.notes,
          pickup:         confirmedForm.pickup,
          dropoff:        confirmedForm.dropoff,
          duration:       confirmedForm.duration,
          adminExtraStops:   JSON.stringify(confirmedForm.adminExtraStops),
          adminExtraCharges: serializedCharges,
          notify: "false",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) => b.bookingReference === ref
          ? { ...b, ...confirmedForm, adminExtraStops: JSON.stringify(confirmedForm.adminExtraStops), adminExtraCharges: serializedCharges }
          : b),
      );
      if (confirmedForm.depositAmount) {
        await generatePaymentLink(ref, confirmedForm);
      }
    } catch {
      setSaveErrors((e) => ({ ...e, [ref]: "Save failed. Please try again." }));
    } finally {
      setSavingRef(null);
    }
  }

  async function denyBooking(ref: string) {
    const form = editForms[ref] ?? {};
    const deniedForm = { ...form, bookingStatus: "Denied" };
    setEditForms((prev) => ({ ...prev, [ref]: deniedForm as EditForm }));
    setSavingRef(ref);
    setSaveErrors((e) => ({ ...e, [ref]: "" }));
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({ bookingStatus: "Denied" }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) => b.bookingReference === ref ? { ...b, bookingStatus: "Denied" } : b),
      );
    } catch {
      setSaveErrors((e) => ({ ...e, [ref]: "Save failed. Please try again." }));
    } finally {
      setSavingRef(null);
    }
  }

  async function generatePaymentLink(ref: string, formOverride?: EditForm, typeOverride?: "deposit" | "remaining" | "full") {
    const form = formOverride ?? editForms[ref];
    if (!form) return;
    const pType = typeOverride ?? paymentLinkType[ref] ?? "deposit";
    // Validate based on type
    if (pType === "deposit" && !form.depositAmount) {
      setLinkErrors((e) => ({ ...e, [ref]: "Enter a deposit amount before generating a link." }));
      return;
    }
    if ((pType === "full" || pType === "remaining") && !form.agreedQuote) {
      setLinkErrors((e) => ({ ...e, [ref]: "Enter an agreed quote before generating this link." }));
      return;
    }
    if (pType === "remaining" && !form.depositAmount) {
      setLinkErrors((e) => ({ ...e, [ref]: "Enter a deposit amount before generating a remaining-balance link." }));
      return;
    }
    setLinkBusy(ref);
    setLinkErrors((e) => ({ ...e, [ref]: "" }));
    try {
      const booking = bookings.find((b) => b.bookingReference === ref);
      const res = await apiFetch(
        `/api/admin/bookings/${encodeURIComponent(ref)}/payment-link`,
        {
          method: "POST",
          body: JSON.stringify({
            depositAmount: form.depositAmount,
            agreedQuote: form.agreedQuote,
            customerName: booking?.name ?? "",
            paymentType: pType,
          }),
        },
      );
      const data = (await res.json()) as { paymentLink?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "link generation failed");
      const link = data.paymentLink ?? "";
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, paymentLink: link, paymentStatus: "Payment link ready" }
            : b,
        ),
      );
      setEditForms((prev) => ({
        ...prev,
        [ref]: { ...(prev[ref] ?? {}), paymentStatus: "Payment link ready" } as EditForm,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate link";
      setLinkErrors((e) => ({ ...e, [ref]: msg }));
    } finally {
      setLinkBusy(null);
    }
  }

  async function createInvoice(ref: string, invoiceType: "deposit" | "full" | "remaining") {
    const booking = bookings.find((b) => b.bookingReference === ref);
    const form = editForms[ref];
    if (!booking || !form) return;

    setInvoiceBusy(ref);
    setInvoiceErrors((e) => ({ ...e, [ref]: "" }));
    setInvoiceModal(null);

    const email = parseEmailFromContactMethod(booking.contactMethod);
    try {
      const res = await apiFetch(
        `/api/admin/bookings/${encodeURIComponent(ref)}/invoice`,
        {
          method: "POST",
          body: JSON.stringify({
            invoiceType,
            agreedQuote: form.agreedQuote,
            depositAmount: form.depositAmount,
            customerName: booking.name ?? "",
            customerEmail: email,
            customerPhone: booking.phone ?? "",
            pickup: booking.pickup ?? "",
            dropoff: booking.dropoff ?? "",
            serviceType: booking.service ?? "",
          }),
        },
      );
      const data = (await res.json()) as {
        invoiceId?: string; invoiceUrl?: string; emailSent?: boolean;
        paymentStatus?: string; error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Invoice creation failed");

      const newStatus = data.paymentStatus ?? (data.emailSent ? "Invoice sent" : "Invoice created");
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, invoiceId: data.invoiceId ?? "", invoiceUrl: data.invoiceUrl ?? "", invoiceType, paymentStatus: newStatus }
            : b,
        ),
      );
      setEditForms((prev) => ({
        ...prev,
        [ref]: { ...(prev[ref] ?? {}), paymentStatus: newStatus } as EditForm,
      }));

      if (!data.emailSent) {
        setInvoiceErrors((e) => ({
          ...e,
          [ref]: "Invoice created. No customer email found — copy the invoice link to send manually.",
        }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invoice creation failed";
      setInvoiceErrors((e) => ({ ...e, [ref]: msg }));
    } finally {
      setInvoiceBusy(null);
    }
  }

  async function copyLink(link: string, ref: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(ref);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback: select text
    }
  }

  function buildWhatsAppMessage(booking: BookingRecord, payLink: string): string {
    const deposit = booking.depositAmount
      ? `£${parseFloat(booking.depositAmount).toFixed(2)}`
      : "—";
    const date = booking.confirmedDate || booking.date || "TBC";
    // Fall back to the customer's requested time window so the message
    // always carries SOME time information — never just "TBC" when we
    // know what slot they asked for.
    const time = booking.confirmedTime || booking.timeWindow || "TBC";
    const from = booking.pickup  || "—";
    const to   = booking.dropoff || "—";
    const name = booking.name    || "there";

    return (
      `Hi ${name},\n\n` +
      `Your booking is confirmed ✅\n\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n\n` +
      `From: ${from}\n` +
      `To: ${to}\n\n` +
      `Booking reference: ${booking.bookingReference}\n` +
      `Deposit required: ${deposit}\n\n` +
      `Please complete your payment using the secure link below.\n\n` +
      `If you experience any issues, please contact us.\n\n` +
      `Thank you,\n` +
      `Move4U\n\n` +
      `Secure payment link:\n` +
      payLink
    );
  }

  async function copyMessage(msg: string, ref: string) {
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedMsg(ref);
      setTimeout(() => setCopiedMsg(null), 2500);
    } catch {
      // clipboard unavailable
    }
  }

  function buildConfirmationEmailBody(b: BookingRecord, form: EditForm): string {
    const date    = form.confirmedDate || b.date      || "TBC";
    const time    = form.confirmedTime || b.timeWindow || "TBC";
    const from    = form.pickup  || b.pickup  || "—";
    const to      = form.dropoff || b.dropoff || "—";
    const quote   = form.agreedQuote   ? `£${parseFloat(form.agreedQuote).toFixed(2)}`   : b.estimatedPrice || "TBC";
    const deposit = form.depositAmount ? `£${parseFloat(form.depositAmount).toFixed(2)}` : "—";
    const name    = b.name || "there";

    return (
      `Hi ${name},\n\n` +
      `Please find your updated booking confirmation below.\n\n` +
      `Booking Reference: ${b.bookingReference}\n` +
      `Service: ${b.service}\n\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n\n` +
      `From: ${from}\n` +
      `To: ${to}\n\n` +
      `Agreed quote: ${quote}\n` +
      `Deposit required: ${deposit}\n\n` +
      `If you have any questions, please don't hesitate to contact us.\n\n` +
      `Kind regards,\n` +
      `Move4U\n` +
      `📞 07541 822561\n` +
      `🌐 https://move4u.uk`
    );
  }

  function openConfirmationPreview(ref: string, b: BookingRecord, form: EditForm) {
    const email = parseEmailFromContactMethod(b.contactMethod);
    if (!email) return;
    setEmailPreview({
      ref,
      to:      email,
      subject: `Updated Booking Confirmation — ${ref}`,
      body:    buildConfirmationEmailBody(b, form),
    });
  }

  async function doSendConfirmation() {
    if (!emailPreview) return;
    const { ref, to, subject, body } = emailPreview;
    setEmailPreview(null);
    setConfirmBusy(ref);
    try {
      const res = await apiFetch(
        `/api/admin/bookings/${encodeURIComponent(ref)}/send-confirmation`,
        { method: "POST", body: JSON.stringify({ subject, sentTo: to, body }) },
      );
      if (!res.ok) throw new Error("send failed");
      setBookings((prev) =>
        prev.map((bk) =>
          bk.bookingReference === ref
            ? { ...bk, confirmationSent: "Yes", confirmationSentAt: new Date().toISOString() }
            : bk,
        ),
      );
      setEmailSentRef(ref);
      setTimeout(() => setEmailSentRef(null), 4000);
    } catch {
      // apiFetch surfaces errors in the network layer; don't block the admin UI
    } finally {
      setConfirmBusy(null);
    }
  }

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  const filtered = (() => {
    const refNum = (ref: string): number => {
      const m = ref.match(/(\d+)\s*$/);
      return m ? parseInt(m[1]!, 10) : Number.MAX_SAFE_INTEGER;
    };
    if (statusFilter === "Deleted") {
      return [...deletedBookings].sort((a, b) => refNum(b.bookingReference) - refNum(a.bookingReference));
    }
    const base =
      statusFilter === "All"
        ? bookings
        : bookings.filter((b) => b.bookingStatus === statusFilter);
    return [...base].sort((a, b) => refNum(b.bookingReference) - refNum(a.bookingReference));
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 text-sm">Move4U Admin</span>
          <span className="text-xs text-gray-400 hidden sm:block">Bookings Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { void fetchBookings(); if (statusFilter === "Deleted") void fetchDeletedBookings(); }}
            disabled={loading || deletedLoading}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-4">
        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {STATUS_FILTERS.map((f) => {
            const count = f === "All" ? bookings.length : f === "Deleted" ? deletedBookings.length : bookings.filter((b) => b.bookingStatus === f).length;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === f
                    ? "bg-purple-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {f} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* ── Bulk select-all bar ───────────────────────────── */}
        {filtered.length > 0 && !loading && !deletedLoading && (
          <div className="flex items-center justify-between mb-3 px-1">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedRefs.size > 0 && selectedRefs.size === filtered.length}
                ref={(el) => { if (el) el.indeterminate = selectedRefs.size > 0 && selectedRefs.size < filtered.length; }}
                onChange={() => selectedRefs.size === filtered.length ? clearSelection() : selectAll()}
                className="w-4 h-4 accent-purple-700 cursor-pointer"
                aria-label="Select all visible bookings"
              />
              <span className="font-medium">
                {selectedRefs.size > 0
                  ? `${selectedRefs.size} of ${filtered.length} selected`
                  : `Select all (${filtered.length})`}
              </span>
            </label>
            {selectedRefs.size > 0 && (
              <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Bulk action toolbar ────────────────────────────── */}
        {selectedRefs.size > 0 && (
          <div className="bg-white border border-purple-200 rounded-2xl p-3 mb-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-purple-700 shrink-0">
                {selectedRefs.size} selected
              </span>

              {statusFilter !== "Deleted" && (
                <>
                  <button
                    onClick={() => setBulkConfirm({
                      label: `Delete ${selectedRefs.size} selected booking${selectedRefs.size !== 1 ? "s" : ""}?`,
                      onConfirm: () => executeBulkDelete(Array.from(selectedRefs)),
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                  <button
                    onClick={() => setBulkConfirm({
                      label: `Archive ${selectedRefs.size} booking${selectedRefs.size !== 1 ? "s" : ""} as Completed?`,
                      onConfirm: () => executeBulkStatusChange(Array.from(selectedRefs), "Completed"),
                    })}
                    className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => setBulkStatusPicker(bulkStatusPicker === "status" ? null : "status")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${bulkStatusPicker === "status" ? "bg-purple-700 text-white border-purple-700" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                  >
                    Status ▾
                  </button>
                  <button
                    onClick={() => setBulkStatusPicker(bulkStatusPicker === "payment" ? null : "payment")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${bulkStatusPicker === "payment" ? "bg-purple-700 text-white border-purple-700" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                  >
                    Payment ▾
                  </button>
                </>
              )}

              {statusFilter === "Deleted" && (
                <>
                  <button
                    onClick={() => setBulkConfirm({
                      label: `Restore ${selectedRefs.size} booking${selectedRefs.size !== 1 ? "s" : ""}?`,
                      onConfirm: () => executeBulkRestore(Array.from(selectedRefs)),
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors border border-green-100"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setBulkConfirm({
                      label: `Permanently delete ${selectedRefs.size} booking${selectedRefs.size !== 1 ? "s" : ""}? This cannot be undone.`,
                      onConfirm: () => executeBulkPermanentDelete(Array.from(selectedRefs)),
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <Trash2 className="w-3 h-3" /> Delete forever
                  </button>
                </>
              )}

              <button
                onClick={clearSelection}
                className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Dismiss selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Booking status picker */}
            {bulkStatusPicker === "status" && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Set booking status to:</p>
                <div className="flex flex-wrap gap-1.5">
                  {BOOKING_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void executeBulkStatusChange(Array.from(selectedRefs), s)}
                      disabled={bulkBusy}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment status picker */}
            {bulkStatusPicker === "payment" && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Set payment status to:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void executeBulkPaymentStatusChange(Array.from(selectedRefs), s)}
                      disabled={bulkBusy}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {fetchError}
          </div>
        )}

        {/* Loading state */}
        {loading && bookings.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading bookings…</p>
          </div>
        )}

        {/* Empty state */}
        {statusFilter === "Deleted" && deletedLoading && deletedBookings.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading deleted bookings…</p>
          </div>
        )}
        {!loading && !deletedLoading && filtered.length === 0 && !fetchError && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No bookings found{statusFilter !== "All" ? ` with status "${statusFilter}"` : ""}.</p>
          </div>
        )}

        {/* Booking cards */}
        <div className="space-y-3">
          {filtered.map((booking) => {
            const ref = booking.bookingReference;

            // ── Deleted tab: compact card with Restore / Delete forever ──
            if (statusFilter === "Deleted") {
              const isRestoring         = restoringRef === ref;
              const isPermanentDeleting = permanentDeletingRef === ref;
              return (
                <div key={ref} className="bg-white border border-red-100 rounded-2xl overflow-hidden">
                  <div className="flex items-stretch">
                    <label className="flex items-center justify-center w-11 shrink-0 cursor-pointer border-r border-red-50 hover:bg-red-50/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRefs.has(ref)}
                        onChange={() => toggleSelect(ref)}
                        className="w-4 h-4 accent-purple-700 cursor-pointer"
                        aria-label={`Select ${ref}`}
                      />
                    </label>
                    <div className="flex-1 px-3 py-3.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-400 text-sm line-through">{ref}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-500">Deleted</span>
                      </div>
                      <p className="text-sm font-medium text-gray-600">{booking.name || "—"}</p>
                      <p className="text-xs text-gray-400">{booking.service || "—"}{booking.confirmedDate ? ` · ${new Date(booking.confirmedDate).toLocaleDateString("en-GB")}` : ""}</p>
                      {booking.deletedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Deleted {new Date(booking.deletedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      <button
                        onClick={() => void handleRestoreBooking(ref)}
                        disabled={isRestoring || isPermanentDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Restore
                      </button>
                      {permanentDeleteConfirmRef === ref ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <span className="text-[11px] text-red-600 font-medium">Delete forever?</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => void handlePermanentDeleteBooking(ref)}
                              disabled={isPermanentDeleting}
                              className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {isPermanentDeleting ? "Deleting…" : "Delete forever"}
                            </button>
                            <button
                              onClick={() => setPermanentDeleteConfirmRef(null)}
                              className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPermanentDeleteConfirmRef(ref)}
                          disabled={isRestoring || isPermanentDeleting}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" /> Delete forever
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            }

            const isExpanded = expandedRef === ref;
            const form = editForms[ref];
            const isSaving = savingRef === ref;
            const isLinkBusy = linkBusy === ref;
            const payLink = booking.paymentLink;
            const plType  = paymentLinkType[ref] ?? "deposit";
            const waitInfo = getWaitingInfo(booking.timestamp);
            const needsAttention = NEEDS_ACTION.has(booking.bookingStatus) && waitInfo.minutesAgo > 0;
            const cardBorder = needsAttention ? priorityCardBorder(waitInfo.priority) : "border-gray-200";

            return (
              <div key={ref} className={`bg-white border rounded-2xl overflow-hidden ${cardBorder}`}>
                <div className="flex items-stretch">
                <label className="flex items-center justify-center w-11 shrink-0 cursor-pointer border-r border-gray-100 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRefs.has(ref)}
                    onChange={() => toggleSelect(ref)}
                    className="w-4 h-4 accent-purple-700 cursor-pointer"
                    aria-label={`Select ${ref}`}
                  />
                </label>
                {/* Card header — always visible */}
                <button
                  onClick={() => toggleExpand(ref, booking)}
                  className="flex-1 text-left px-3 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-purple-700 text-sm">{ref}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus || "New"}
                      </span>
                      {booking.paymentStatus && booking.paymentStatus !== "Unpaid" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payBadge(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      )}
                      {needsAttention && waitInfo.priority !== "normal" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityBadgeClass(waitInfo.priority)}`}>
                          {priorityBadgeText(waitInfo.priority)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{booking.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span>{booking.service}</span>
                      {booking.phone && (
                        <a
                          href={`tel:${dialablePhone(booking.phone)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-purple-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />{booking.phone}
                        </a>
                      )}
                      {waitInfo.label && (
                        <span className={needsAttention && waitInfo.priority !== "normal" ? priorityBadgeClass(waitInfo.priority).replace("bg-", "text-").split(" ")[1] : "text-gray-400"}>
                          {waitInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
                </button>
                </div>

                {/* Expanded content */}
                {isExpanded && form && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">

                    {/* ── Customer summary (compact, read-only) ── */}
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <InfoRow label="Contact via" value={booking.contactMethod} />
                        <InfoRow label="Estimate"    value={booking.estimatedPrice} />
                        <InfoRow label="Van"         value={booking.vanSize} />
                        <InfoRow label="Help"        value={booking.helpOption} />
                        <InfoRow label="Requested"   value={booking.date} />
                        <InfoRow label="Time slot"   value={booking.timeWindow || "—"} />
                      </div>
                      {booking.photoUrls && (() => {
                        const urls = booking.photoUrls.split(",").map((u) => u.trim()).filter(Boolean);
                        if (urls.length === 0) return null;
                        return (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Photos ({urls.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                              {urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                   className="block rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50 hover:opacity-90 transition-opacity"
                                   title={`Photo ${i + 1} — click to open full size`}>
                                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </section>

                    {/* ── Quick contact (new bookings only) ── */}
                    {(form.bookingStatus === "New" || !form.bookingStatus) && (
                      <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick contact</h3>
                        <QuickContactSection booking={booking} message={buildIntroMessage(booking)} intent="intro" />
                      </section>
                    )}

                    {/* ── Booking details (editable) ── */}
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Booking Details</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Booking Status</label>
                            <select value={form.bookingStatus}
                              onChange={(e) => updateField(ref, "bookingStatus", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                              {BOOKING_STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Payment Status</label>
                            <select value={form.paymentStatus}
                              onChange={(e) => updateField(ref, "paymentStatus", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                              {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Confirmed Date" value={form.confirmedDate} type="date"
                            onChange={(v) => updateField(ref, "confirmedDate", v)} />
                          <Field label="Confirmed Time" value={form.confirmedTime} type="time"
                            onChange={(v) => updateField(ref, "confirmedTime", v)} />
                        </div>
                        {/* ── Editable booking core ── */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Service Type</label>
                          <select value={form.service}
                            onChange={(e) => updateField(ref, "service", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                            <option value="">— select —</option>
                            {SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Van Size</label>
                            <select value={form.vanSize}
                              onChange={(e) => updateField(ref, "vanSize", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                              <option value="">— select —</option>
                              {VAN_SIZE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Help Option</label>
                            <select value={form.helpOption}
                              onChange={(e) => updateField(ref, "helpOption", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                              <option value="">— select —</option>
                              {HELP_OPTION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Time Slot</label>
                          <select value={form.timeWindow}
                            onChange={(e) => updateField(ref, "timeWindow", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                            <option value="">— select —</option>
                            {TIME_SLOT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Pickup Address</label>
                          <textarea value={form.pickup} onChange={(e) => updateField(ref, "pickup", e.target.value)}
                            rows={2} placeholder="Full pickup address…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Drop-off Address</label>
                          <textarea value={form.dropoff} onChange={(e) => updateField(ref, "dropoff", e.target.value)}
                            rows={2} placeholder="Full drop-off address…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600" />
                        </div>
                        <Field label="Duration" value={form.duration}
                          onChange={(v) => updateField(ref, "duration", v)}
                          helper="e.g. 2 hours, 3.5 hours" />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Agreed Total (£)" value={form.agreedQuote} type="number"
                            onChange={(v) => updateField(ref, "agreedQuote", v)} />
                          <Field label="Deposit Paid (£)" value={form.depositAmount} type="number"
                            onChange={(v) => updateField(ref, "depositAmount", v)}
                            helper="Stays locked unless edited" />
                        </div>
                        {(() => {
                          const agreedNum  = parseFloat(form.agreedQuote);
                          const depositNum = parseFloat(form.depositAmount);
                          const remaining  = !isNaN(agreedNum) && !isNaN(depositNum) && agreedNum > 0
                            ? Math.max(0, agreedNum - depositNum) : null;
                          return remaining !== null ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-400 text-xs">Remaining balance:</span>
                              <span className="font-semibold text-gray-800">£{remaining.toFixed(2)}</span>
                            </div>
                          ) : null;
                        })()}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Customer Notes</label>
                          <textarea value={form.notes} onChange={(e) => updateField(ref, "notes", e.target.value)}
                            rows={2} placeholder="Notes from the customer…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Driver Notes</label>
                          <textarea value={form.driverNotes} onChange={(e) => updateField(ref, "driverNotes", e.target.value)}
                            rows={2} placeholder="Internal notes…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600" />
                        </div>
                      </div>
                    </section>

                    {/* ── Extra Stops (collapsible, collapsed by default) ── */}
                    <section className="border-t border-gray-100 pt-2">
                      <button onClick={() => toggleSection(ref, "stops")}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 hover:text-purple-700 transition-colors">
                        <span className="flex items-center gap-2">
                          Extra Stops
                          {form.adminExtraStops.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold">
                              {form.adminExtraStops.length}
                            </span>
                          )}
                        </span>
                        {isSectionOpen(ref, "stops") ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {isSectionOpen(ref, "stops") && (
                        <div className="mt-1 space-y-2 pb-2">
                          {form.adminExtraStops.map((stop, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-1.5">
                                <input value={stop.address}
                                  onChange={(e) => updateExtraStop(ref, i, "address", e.target.value)}
                                  placeholder="Stop address"
                                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                                <input value={stop.notes}
                                  onChange={(e) => updateExtraStop(ref, i, "notes", e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600" />
                              </div>
                              <input value={stop.charge}
                                onChange={(e) => updateExtraStop(ref, i, "charge", e.target.value)}
                                placeholder="£ charge"
                                className="w-20 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                              <button onClick={() => removeExtraStop(ref, i)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 mt-0.5">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addExtraStop(ref)}
                            className="flex items-center gap-1.5 text-xs text-purple-700 font-medium hover:text-purple-900 transition-colors px-1 py-1">
                            <Plus className="w-3.5 h-3.5" /> Add stop
                          </button>
                        </div>
                      )}
                    </section>

                    {/* ── Pricing (smart engine, collapsible) ── */}
                    {(() => {
                      const pricing = computeAdminPricing(form);
                      const activeStructuredCount = [
                        form.extraTimeMinutes !== "0" && form.extraTimeMinutes !== "",
                        form.pickupFloors    !== "0" && form.pickupFloors    !== "",
                        form.dropoffFloors   !== "0" && form.dropoffFloors   !== "",
                        form.congestionEntries !== "0" && form.congestionEntries !== "",
                        (parseFloat(form.outsideM25Miles || "0") || 0) > 0,
                      ].filter(Boolean).length + form.adminExtraCharges.length;
                      return (
                        <section className="border-t border-gray-100 pt-2">
                          <button onClick={() => toggleSection(ref, "charges")}
                            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 hover:text-purple-700 transition-colors">
                            <span className="flex items-center gap-2">
                              Pricing
                              {activeStructuredCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold">
                                  {activeStructuredCount}
                                </span>
                              )}
                            </span>
                            {isSectionOpen(ref, "charges") ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isSectionOpen(ref, "charges") && (
                            <div className="mt-1 pb-3 space-y-3">
                              {/* Auto-total banner */}
                              <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                                <div>
                                  <p className="text-[11px] text-purple-500 font-medium uppercase tracking-wide">Calculated total</p>
                                  <p className="text-xl font-bold text-purple-800">£{pricing.total.toFixed(2)}</p>
                                  {pricing.hourlyRate > 0 && <p className="text-[10px] text-purple-400">Rate: £{pricing.hourlyRate}/hr</p>}
                                </div>
                                <button
                                  onClick={() => updateField(ref, "agreedQuote", pricing.total.toFixed(2))}
                                  className="text-xs font-semibold text-purple-700 border border-purple-300 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors whitespace-nowrap">
                                  Use calculated price
                                </button>
                              </div>

                              {/* Structured pricing inputs */}
                              <div className="space-y-2.5">
                                {/* Extra Time */}
                                <div className="flex items-center gap-3">
                                  <label className="w-36 text-xs text-gray-500 shrink-0">Extra time</label>
                                  <select value={form.extraTimeMinutes}
                                    onChange={(e) => updateField(ref, "extraTimeMinutes", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                                    {EXTRA_TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                  {pricing.extraTime > 0 && <span className="text-sm text-purple-700 font-medium w-14 text-right">+£{pricing.extraTime.toFixed(2)}</span>}
                                </div>
                                {/* Pickup Stairs */}
                                <div className="flex items-center gap-3">
                                  <label className="w-36 text-xs text-gray-500 shrink-0">Pickup stair flights</label>
                                  <select value={form.pickupFloors}
                                    onChange={(e) => updateField(ref, "pickupFloors", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                                    {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f === "0" ? "None" : `${f} stair flight${f !== "1" ? "s" : ""}`}</option>)}
                                  </select>
                                  {pricing.stairsPickup > 0 && <span className="text-sm text-purple-700 font-medium w-14 text-right">+£{pricing.stairsPickup.toFixed(2)}</span>}
                                </div>
                                {/* Drop-off Stairs */}
                                <div className="flex items-center gap-3">
                                  <label className="w-36 text-xs text-gray-500 shrink-0">Drop-off stair flights</label>
                                  <select value={form.dropoffFloors}
                                    onChange={(e) => updateField(ref, "dropoffFloors", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                                    {FLOOR_OPTIONS.map((f) => <option key={f} value={f}>{f === "0" ? "None" : `${f} stair flight${f !== "1" ? "s" : ""}`}</option>)}
                                  </select>
                                  {pricing.stairsDropoff > 0 && <span className="text-sm text-purple-700 font-medium w-14 text-right">+£{pricing.stairsDropoff.toFixed(2)}</span>}
                                </div>
                                {/* Congestion */}
                                <div className="flex items-center gap-3">
                                  <label className="w-36 text-xs text-gray-500 shrink-0">Congestion (CCZ)</label>
                                  <select value={form.congestionEntries}
                                    onChange={(e) => updateField(ref, "congestionEntries", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                                    {CONGESTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                  {pricing.ccz > 0 && <span className="text-sm text-purple-700 font-medium w-14 text-right">+£{pricing.ccz.toFixed(2)}</span>}
                                </div>
                                {/* Outside M25 */}
                                <div className="flex items-center gap-3">
                                  <label className="w-36 text-xs text-gray-500 shrink-0">Outside M25 (mi)</label>
                                  <input
                                    type="number" min="0" step="1"
                                    value={form.outsideM25Miles}
                                    onChange={(e) => updateField(ref, "outsideM25Miles", e.target.value)}
                                    placeholder="miles"
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                                  {pricing.m25 > 0 && <span className="text-sm text-purple-700 font-medium w-14 text-right">+£{pricing.m25.toFixed(2)}</span>}
                                </div>
                              </div>

                              {/* Manual freeform charges */}
                              {(form.adminExtraCharges.length > 0 || true) && (
                                <div className="border-t border-gray-100 pt-2 space-y-2">
                                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Manual charges</p>
                                  {form.adminExtraCharges.map((charge, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                      <div className="flex-1 space-y-1.5">
                                        <input value={charge.type}
                                          onChange={(e) => updateExtraCharge(ref, i, "type", e.target.value)}
                                          placeholder="Charge description…"
                                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                                        <input value={charge.notes}
                                          onChange={(e) => updateExtraCharge(ref, i, "notes", e.target.value)}
                                          placeholder="Notes (optional)"
                                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600" />
                                      </div>
                                      <input value={charge.amount}
                                        onChange={(e) => updateExtraCharge(ref, i, "amount", e.target.value)}
                                        placeholder="£"
                                        className="w-16 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                                      <button onClick={() => removeExtraCharge(ref, i)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 mt-0.5">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <button onClick={() => addExtraCharge(ref)}
                                    className="flex items-center gap-1.5 text-xs text-purple-700 font-medium hover:text-purple-900 transition-colors px-1 py-1">
                                    <Plus className="w-3.5 h-3.5" /> Add manual charge
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      );
                    })()}

                    {/* ── Price Breakdown (collapsible) ── */}
                    {(() => {
                      const pricing  = computeAdminPricing(form);
                      const agreed   = parseFloat(form.agreedQuote) || 0;
                      const deposit  = parseFloat(form.depositAmount) || 0;
                      const remaining = Math.max(0, agreed - deposit);
                      return (
                        <section className="border-t border-gray-100 pt-2">
                          <button onClick={() => toggleSection(ref, "breakdown")}
                            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 hover:text-purple-700 transition-colors">
                            <span>Price Breakdown</span>
                            {isSectionOpen(ref, "breakdown") ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isSectionOpen(ref, "breakdown") && (
                            <div className="mt-1 mb-2 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                              {/* Original booking data */}
                              {(booking.baseCharge || booking.stairsCharge || booking.congestionCharge) && (
                                <div className="pb-2 mb-2 border-b border-purple-100">
                                  <p className="text-[11px] font-semibold text-purple-500 uppercase tracking-wide mb-1.5">Original estimate</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                                    {booking.duration         && <span><span className="text-gray-400">Duration: </span>{booking.duration}</span>}
                                    {booking.hourlyRate       && <span><span className="text-gray-400">Rate: </span>{booking.hourlyRate}</span>}
                                    {booking.baseCharge       && <span><span className="text-gray-400">Base: </span>£{booking.baseCharge}</span>}
                                    {booking.stairsCharge     && <span><span className="text-gray-400">Stairs: </span>+£{booking.stairsCharge}</span>}
                                    {booking.extraStopCharge  && <span><span className="text-gray-400">Stops: </span>+£{booking.extraStopCharge}</span>}
                                    {booking.congestionCharge && <span><span className="text-gray-400">CCZ: </span>+£{booking.congestionCharge}</span>}
                                    {booking.outsideM25Charge && <span><span className="text-gray-400">M25: </span>+£{booking.outsideM25Charge}</span>}
                                  </div>
                                </div>
                              )}
                              {/* Admin-managed breakdown */}
                              <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">Confirmed price</p>
                              <div className="space-y-1">
                                {pricing.base > 0          && <div className="flex justify-between text-gray-600"><span>Base ({form.duration || "—"})</span><span>£{pricing.base.toFixed(2)}</span></div>}
                                {pricing.extraTime > 0     && <div className="flex justify-between text-gray-600"><span>Extra time (+{form.extraTimeMinutes} min)</span><span>+£{pricing.extraTime.toFixed(2)}</span></div>}
                                {pricing.stairsPickup > 0  && <div className="flex justify-between text-gray-600"><span>Pickup stair flights ({form.pickupFloors})</span><span>+£{pricing.stairsPickup.toFixed(2)}</span></div>}
                                {pricing.stairsDropoff > 0 && <div className="flex justify-between text-gray-600"><span>Drop-off stair flights ({form.dropoffFloors})</span><span>+£{pricing.stairsDropoff.toFixed(2)}</span></div>}
                                {pricing.ccz > 0           && <div className="flex justify-between text-gray-600"><span>Congestion ({form.congestionEntries} addr.)</span><span>+£{pricing.ccz.toFixed(2)}</span></div>}
                                {pricing.m25 > 0           && <div className="flex justify-between text-gray-600"><span>Outside M25 ({form.outsideM25Miles} mi)</span><span>+£{pricing.m25.toFixed(2)}</span></div>}
                                {pricing.stopsTotal > 0    && <div className="flex justify-between text-gray-600"><span>Extra stops ({form.adminExtraStops.length})</span><span>+£{pricing.stopsTotal.toFixed(2)}</span></div>}
                                {pricing.manualTotal > 0   && <div className="flex justify-between text-gray-600"><span>Manual charges</span><span>+£{pricing.manualTotal.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-purple-600 text-xs border-t border-purple-100 pt-1">
                                  <span>Calculated</span><span>£{pricing.total.toFixed(2)}</span>
                                </div>
                                {agreed > 0 && (
                                  <div className="flex justify-between font-semibold border-t border-purple-200 pt-1">
                                    <span>Agreed total</span><span>£{agreed.toFixed(2)}</span>
                                  </div>
                                )}
                                {deposit > 0 && <div className="flex justify-between text-gray-500"><span>Deposit paid</span><span>−£{deposit.toFixed(2)}</span></div>}
                                {agreed > 0 && deposit > 0 && (
                                  <div className="flex justify-between font-semibold text-purple-700">
                                    <span>Remaining</span><span>£{remaining.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })()}

                    {/* ── Save buttons ── */}
                    {saveErrors[ref] && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {saveErrors[ref]}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <ActionBtn onClick={() => void saveChanges(ref)} disabled={isSaving} loading={isSaving} variant="primary">
                        Save Changes
                      </ActionBtn>
                      <ActionBtn onClick={() => void saveAndNotify(ref)} disabled={isSaving} loading={isSaving} variant="green">
                        💬 Save &amp; Notify Driver
                      </ActionBtn>
                    </div>

                    {/* Secondary booking actions */}
                    <div className="flex flex-wrap gap-2">
                      <ActionBtn onClick={() => void confirmBooking(ref)} disabled={isSaving} loading={isSaving} variant="primary">
                        Confirm booking
                      </ActionBtn>
                      <ActionBtn onClick={() => void denyBooking(ref)} disabled={isSaving} variant="red">
                        Deny
                      </ActionBtn>
                    </div>

                    {/* ── Delete booking ── */}
                    {deleteConfirmRef === ref ? (
                      <div className="flex items-center gap-2 border border-red-200 rounded-xl px-3 py-2 bg-red-50">
                        <span className="text-xs text-red-700 flex-1">Move to Deleted? This can be restored later.</span>
                        <button onClick={() => void handleDeleteBooking(ref)} disabled={deletingRef === ref}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                          {deletingRef === ref ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button onClick={() => setDeleteConfirmRef(null)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmRef(ref)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-red-500 border border-red-100 bg-white hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete booking
                      </button>
                    )}

                    {/* Payment link section */}
                    <section className="border-t border-gray-100 pt-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal Payment Link</h3>

                      {/* Payment type toggle */}
                      {(() => {
                        const aQuote = parseFloat(form?.agreedQuote ?? "") || 0;
                        const aDeposit = parseFloat(form?.depositAmount ?? "") || 0;
                        const labels: Record<"deposit" | "remaining" | "full", string> = {
                          deposit:   aDeposit > 0 ? `Deposit £${aDeposit.toFixed(2)}` : "Deposit",
                          remaining: aQuote > 0 && aDeposit > 0 ? `Remaining £${Math.max(0, aQuote - aDeposit).toFixed(2)}` : "Remaining",
                          full:      aQuote > 0 ? `Full £${aQuote.toFixed(2)}` : "Full",
                        };
                        return (
                          <div className="flex gap-1.5 mb-3">
                            {(["deposit", "remaining", "full"] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setPaymentLinkType((prev) => ({ ...prev, [ref]: t }))}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${plType === t ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                              >
                                {labels[t]}
                              </button>
                            ))}
                          </div>
                        );
                      })()}

                      {payLink ? (() => {
                        // Short URL must always show the canonical customer-facing
                        // domain (move4u.uk), regardless of which host the admin
                        // happens to be browsing on. Hard-coding this prevents the
                        // copied / WhatsApp / SMS / email message from leaking a
                        // *.replit.app preview URL to the customer.
                        const shortPayUrl = `https://move4u.uk/pay/${booking.bookingReference}`;
                        const whatsappMsg = buildWhatsAppMessage(booking, shortPayUrl);
                        return (
                          <div className="space-y-3">
                            {/* Message preview */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                              <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Message preview</p>
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{whatsappMsg}</pre>
                            </div>

                            {/* Short pay link row */}
                            <div className="flex items-center justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-xs font-semibold text-purple-700">👉 Pay now (short link)</p>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono break-all">{shortPayUrl}</p>
                              </div>
                              <a
                                href={shortPayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Open
                              </a>
                            </div>

                            {/* Smart suggestion — send the payment-link
                                message via the customer's preferred
                                channel in one click. */}
                            <QuickContactSection
                              booking={booking}
                              message={whatsappMsg}
                              intent="payment"
                            />

                            {/* Manual fallback actions */}
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => void copyMessage(whatsappMsg, ref)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-semibold hover:bg-purple-800 transition-colors"
                              >
                                {copiedMsg === ref ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedMsg === ref ? "Copied!" : "Copy message"}
                              </button>
                              <button
                                onClick={() => void copyLink(shortPayUrl, ref)}
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {copied === ref ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied === ref ? "Copied!" : "Copy short link"}
                              </button>
                              <button
                                onClick={() => void generatePaymentLink(ref)}
                                disabled={isLinkBusy}
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                title={`Regenerate as ${plType} link`}
                              >
                                {isLinkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                Refresh link
                              </button>
                            </div>
                          </div>
                        );
                      })() : (
                        <div>
                          <p className="text-xs text-gray-500 mb-3">
                            {plType === "full"
                              ? "No payment link yet. Enter the agreed quote above, then generate a full-payment Stripe link."
                              : plType === "remaining"
                              ? "No payment link yet. Enter the agreed quote and deposit, then generate a remaining-balance Stripe link."
                              : "No payment link yet. Enter the deposit amount above, then generate a personal Stripe link for this booking."}
                          </p>
                          <button
                            onClick={() => void generatePaymentLink(ref)}
                            disabled={
                              isLinkBusy ||
                              (plType === "deposit"  && !form.depositAmount) ||
                              (plType === "full"     && !form.agreedQuote) ||
                              (plType === "remaining" && (!form.agreedQuote || !form.depositAmount))
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLinkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Generate {plType === "full" ? "full payment" : plType === "remaining" ? "remaining balance" : "deposit"} link
                          </button>
                        </div>
                      )}

                      {linkErrors[ref] && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {linkErrors[ref]}
                        </p>
                      )}
                    </section>

                    {/* Send Updated Confirmation section */}
                    {(() => {
                      const email = parseEmailFromContactMethod(booking.contactMethod);
                      if (!email) return null;
                      const alreadySent   = booking.confirmationSent === "Yes";
                      const isConfirmBusy = confirmBusy === ref;
                      return (
                        <section className="border-t border-gray-100 pt-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Send Updated Confirmation</h3>
                          {alreadySent && (
                            <p className="text-xs text-green-600 mb-2">
                              ✓ Confirmation sent{booking.confirmationSentAt ? ` on ${new Date(booking.confirmationSentAt).toLocaleDateString("en-GB")}` : ""}.
                            </p>
                          )}
                          <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-700 mb-3">
                            Emails are sent from <strong>info@move4u.uk</strong>
                          </div>
                          <button
                            type="button"
                            disabled={isConfirmBusy}
                            onClick={() => openConfirmationPreview(ref, booking, form)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-60"
                          >
                            {isConfirmBusy
                              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                              : <><Mail className="w-3.5 h-3.5" /> {alreadySent ? "Re-send Confirmation" : "Send Updated Confirmation"}</>
                            }
                          </button>
                        </section>
                      );
                    })()}

                    {/* Invoice section — hidden while ENABLE_STRIPE_INVOICES=false */}
                    {ENABLE_STRIPE_INVOICES && (() => {
                      const isInvoiceBusy = invoiceBusy === ref;
                      const invoiceUrl = booking.invoiceUrl;
                      const agreedNum = parseFloat(editForms[ref]?.agreedQuote ?? "");
                      const depositNum = parseFloat(editForms[ref]?.depositAmount ?? "");
                      const remaining = !isNaN(agreedNum) && !isNaN(depositNum)
                        ? Math.max(0, agreedNum - depositNum) : null;

                      return (
                        <section className="border-t border-gray-100 pt-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Stripe Invoice</h3>

                          {/* Financial summary */}
                          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-400 mb-0.5">Agreed Quote</p>
                              <p className="font-semibold text-gray-800">{editForms[ref]?.agreedQuote ? `£${editForms[ref].agreedQuote}` : "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-400 mb-0.5">Deposit</p>
                              <p className="font-semibold text-gray-800">{editForms[ref]?.depositAmount ? `£${editForms[ref].depositAmount}` : "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                              <p className="font-semibold text-gray-800">{remaining !== null ? `£${remaining.toFixed(2)}` : "—"}</p>
                            </div>
                          </div>

                          {/* Existing invoice */}
                          {invoiceUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500">
                                  {booking.invoiceType === "deposit" ? "Deposit invoice"
                                    : booking.invoiceType === "full" ? "Full payment invoice"
                                    : booking.invoiceType === "remaining" ? "Remaining balance invoice"
                                    : "Invoice"} created
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={invoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open invoice
                                </a>
                                <button
                                  onClick={() => {
                                    void navigator.clipboard.writeText(invoiceUrl).then(() => {
                                      setCopiedInvoice(ref);
                                      setTimeout(() => setCopiedInvoice(null), 2000);
                                    });
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {copiedInvoice === ref ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                  {copiedInvoice === ref ? "Copied!" : "Copy link"}
                                </button>
                                <button
                                  onClick={() => setInvoiceModal(invoiceModal === ref ? null : ref)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  New invoice
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setInvoiceModal(invoiceModal === ref ? null : ref)}
                              disabled={isInvoiceBusy}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isInvoiceBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              Create invoice
                            </button>
                          )}

                          {/* Invoice type picker */}
                          {invoiceModal === ref && (
                            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Choose invoice type:</p>
                              {[
                                { type: "deposit" as const, label: "Deposit invoice", amount: editForms[ref]?.depositAmount ? `£${editForms[ref].depositAmount}` : "(30% of quote)" },
                                { type: "full" as const,    label: "Full amount invoice", amount: editForms[ref]?.agreedQuote ? `£${editForms[ref].agreedQuote}` : "requires Agreed Quote" },
                                { type: "remaining" as const, label: "Remaining balance invoice", amount: remaining !== null ? `£${remaining.toFixed(2)}` : "requires Agreed Quote" },
                              ].map(({ type, label, amount }) => (
                                <button
                                  key={type}
                                  onClick={() => void createInvoice(ref, type)}
                                  disabled={isInvoiceBusy}
                                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                                >
                                  <span className="font-medium text-gray-800">{label}</span>
                                  <span className="text-gray-500 text-xs">{amount}</span>
                                </button>
                              ))}
                              <button
                                onClick={() => setInvoiceModal(null)}
                                className="text-xs text-gray-400 hover:text-gray-600 pt-1"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {invoiceErrors[ref] && (
                            <p className={`mt-2 text-sm flex items-center gap-1 ${invoiceErrors[ref].startsWith("Invoice created") ? "text-amber-600" : "text-red-600"}`}>
                              <AlertCircle className="w-4 h-4 shrink-0" /> {invoiceErrors[ref]}
                            </p>
                          )}
                        </section>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 pb-4">
          Move4U Admin Panel · {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* ── Bulk confirm modal ────────────────────────────────── */}
      {bulkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-8 sm:pb-0"
          onClick={() => { if (!bulkBusy) setBulkConfirm(null); }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-900 leading-snug mb-5">
              {bulkConfirm.label}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void bulkConfirm.onConfirm()}
                disabled={bulkBusy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
              <button
                onClick={() => setBulkConfirm(null)}
                disabled={bulkBusy}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email preview modal ───────────────────────────────── */}
      {emailPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEmailPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-purple-700 px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> Preview Email
              </h2>
              <button onClick={() => setEmailPreview(null)} className="text-purple-200 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-[70px_1fr] gap-x-3 gap-y-2 items-baseline">
                <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">From</span>
                <span className="text-gray-900 font-medium">info@move4u.uk</span>

                <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">To</span>
                <span className="text-gray-900">{emailPreview.to}</span>

                <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">Subject</span>
                <span className="text-gray-900">{emailPreview.subject}</span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="text-gray-400 font-medium text-xs uppercase tracking-wide block mb-2">Body</span>
                <pre className="whitespace-pre-wrap font-sans text-gray-800 bg-gray-50 rounded-xl p-3.5 text-xs leading-relaxed max-h-60 overflow-y-auto border border-gray-100">
                  {emailPreview.body}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setEmailPreview(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy !== null}
                onClick={() => void doSendConfirmation()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-60"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success toast ─────────────────────────────────────── */}
      {emailSentRef && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 duration-300">
          <Check className="w-4 h-4 shrink-0" />
          Email sent successfully from info@move4u.uk
        </div>
      )}
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function Field({
  label, value, type = "text", onChange, helper,
}: {
  label: string; value: string; type?: string;
  onChange: (v: string) => void; helper?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
      />
      {helper && <p className="mt-0.5 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

// ── Quick Contact section ─────────────────────────────────────
//
// Renders a compact "preferred channel + alternatives" toolbar so the
// driver can reach the customer in a single tap. The button matching
// `preferred` is the strong purple primary; the rest are outlined
// secondaries. Each link opens the native handler with the message
// pre-filled (whatsapp/sms/mailto) or starts a phone call.
//
// `intent` only affects copy ("Contact" vs "Send payment link"); the
// mechanics are identical.
function QuickContactSection({
  booking,
  message,
  intent,
}: {
  booking: BookingRecord;
  message: string;
  intent: "intro" | "payment";
}) {
  const preferred = normalizeChannel(booking.contactMethod);
  const channels: ContactChannel[] = ["whatsapp", "sms", "email", "call"];
  const preferredLabel = preferred ? CHANNEL_LABELS[preferred] : "any method";

  const heading =
    intent === "payment"
      ? `Customer prefers ${preferredLabel}. Send the payment link via ${preferredLabel}?`
      : `Customer prefers: ${preferredLabel}`;

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/40 px-3 py-3">
      <p className="text-xs font-medium text-purple-800 mb-2">{heading}</p>
      {/* Show the pre-filled message so the driver knows what's about to
          be sent. Wrapped in a muted box, monospaced for clarity. */}
      <details className="mb-2.5">
        <summary className="text-[11px] text-gray-500 cursor-pointer select-none hover:text-gray-700">
          Preview message
        </summary>
        <pre className="mt-1.5 text-[12px] text-gray-700 whitespace-pre-wrap font-sans bg-white border border-gray-100 rounded-lg px-2.5 py-2 leading-relaxed">
          {message}
        </pre>
      </details>
      <div className="flex flex-wrap gap-1.5">
        {channels.map((c) => {
          const isPreferred = preferred === c;
          const available = isChannelAvailable(c, booking);
          const href = available ? buildContactHref(c, booking, message) : undefined;
          const Icon =
            c === "whatsapp" ? MessageCircle : c === "sms" ? MessageSquare : c === "email" ? Mail : PhoneCall;
          const base =
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors";
          const styles = !available
            ? "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed"
            : isPreferred
              ? "bg-purple-700 text-white hover:bg-purple-800 shadow-sm"
              : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50";
          if (!available) {
            return (
              <span
                key={c}
                className={`${base} ${styles}`}
                title={c === "email" ? "No email address on file" : "No phone number on file"}
              >
                <Icon className="w-3.5 h-3.5" />
                {CHANNEL_LABELS[c]}
              </span>
            );
          }
          return (
            <a
              key={c}
              href={href}
              target={c === "whatsapp" || c === "email" ? "_blank" : undefined}
              rel={c === "whatsapp" || c === "email" ? "noopener noreferrer" : undefined}
              className={`${base} ${styles}`}
              data-testid={`quick-contact-${c}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {CHANNEL_LABELS[c]}
              {isPreferred && (
                <span className="text-[10px] uppercase tracking-wide opacity-90 ml-0.5">
                  preferred
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, disabled, loading, variant,
}: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; loading?: boolean;
  variant: "primary" | "green" | "red";
}) {
  const colors = {
    primary: "bg-purple-700 hover:bg-purple-800 text-white",
    green:   "bg-green-600 hover:bg-green-700 text-white",
    red:     "bg-white border border-red-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors[variant]}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
