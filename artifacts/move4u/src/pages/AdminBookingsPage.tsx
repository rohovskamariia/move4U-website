import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  LogOut, Phone, MapPin, ExternalLink, AlertCircle, Loader2,
  MessageCircle, MessageSquare, Mail, PhoneCall, Plus, X,
} from "lucide-react";
import { toE164, toWhatsAppDigits } from "@/lib/validators";
import { useNoIndex } from "@/lib/usePageMeta";

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
  adminExtraStops:    string; // JSON [{address,charge,notes}]
  adminExtraCharges:  string; // JSON [{type,amount,notes}]
}

interface EditForm {
  bookingStatus:     string;
  paymentStatus:     string;
  agreedQuote:       string;
  depositAmount:     string;
  confirmedDate:     string;
  confirmedTime:     string;
  driverNotes:       string;
  notes:             string;
  pickup:            string;
  dropoff:           string;
  duration:          string;
  adminExtraStops:   AdminExtraStop[];
  adminExtraCharges: AdminExtraCharge[];
}

// ── Constants ─────────────────────────────────────────────────

// Feature flag — must match server-side ENABLE_STRIPE_INVOICES env var.
// Keep false until the invoice feature is intentionally re-enabled.
const ENABLE_STRIPE_INVOICES = false;

const BOOKING_STATUSES     = ["New", "Contacted", "Confirmed", "Denied", "Booked", "Completed"];
const PAYMENT_STATUSES     = ["Unpaid", "Payment link ready", "Invoice created", "Invoice sent", "Deposit paid", "Invoice payment failed", "Fully paid", "Paid"];
const STATUS_FILTERS       = ["All", "New", "Contacted", "Confirmed", "Booked", "Completed", "Denied"];
const EXTRA_CHARGE_TYPES   = ["Extra time", "Stairs", "Congestion charge", "Outside M25", "Manual adjustment"];

