import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  LogOut, Phone, MapPin, ExternalLink, AlertCircle, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

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
}

interface EditForm {
  bookingStatus: string;
  paymentStatus: string;
  agreedQuote: string;
  depositAmount: string;
  confirmedDate: string;
  confirmedTime: string;
  driverNotes: string;
}

// ── Constants ─────────────────────────────────────────────────

const BOOKING_STATUSES = ["New", "Contacted", "Confirmed", "Denied", "Booked", "Completed"];
const PAYMENT_STATUSES = ["Unpaid", "Payment link ready", "Paid", "Deposit paid"];
const STATUS_FILTERS   = ["All", "New", "Contacted", "Confirmed", "Booked", "Completed", "Denied"];

function initEditForm(b: BookingRecord): EditForm {
  return {
    bookingStatus: b.bookingStatus  || "New",
    paymentStatus: b.paymentStatus  || "Unpaid",
    agreedQuote:   b.agreedQuote    || "",
    depositAmount: b.depositAmount  || "",
    confirmedDate: b.confirmedDate  || "",
    confirmedTime: b.confirmedTime  || "",
    driverNotes:   b.driverNotes    || "",
  };
}

function calcSuggestedDeposit(quote: string): string {
  const n = parseFloat(quote);
  if (!n || n <= 0) return "";
  return (Math.round(n * 0.3 * 100) / 100).toFixed(2);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    New:        "bg-blue-100 text-blue-700",
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
  if (status === "Payment link ready") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-500";
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
    } else {
      setExpandedRef(ref);
      // Initialise edit form from current data if not already editing
      if (!editForms[ref]) {
        setEditForms((prev) => ({ ...prev, [ref]: initEditForm(booking) }));
      }
    }
  }

  function updateField(ref: string, field: keyof EditForm, value: string) {
    if (field === "depositAmount") {
      // Admin is manually typing a deposit — mark it as overridden
      setDepositOverridden((prev) => ({ ...prev, [ref]: true }));
    }
    setEditForms((prev) => {
      const form = { ...(prev[ref] ?? {}), [field]: value } as EditForm;
      // Auto-recalculate deposit when agreed quote changes, unless admin overrode it
      if (field === "agreedQuote" && !depositOverridden[ref]) {
        form.depositAmount = calcSuggestedDeposit(value);
      }
      return { ...prev, [ref]: form };
    });
  }

  async function saveChanges(ref: string) {
    const form = editForms[ref];
    if (!form) return;
    setSavingRef(ref);
    setSaveErrors((e) => ({ ...e, [ref]: "" }));
    try {
      const res = await apiFetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("save failed");
      // Update local booking record
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingReference === ref ? { ...b, ...form } : b,
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
        body: JSON.stringify(confirmedForm),
      });
      if (!res.ok) throw new Error("save failed");
      setBookings((prev) =>
        prev.map((b) => b.bookingReference === ref ? { ...b, ...confirmedForm } : b),
      );
      // Auto-generate payment link if deposit amount is set
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
    const deposit = booking.depositAmount ? `£${parseFloat(booking.depositAmount).toFixed(2)}` : "—";
    return (
      `Your booking is confirmed.\n\n` +
      `Booking reference: ${booking.bookingReference}\n` +
      `Deposit: ${deposit}\n\n` +
      `Please complete your payment using the link below:\n` +
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

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  const filtered =
    statusFilter === "All"
      ? bookings
      : bookings.filter((b) => b.bookingStatus === statusFilter);

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

            return (
              <div key={ref} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
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
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{booking.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span>{booking.service}</span>
                      {booking.phone && (
                        <a
                          href={`tel:${booking.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-purple-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />{booking.phone}
                        </a>
                      )}
                      {booking.timestamp && <span className="text-gray-400">{booking.timestamp}</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
                </button>

                {/* Expanded content */}
                {isExpanded && form && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-5">

                    {/* Customer info */}
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <InfoRow label="Contact via" value={booking.contactMethod} />
                        <InfoRow label="Estimated price" value={booking.estimatedPrice} />
                        <InfoRow label="Requested date" value={booking.date} />
                        <InfoRow label="Van" value={booking.vanSize} />
                        <InfoRow label="Help" value={booking.helpOption} />
                      </div>
                      {(booking.pickup || booking.dropoff) && (
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          {booking.pickup && (
                            <p className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <span><span className="text-gray-400 mr-1">From</span>{booking.pickup}</span>
                            </p>
                          )}
                          {booking.dropoff && (
                            <p className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                              <span><span className="text-gray-400 mr-1">To</span>{booking.dropoff}</span>
                            </p>
                          )}
                        </div>
                      )}
                      {booking.notes && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-gray-400 text-xs">Notes: </span>{booking.notes}
                        </p>
                      )}
                    </section>

                    {/* Status editors */}
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Booking Status</label>
                          <select
                            value={form.bookingStatus}
                            onChange={(e) => updateField(ref, "bookingStatus", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {BOOKING_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Payment Status</label>
                          <select
                            value={form.paymentStatus}
                            onChange={(e) => updateField(ref, "paymentStatus", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                          >
                            {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* Admin fields */}
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Booking Details</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Agreed Quote (£)"
                            value={form.agreedQuote}
                            type="number"
                            onChange={(v) => updateField(ref, "agreedQuote", v)}
                          />
                          <Field
                            label="Deposit Amount (£)"
                            value={form.depositAmount}
                            type="number"
                            onChange={(v) => updateField(ref, "depositAmount", v)}
                            helper="30% of agreed quote"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Confirmed Date"
                            value={form.confirmedDate}
                            type="date"
                            onChange={(v) => updateField(ref, "confirmedDate", v)}
                          />
                          <Field
                            label="Confirmed Time"
                            value={form.confirmedTime}
                            type="time"
                            onChange={(v) => updateField(ref, "confirmedTime", v)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Driver Notes</label>
                          <textarea
                            value={form.driverNotes}
                            onChange={(e) => updateField(ref, "driverNotes", e.target.value)}
                            rows={2}
                            placeholder="Internal notes about this booking…"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Action buttons */}
                    {saveErrors[ref] && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {saveErrors[ref]}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <ActionBtn
                        onClick={() => void saveChanges(ref)}
                        disabled={isSaving}
                        loading={isSaving}
                        variant="primary"
                      >
                        Save changes
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => void confirmBooking(ref)}
                        disabled={isSaving}
                        loading={isSaving}
                        variant="green"
                      >
                        Confirm booking
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => void denyBooking(ref)}
                        disabled={isSaving}
                        variant="red"
                      >
                        Deny
                      </ActionBtn>
                    </div>

                    {/* Payment link section */}
                    <section className="border-t border-gray-100 pt-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Payment Link</h3>

                      {payLink ? (() => {
                        const whatsappMsg = buildWhatsAppMessage(booking, payLink);
                        return (
                          <div className="space-y-3">
                            {/* Message preview */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                              <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">WhatsApp message preview</p>
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{whatsappMsg}</pre>
                            </div>

                            {/* Pay now link row */}
                            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                              <span className="text-xs font-semibold text-purple-700 shrink-0">Pay now →</span>
                              <p className="text-xs text-gray-500 truncate flex-1">{payLink}</p>
                              <a
                                href={payLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-purple-600 hover:text-purple-800"
                                title="Open payment page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => void copyMessage(whatsappMsg, ref)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-semibold hover:bg-purple-800 transition-colors"
                              >
                                {copiedMsg === ref ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedMsg === ref ? "Message copied!" : "Copy message"}
                              </button>
                              <button
                                onClick={() => void copyLink(payLink, ref)}
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {copied === ref ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied === ref ? "Copied!" : "Copy link only"}
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
