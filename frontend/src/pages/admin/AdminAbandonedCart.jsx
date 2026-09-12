import React, { useCallback, useEffect, useState } from "react";
import { Bell, Eye, LayoutGrid, Mail, RefreshCw, Settings as SettingsIcon, ShoppingBag, TrendingUp, UserX, X } from "lucide-react";
import { adminRecoveryService } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

const STATUS_META = {
  abandoned: { label: "Abandoned", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  reminder_sent: { label: "Reminder Sent", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  recovered: { label: "Recovered", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  not_recovered: { label: "Not Recovered", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

const STALE_BADGE_CLS = "bg-gray-500/15 text-gray-400 border-gray-500/30";

const formatINR = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(val || 0));

// IST display strings come formatted from the backend (never re-converted).
const ist = (value, fallback = "-") => value || fallback;

const formatFallback = (value) => {
  if (!value) return "-";
  const s = String(value).trim();
  let d;
  if (s.includes("T")) d = new Date(s.endsWith("Z") ? s : s + "Z");
  else d = new Date(s.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds))) return "-";
  const s = Number(seconds);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const statusBadge = (status) => {
  const key = status === "recovered_late" ? "recovered" : status;
  const meta = STATUS_META[key];
  if (!meta) return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${STALE_BADGE_CLS}`}>{status || "Unknown"}</span>;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${meta.cls}`}>{meta.label}</span>;
};

const REMINDER_ORDINALS = ["", "First", "Second", "Third"];

const reminderLabel = (record) => {
  const count = Number(record?.reminder_count || 0);
  const limit = Number(record?.reminder_limit || 3);
  if (count >= limit && count <= 3) return `${REMINDER_ORDINALS[count] || "Last"} Reminder Sent`;
  if (count > 3) return `${count} Reminders Sent`;
  if (count >= 1) return `${REMINDER_ORDINALS[count] || ""} Reminder Sent`;
  return "Not Sent";
};

const reminderAt = (record) =>
  record?.reminder_3_at_ist || record?.reminder_2_at_ist || record?.reminder_1_at_ist
    ? ist(record.reminder_3_at_ist || record.reminder_2_at_ist || record.reminder_1_at_ist)
    : "-";

// Which action button (if any) applies to this recovery record.
const actionFor = (record) => {
  if (!record?.can_send_reminder) return null;
  const count = Number(record?.reminder_count || 0);
  if (count === 0) return "send_first";
  if (count === 1) return "send_second";
  if (count === 2) return "send_third";
  return null;
};

function StatCard({ label, value, sub, icon: Icon, accent = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
        <p className="text-2xl font-bold text-white mt-2 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl border shrink-0 ${accent}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

function InlineError({ message = "This section could not be loaded.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-900/40 border border-red-500/20 rounded-2xl">
      <div className="w-14 h-14 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
        <RefreshCw size={24} />
      </div>
      <div className="text-center px-6">
        <p className="text-white font-semibold text-sm">Unable to load data</p>
        <p className="text-gray-500 text-xs mt-1 max-w-sm">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 rounded-xl text-xs font-semibold text-gray-200 transition"
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-900/40 border border-gray-800 px-4 py-3 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-sm font-semibold text-white mt-1 break-words">{value}</p>
    </div>
  );
}

const customerInfo = (record, field) => {
  const value = record?.customer?.[field];
  return value == null || String(value).trim() === "" ? "Not provided" : String(value);
};

function DetailModal({ record, onClose, onSendReminder, sending }) {
  if (!record) return null;
  const products = record.product_snapshot || [];
  const isRecovered = record.status === "recovered" || record.status === "recovered_late";
  const action = actionFor(record);
  const r1 = Number(record.reminder_count || 0) >= 1;
  const r2 = Number(record.reminder_count || 0) >= 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e0f12] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-[#0e0f12]">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">Recovery Record #{record.id}</h3>
            <p className="text-xs text-gray-500 truncate">Cart &middot; {record.user_email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(record.status)}
            <span className="text-xs text-gray-500">{reminderLabel(record)}</span>
          </div>

          {/* Customer — real registration/profile information (non-sensitive). */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Customer</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Info label="Full Name" value={customerInfo(record, "full_name")} />
              <Info label="Email" value={customerInfo(record, "email")} />
              <Info label="Phone" value={customerInfo(record, "phone")} />
              <Info label="Username" value={customerInfo(record, "username")} />
              <Info label="Registered" value={ist(record.customer?.registered_at_ist, "Not provided")} />
              <Info label="User ID" value={`#${record.user_id || "-"}`} />
              <Info label="Address" value={customerInfo(record, "address")} />
              <Info label="City" value={customerInfo(record, "city")} />
              <Info label="State" value={customerInfo(record, "state")} />
              <Info label="Country" value={customerInfo(record, "country")} />
              <Info label="Pincode" value={customerInfo(record, "pincode")} />
            </div>
          </section>

          {/* Abandoned cart information. */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Cart Information</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Info label="Cart Value" value={formatINR(record.value)} />
              <Info label="Items" value={String(record.item_count || 0)} />
              <Info label="Started" value={ist(record.started_at_ist)} />
              <Info label="Last Activity" value={ist(record.last_activity_at_ist)} />
              <Info label="Abandoned At" value={ist(record.abandoned_at_ist)} />
            </div>
          </section>

          {/* Recovery / reminders — manual-only, no schedule fields. */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Recovery &amp; Reminders</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Info label="First Reminder" value={r1 ? `Sent · ${ist(record.reminder_1_at_ist)}` : "Not sent"} />
              <Info label="Second Reminder" value={r2 ? `Sent · ${ist(record.reminder_2_at_ist)}` : "Not sent"} />
              <Info label="Third Reminder" value={r3 ? `Sent · ${ist(record.reminder_3_at_ist)}` : "Not sent"} />
              <Info label="Reminder Status" value={reminderLabel(record)} />
              {isRecovered ? (
                <>
                  <Info label="Recovered At" value={ist(record.recovered_at_ist)} />
                  <Info label="Order ID" value={record.completion_reference || "-"} />
                  <Info label="Recovery Value" value={formatINR(record.recovery_value)} />
                  <Info label="Recovery Time" value={formatDuration(record.recovery_time_seconds)} />
                </>
              ) : (
                <>
                  <Info label="Recovery Status" value={record.recovery_status_label || "-"} />
                  <Info label="Reminders Available" value={`${record.reminders_remaining ?? 0} of ${record.reminder_limit || 3}`} />
                </>
              )}
            </div>
          </section>

          {action && (
            <button
              type="button"
              onClick={() => onSendReminder(record)}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <Mail size={14} /> {record.action_label || "Send Reminder"}
            </button>
          )}

          <section>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Abandoned Cart Items ({products.length})</p>
            {products.length === 0 ? (
              <p className="text-sm text-gray-500">No product details captured.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">Product #{p.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-white">{p.quantity} x {formatINR(p.price)}</p>
                        <p className="text-xs text-gray-500">{formatINR((p.price || 0) * (p.quantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-gray-800 pt-3 mt-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Cart Total</p>
                  <p className="text-sm font-bold text-white">{formatINR(products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 1), 0))}</p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SendReminderModal({ record, onClose, onConfirm, sending, error }) {
  if (!record) return null;
  const count = Number(record.reminder_count || 0);
  const limit = Number(record.reminder_limit || 3);
  const nextNumber = Math.min(count + 1, limit);
  const ordinalLabel = REMINDER_ORDINALS[nextNumber] || `${nextNumber}`;
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e0f12] border border-gray-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">Send {ordinalLabel} Reminder</h3>
        <p className="text-xs text-gray-500 mt-1">A one-time reminder email will be sent to this customer using the saved Abandoned Cart template.</p>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-gray-900/40 border border-gray-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Recipient</p>
            <p className="text-sm font-semibold text-white mt-1 truncate">{record.user_name || "Unknown user"}</p>
            <p className="text-xs text-gray-500 truncate">{record.user_email}</p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-900/40 border border-gray-800 px-4 py-3">
            <p className="text-xs text-gray-400">Reminder</p>
            <p className="text-sm font-bold text-white">#{nextNumber} of {limit}</p>
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={sending} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <Mail size={14} /> {sending ? "Sending..." : `Send ${ordinalLabel} Reminder`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAbandonedCart() {
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: "", status: "", activityType: "CART", from: "", to: "" });
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reminderTarget, setReminderTarget] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState({ overview: false, records: false, settings: false });

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSummary = useCallback(async () => {
    setLoadError((prev) => ({ ...prev, overview: false }));
    try {
      const res = await adminRecoveryService.summary();
      setSummary(res.data || null);
    } catch (err) {
      setLoadError((prev) => ({ ...prev, overview: true }));
      showToast(err.message || "Failed to load summary", "error");
    }
  }, [showToast]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError((prev) => ({ ...prev, records: false }));
    try {
      const res = await adminRecoveryService.list(filters);
      const data = res.data || {};
      setRecords(data.records || []);
      setPagination(data.pagination || { page: filters.page, pages: 1, total: 0 });
    } catch (err) {
      setLoadError((prev) => ({ ...prev, records: true }));
      showToast(err.message || "Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const loadSettings = useCallback(async () => {
    setLoadError((prev) => ({ ...prev, settings: false }));
    try {
      const res = await adminRecoveryService.getSettings();
      setSettingsForm(res.data || null);
    } catch (err) {
      setLoadError((prev) => ({ ...prev, settings: true }));
      showToast(err.message || "Failed to load settings", "error");
    }
  }, [showToast]);

  const refreshAll = useCallback(async () => {
    if (tab === "overview") await loadSummary();
    if (tab === "records") await loadRecords();
    if (tab === "settings") await loadSettings();
  }, [tab, loadSummary, loadRecords, loadSettings]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "records") loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status, filters.activityType, filters.search, filters.from, filters.to]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshAll();
    };
    window.addEventListener("focus", refreshAll);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshAll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshAll]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminRecoveryService.detail(id);
      setSelected(res.data || null);
    } catch (err) {
      showToast(err.message || "Failed to load detail", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? value : prev.page }));

  const applySearch = (value) => setFilters((prev) => ({ ...prev, search: value, page: 1 }));

  const setNumberField = (key, value) => {
    const n = Number(value);
    setSettingsForm((prev) => ({ ...prev, [key]: n >= 0 ? n : "" }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const maxReminders = Math.max(1, Math.min(3, Number(settingsForm?.maxReminders) || 3));
      const res = await adminRecoveryService.updateSettings({
        enabled: Boolean(settingsForm?.enabled),
        thresholdMinutes: settingsForm?.thresholdMinutes ?? 60,
        maxReminders,
      });
      setSettingsForm(res.data || settingsForm);
      setLoadError((prev) => ({ ...prev, settings: false }));
      showToast(res.message || "Settings saved");
      if (tab === "overview") loadSummary();
    } catch (err) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const isTerminalReminderError = (msg) => {
    const lower = String(msg || "").toLowerCase();
    return (
      lower.includes("already completed the purchase") ||
      lower.includes("limit reached") ||
      lower.includes("cart is now empty") ||
      lower.includes("already sent")
    );
  };

  const confirmSendReminder = async () => {
    if (!reminderTarget) return;
    setSendingReminder(true);
    setReminderError("");
    try {
      const res = await adminRecoveryService.sendReminder(reminderTarget.id);
      setReminderTarget(null);
      showToast(res.message || "Reminder sent");
      if (tab === "records") loadRecords();
      loadSummary();
    } catch (err) {
      const msg = err.message || "Failed to send reminder";
      if (isTerminalReminderError(msg)) {
        setReminderTarget(null);
        showToast(msg, "error");
        if (tab === "records") loadRecords();
        loadSummary();
      } else {
        setReminderError(msg);
      }
    } finally {
      setSendingReminder(false);
    }
  };

  const pendingCount = summary ? (summary.pending_recovery || 0) : 0;
  const recovered = summary ? (summary.recovered || 0) : 0;
  const notRecovered = summary ? (summary.not_recovered || 0) : 0;

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    { key: "records", label: "Recovery Records", icon: ShoppingBag },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Abandoned Cart &amp; Recovery</h2>
          <p className="text-xs text-gray-500">Track abandoned carts for logged-in customers, send up to 3 one-time reminder emails, and measure recovered revenue.</p>
        </div>
        <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 rounded-xl text-xs font-semibold text-gray-300 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-gray-900/40 border border-gray-800 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              tab === key ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20" : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        loadError.overview ? (
          <InlineError message="The recovery summary API could not be reached. Confirm the backend is running with the latest code, then retry." onRetry={refreshAll} />
        ) : !summary ? <AdminLoading /> : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Abandoned" value={summary.total_abandoned || 0} sub={`${pendingCount} still open`} icon={ShoppingBag} accent="text-amber-400 bg-amber-500/10 border-amber-500/20" />
            <StatCard label="Needs Reminder" value={summary.needs_reminder || 0} sub="Awaiting a manual reminder" icon={Bell} accent="text-cyan-400 bg-cyan-500/10 border-cyan-500/20" />
            <StatCard label="Recovered" value={recovered} sub="Completed a real order" icon={TrendingUp} accent="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
            <StatCard label="Not Recovered" value={notRecovered} sub="No purchase recorded" icon={UserX} accent="text-gray-400 bg-gray-500/10 border-gray-500/20" />
            <StatCard label="Recovery Rate" value={`${summary.recovery_rate ?? 0}%`} sub={`Of ${summary.eligible_abandoned || 0} eligible carts`} icon={TrendingUp} accent="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
            <StatCard label="Recovered Value" value={formatINR(summary.recovered_value)} sub={`${recovered} carts recovered`} icon={ShoppingBag} accent="text-indigo-400 bg-indigo-500/10 border-indigo-500/20" />
          </div>
        )
      )}

      {tab === "records" && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-800">
            <div className="flex gap-1 bg-gray-900/40 border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => updateFilter("status", "needs_action")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                  filters.status === "needs_action" ? "bg-cyan-500/15 text-cyan-300" : "text-gray-400 hover:text-white"
                }`}
              >
                Needs Action
              </button>
              <button
                onClick={() => updateFilter("status", "")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                  !filters.status ? "bg-cyan-500/15 text-cyan-300" : "text-gray-400 hover:text-white"
                }`}
              >
                All Abandoned
              </button>
            </div>
            <input
              value={filters.search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search by email, name or product..."
              className="flex-1 min-w-[180px] bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500"
            />
            <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 cursor-pointer">
              <option value="">All Statuses</option>
              <option value="needs_action">Needs Reminder</option>
              <option value="pending">Pending Recovery</option>
              <option value="abandoned">Abandoned</option>
              <option value="reminder_sent">Reminder Sent</option>
              <option value="recovered">Recovered</option>
              <option value="not_recovered">Not Recovered</option>
            </select>
            <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" />
            <button onClick={() => setFilters({ page: 1, limit: 20, search: "", status: "", activityType: "CART", from: "", to: "" })} className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
              Clear
            </button>
          </div>

          {loadError.records ? (
            <InlineError message="The recovery records API could not be reached. Confirm the backend is running with the latest code, then retry." onRetry={refreshAll} />
          ) : loading ? <AdminLoading /> : (
            <>
              {/* Mobile / tablet — stacked cards */}
              <div className="lg:hidden divide-y divide-gray-800/60">
                {records.map((r) => (
                  <RecordCard key={r.id} record={r} onOpen={() => openDetail(r.id)} onSend={() => setReminderTarget(r)} />
                ))}
                {records.length === 0 && <p className="p-8 text-center text-gray-500">No recovery records found.</p>}
              </div>

              {/* Desktop — 7-column table, fits without horizontal scroll */}
              <div className="hidden lg:block">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                      <th className="w-[24%] p-4 font-semibold">Customer</th>
                      <th className="w-[7%] p-4 font-semibold text-center">Items</th>
                      <th className="w-[12%] p-4 font-semibold text-right">Cart Value</th>
                      <th className="w-[17%] p-4 font-semibold">Abandoned</th>
                      <th className="w-[17%] p-4 font-semibold">Reminder</th>
                      <th className="w-[13%] p-4 font-semibold text-center">Status</th>
                      <th className="w-[10%] p-4 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-800/20 transition align-middle">
                        <td className="p-4 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{r.user_name || r.user_email}</p>
                          <p className="text-xs text-gray-500 truncate">{r.user_email}</p>
                        </td>
                        <td className="p-4 text-center text-sm font-semibold text-white">{r.item_count || 0}</td>
                        <td className="p-4 text-right min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{formatINR(r.value)}</p>
                          {r.is_recovery && <p className="text-[11px] text-emerald-400 truncate">→ {formatINR(r.recovery_value)}</p>}
                        </td>
                        <td className="p-4 text-[11px] text-gray-400">{ist(r.abandoned_at_ist, formatFallback(r.abandoned_at))}</td>
                        <td className="p-4 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{reminderLabel(r)}</p>
                          {Number(r.reminder_count || 0) >= 1 && <p className="text-[10px] text-gray-500 truncate">{reminderAt(r)}</p>}
                        </td>
                        <td className="p-4 text-center">{statusBadge(r.status)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openDetail(r.id)} disabled={detailLoading} className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition" title="View details">
                              <Eye size={16} />
                            </button>
                            {actionFor(r) && r.can_send_reminder ? (
                              <button
                                onClick={() => setReminderTarget(r)}
                                disabled={detailLoading}
                                className="px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 rounded-lg transition whitespace-nowrap"
                                title={actionFor(r) === "send_third" ? "Send third reminder" : actionFor(r) === "send_second" ? "Send second reminder" : "Send reminder"}
                              >
                                {actionFor(r) === "send_third" ? "Send 3rd" : actionFor(r) === "send_second" ? "Send 2nd" : "Send"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500">No recovery records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination page={pagination.page} totalPages={pagination.pages} onPageChange={(p) => updateFilter("page", p)} />
            </>
          )}
        </div>
      )}

      {tab === "settings" && (
        loadError.settings ? (
          <InlineError message="The recovery settings API could not be reached. Confirm the backend is running with the latest code, then retry." onRetry={refreshAll} />
        ) : !settingsForm ? <AdminLoading /> : (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 max-w-3xl space-y-5">
            <div>
              <p className="text-lg font-bold text-white">Recovery Settings</p>
              <p className="text-xs text-gray-500">Abandoned carts are detected automatically after a period of inactivity. Reminders are sent manually by you; each customer can receive up to 3.</p>
            </div>

            <label className="flex items-start justify-between gap-4 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-white">Enable Abandoned Cart Recovery</p>
                <p className="text-xs text-gray-500">When enabled, the server automatically detects abandoned carts and creates recovery records.</p>
              </div>
              <input type="checkbox" checked={Boolean(settingsForm.enabled)} onChange={(e) => setSettingsForm((prev) => ({ ...prev, enabled: e.target.checked }))} className="w-5 h-5 accent-cyan-500 shrink-0" />
            </label>

            <NumberField label="Abandonment Threshold (minutes)" hint="Inactivity after which a cart becomes a recovery candidate." value={settingsForm.thresholdMinutes} onChange={(v) => setNumberField("thresholdMinutes", v)} />

            <NumberField label="Maximum Reminders (1–3)" hint="Maximum manual reminder emails a single abandoned cart can receive." value={settingsForm.maxReminders ?? 3} onChange={(v) => setNumberField("maxReminders", v)} />

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveSettings} disabled={saving} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-bold transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <AdminLoading />
        </div>
      )}
      {!detailLoading && (
        <DetailModal
          record={selected}
          onClose={() => setSelected(null)}
          onSendReminder={(record) => setReminderTarget(record)}
          sending={sendingReminder && reminderTarget?.id === selected?.id}
        />
      )}
      {reminderTarget && (
        <SendReminderModal
          record={reminderTarget}
          onClose={() => { setReminderTarget(null); setReminderError(""); }}
          onConfirm={confirmSendReminder}
          sending={sendingReminder}
          error={reminderError}
        />
      )}
    </div>
  );
}

function RecordCard({ record, onOpen, onSend }) {
  const action = actionFor(record);
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white truncate">{record.user_name || record.user_email}</p>
          <p className="text-xs text-gray-500 truncate">{record.user_email}</p>
        </div>
        {statusBadge(record.status)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Cart Value</p>
          <p className="text-sm font-semibold text-white truncate">{formatINR(record.value)}</p>
          {record.is_recovery && <p className="text-[11px] text-emerald-400 truncate">→ {formatINR(record.recovery_value)}</p>}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Abandoned At</p>
          <p className="text-sm font-semibold text-white">{ist(record.abandoned_at_ist, formatFallback(record.abandoned_at))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Reminder</p>
          <p className="text-sm font-semibold text-white">{reminderLabel(record)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Items</p>
          <p className="text-sm font-semibold text-white">{record.item_count || 0}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onOpen} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700 rounded-lg text-xs font-semibold text-gray-200 transition">
          <Eye size={13} /> Details
        </button>
        {action ? (
          <button onClick={onSend} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 rounded-lg text-xs font-semibold text-emerald-300 transition">
            <Mail size={13} /> {action === "send_third" ? "Send Third Reminder" : action === "send_second" ? "Send Second Reminder" : "Send Reminder"}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-lg text-xs font-semibold text-gray-500">
            <ShoppingBag size={13} /> No action
          </span>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, hint, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 mb-1">{label}</label>
      <input
        type="number"
        min="1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
      />
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}