function initEditForm(b: BookingRecord): EditForm {
  const safeParseStops   = (s: string): AdminExtraStop[]   => { try { return JSON.parse(s || "[]"); } catch { return []; } };
  const safeParseCharges = (s: string): AdminExtraCharge[] => { try { return JSON.parse(s || "[]"); } catch { return []; } };
  return {
    bookingStatus:     b.bookingStatus  || "New",
    paymentStatus:     b.paymentStatus  || "Unpaid",
    agreedQuote:       b.agreedQuote    || "",
    depositAmount:     b.depositAmount  || "",
    confirmedDate:     b.confirmedDate  || "",
    confirmedTime:     b.confirmedTime  || "",
    driverNotes:       b.driverNotes    || "",
    notes:             b.notes          || "",
    pickup:            b.pickup         || "",
    dropoff:           b.dropoff        || "",
    duration:          b.duration       || "",
    adminExtraStops:   safeParseStops(b.adminExtraStops),
    adminExtraCharges: safeParseCharges(b.adminExtraCharges),
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
      // Gmail compose link — pre-fills To, Subject and Body.
      // ⚠ Admin must verify the sender is move4u.uk@gmail.com before sending.
      const addr = email || "";
      const subject = `Move4U — Booking ${b.bookingReference}`;
      return (
        `https://mail.google.com/mail/?view=cm&fs=1` +
        `&to=${encodeURIComponent(addr)}` +
        `&su=${encodeURIComponent(subject)}` +
        `&body=${encoded}`
      );
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
  if (status === "Paid" || status === "Deposit paid") return "bg-green-100 text-green-700";
  if (status === "Payment link ready") return "bg-fuchsia-100 text-fuchsia-700";
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
  const [expandedSections, setExpandedSections] = useState<Record<string, Set<string>>>({});

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
      const res = await apiFetch("/api/admin/bookings");
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
      [ref]: { ...(prev[ref] ?? {}), adminExtraStops: [...(prev[ref]?.adminExtraStops ?? []), { address: "", charge: "", notes: "" }] } as EditForm,
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
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          adminExtraStops:   JSON.stringify(form.adminExtraStops),
          adminExtraCharges: JSON.stringify(form.adminExtraCharges),
          notify: "false",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, ...form, adminExtraStops: JSON.stringify(form.adminExtraStops), adminExtraCharges: JSON.stringify(form.adminExtraCharges) }
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
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          adminExtraStops:   JSON.stringify(form.adminExtraStops),
          adminExtraCharges: JSON.stringify(form.adminExtraCharges),
          notify: "true",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, ...form, adminExtraStops: JSON.stringify(form.adminExtraStops), adminExtraCharges: JSON.stringify(form.adminExtraCharges) }
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
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...confirmedForm,
          adminExtraStops:   JSON.stringify(confirmedForm.adminExtraStops),
          adminExtraCharges: JSON.stringify(confirmedForm.adminExtraCharges),
          notify: "false",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) => b.bookingReference === ref
          ? { ...b, ...confirmedForm, adminExtraStops: JSON.stringify(confirmedForm.adminExtraStops), adminExtraCharges: JSON.stringify(confirmedForm.adminExtraCharges) }
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

  async function generatePaymentLink(ref: string, formOverride?: EditForm) {
    const form = formOverride ?? editForms[ref];
    if (!form) return;
    if (!form.depositAmount) {
      setLinkErrors((e) => ({ ...e, [ref]: "Enter a deposit amount before generating a link." }));
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

  function buildConfirmationEmailHref(b: BookingRecord, form: EditForm): string {
    const email   = parseEmailFromContactMethod(b.contactMethod);
    const subject = `Updated Booking Confirmation — ${b.bookingReference}`;
    const date    = form.confirmedDate || b.date     || "TBC";
    const time    = form.confirmedTime || b.timeWindow || "TBC";
    const from    = form.pickup  || b.pickup  || "—";
    const to      = form.dropoff || b.dropoff || "—";
    const quote   = form.agreedQuote   ? `£${parseFloat(form.agreedQuote).toFixed(2)}`   : b.estimatedPrice || "TBC";
    const deposit = form.depositAmount ? `£${parseFloat(form.depositAmount).toFixed(2)}` : "—";
    const name    = b.name || "there";

    const body =
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
      `🌐 https://move4u.uk`;

    return (
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    );
  }

  async function recordConfirmationSent(ref: string, subject: string, sentTo: string) {
    setConfirmBusy(ref);
    try {
      await apiFetch(
        `/api/admin/bookings/${encodeURIComponent(ref)}/send-confirmation`,
        { method: "POST", body: JSON.stringify({ subject, sentTo }) },
      );
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref
            ? { ...b, confirmationSent: "Yes", confirmationSentAt: new Date().toISOString() }
            : b,
        ),
      );
    } catch {
      // Best-effort tracking — don't block the admin
    } finally {
      setConfirmBusy(null);
    }
  }

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  const filtered = (() => {
    const base =
      statusFilter === "All"
        ? bookings
        : bookings.filter((b) => b.bookingStatus === statusFilter);

    // Sort by booking-reference number ascending (oldest first, newest last).
    // Extract the trailing digits from refs like "MV4U-1030" and compare
    // numerically — string comparison would put "MV4U-1029" after "MV4U-10000".
    const refNum = (ref: string): number => {
      const m = ref.match(/(\d+)\s*$/);
      return m ? parseInt(m[1]!, 10) : Number.MAX_SAFE_INTEGER;
    };
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
            onClick={() => void fetchBookings()}
            disabled={loading}
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
            const count = f === "All" ? bookings.length : bookings.filter((b) => b.bookingStatus === f).length;
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
        {!loading && filtered.length === 0 && !fetchError && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No bookings found{statusFilter !== "All" ? ` with status "${statusFilter}"` : ""}.</p>
          </div>
        )}

        {/* Booking cards */}
        <div className="space-y-3">
          {filtered.map((booking) => {
            const ref = booking.bookingReference;
            const isExpanded = expandedRef === ref;
            const form = editForms[ref];
            const isSaving = savingRef === ref;
            const isLinkBusy = linkBusy === ref;
            const payLink = booking.paymentLink;
            const waitInfo = getWaitingInfo(booking.timestamp);
            const needsAttention = NEEDS_ACTION.has(booking.bookingStatus) && waitInfo.minutesAgo > 0;
            const cardBorder = needsAttention ? priorityCardBorder(waitInfo.priority) : "border-gray-200";

            return (
              <div key={ref} className={`bg-white border rounded-2xl overflow-hidden ${cardBorder}`}>
                {/* Card header — always visible */}
                <button
                  onClick={() => toggleExpand(ref, booking)}
                  className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
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

                    {/* ── Extra Charges (collapsible, collapsed by default) ── */}
                    <section className="border-t border-gray-100 pt-2">
                      <button onClick={() => toggleSection(ref, "charges")}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 hover:text-purple-700 transition-colors">
                        <span className="flex items-center gap-2">
                          Extra Charges
                          {form.adminExtraCharges.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold">
                              {form.adminExtraCharges.length}
                            </span>
                          )}
                        </span>
                        {isSectionOpen(ref, "charges") ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {isSectionOpen(ref, "charges") && (
                        <div className="mt-1 space-y-2 pb-2">
                          {form.adminExtraCharges.map((charge, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="flex-1 space-y-1.5">
                                <select value={charge.type}
                                  onChange={(e) => updateExtraCharge(ref, i, "type", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600">
                                  <option value="">Select type…</option>
                                  {EXTRA_CHARGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                                <input value={charge.notes}
                                  onChange={(e) => updateExtraCharge(ref, i, "notes", e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-600" />
                              </div>
                              <input value={charge.amount}
                                onChange={(e) => updateExtraCharge(ref, i, "amount", e.target.value)}
                                placeholder="£ amount"
                                className="w-20 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600" />
                              <button onClick={() => removeExtraCharge(ref, i)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 mt-0.5">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addExtraCharge(ref)}
                            className="flex items-center gap-1.5 text-xs text-purple-700 font-medium hover:text-purple-900 transition-colors px-1 py-1">
                            <Plus className="w-3.5 h-3.5" /> Add charge
                          </button>
                        </div>
                      )}
                    </section>

                    {/* ── Price Breakdown (collapsible, collapsed by default) ── */}
                    <section className="border-t border-gray-100 pt-2">
                      <button onClick={() => toggleSection(ref, "breakdown")}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 hover:text-purple-700 transition-colors">
                        <span>Price Breakdown</span>
                        {isSectionOpen(ref, "breakdown") ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {isSectionOpen(ref, "breakdown") && (() => {
                        const agreed       = parseFloat(form.agreedQuote) || 0;
                        const stopsTotal   = form.adminExtraStops.reduce((s, x) => s + (parseFloat(x.charge) || 0), 0);
                        const chargesTotal = form.adminExtraCharges.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                        const base         = Math.max(0, agreed - stopsTotal - chargesTotal);
                        const deposit      = parseFloat(form.depositAmount) || 0;
                        const remaining    = Math.max(0, agreed - deposit);
                        return (
                          <div className="mt-1 mb-2 bg-purple-50/60 border border-purple-100 rounded-xl px-4 py-3 space-y-1.5">
                            {/* Original booking data when captured */}
                            {(booking.baseCharge || booking.duration || booking.stairsCharge || booking.congestionCharge) && (
                              <div className="pb-2 mb-2 border-b border-purple-100">
                                <p className="text-[11px] font-semibold text-purple-500 uppercase tracking-wide mb-1.5">Original booking data</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                                  {booking.duration         && <span><span className="text-gray-400">Duration: </span>{booking.duration}</span>}
                                  {booking.hourlyRate       && <span><span className="text-gray-400">Rate: </span>{booking.hourlyRate}</span>}
                                  {booking.baseCharge       && <span><span className="text-gray-400">Base: </span>{booking.baseCharge}</span>}
                                  {booking.stairsCharge     && <span><span className="text-gray-400">Stairs: </span>+{booking.stairsCharge}</span>}
                                  {booking.extraStopCharge  && <span><span className="text-gray-400">Stops: </span>+{booking.extraStopCharge}</span>}
                                  {booking.congestionCharge && <span><span className="text-gray-400">CCZ: </span>+{booking.congestionCharge}</span>}
                                  {booking.outsideM25Charge && <span><span className="text-gray-400">M25: </span>+{booking.outsideM25Charge}</span>}
                                </div>
                                {(booking.extraStop1 || booking.extraStop2 || booking.extraStop3) && (
                                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                                    {booking.extraStop1 && <p><span className="text-gray-400">Stop 1: </span>{booking.extraStop1}</p>}
                                    {booking.extraStop2 && <p><span className="text-gray-400">Stop 2: </span>{booking.extraStop2}</p>}
                                    {booking.extraStop3 && <p><span className="text-gray-400">Stop 3: </span>{booking.extraStop3}</p>}
                                  </div>
                                )}
                              </div>
                            )}
                            <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Current total</p>
                            <div className="space-y-1 text-sm">
                              {agreed > 0 && <div className="flex justify-between text-gray-600"><span>Base price</span><span>£{base.toFixed(2)}</span></div>}
                              {stopsTotal > 0   && <div className="flex justify-between text-gray-600"><span>Extra stops</span><span>+£{stopsTotal.toFixed(2)}</span></div>}
                              {chargesTotal > 0 && <div className="flex justify-between text-gray-600"><span>Extra charges</span><span>+£{chargesTotal.toFixed(2)}</span></div>}
                              {agreed > 0 && (
                                <div className="flex justify-between font-semibold border-t border-purple-200 pt-1 mt-0.5">
                                  <span>Agreed total</span><span>£{agreed.toFixed(2)}</span>
                                </div>
                              )}
                              {deposit > 0 && <div className="flex justify-between text-gray-500"><span>Deposit paid</span><span>−£{deposit.toFixed(2)}</span></div>}
                              {deposit > 0 && (
                                <div className="flex justify-between font-semibold text-purple-700">
                                  <span>Remaining</span><span>£{remaining.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </section>

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

                    {/* Payment link section */}
                    <section className="border-t border-gray-100 pt-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Payment Link</h3>

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
                            No payment link yet. Enter the deposit amount above, then generate a personal Stripe link for this booking.
                          </p>
                          <button
                            onClick={() => void generatePaymentLink(ref)}
                            disabled={isLinkBusy || !form.depositAmount}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLinkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Generate payment link
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
                      const subject       = `Updated Booking Confirmation — ${booking.bookingReference}`;
                      const confirmHref   = buildConfirmationEmailHref(booking, form);
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
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-3">
                            ⚠ This opens Gmail compose. Verify the sender is <strong>move4u.uk@gmail.com</strong> before sending.
                          </div>
                          <a
                            href={confirmHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              void recordConfirmationSent(ref, subject, email);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white text-sm font-semibold rounded-xl hover:bg-purple-800 transition-colors"
                          >
                            {isConfirmBusy
                              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recording…</>
                              : <><Mail className="w-3.5 h-3.5" /> {alreadySent ? "Re-send Confirmation" : "Send Updated Confirmation"}</>
                            }
                          </a>
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
