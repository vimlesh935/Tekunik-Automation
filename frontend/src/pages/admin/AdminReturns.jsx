import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCcw, CheckCircle2, XCircle, RefreshCcw, Search, Eye,
  X, Loader2, Clock, ShieldCheck, ArrowRight, BadgeIndianRupee,
  ChevronDown, ChevronUp, MoreHorizontal,
} from "lucide-react";
import apiCall from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

const STATUS_META = {
  pending: { label: "Pending Review", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  approved: { label: "Approved", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  rejected: { label: "Rejected", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  product_received: { label: "Product Received", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  refund_processing: { label: "Refund Processing", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  refunded: { label: "Refunded", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

const REFUND_STATUS_META = {
  pending: { label: "Pending", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  processing: { label: "Processing", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  failed: { label: "Failed", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online Payments" },
  { key: "cod", label: "COD" },
  { key: "returns", label: "Returns" },
  { key: "refunds", label: "Refunds" },
  { key: "pending_action", label: "Pending Action" },
  { key: "completed", label: "Completed" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "product_received", label: "Product Received" },
  { value: "refund_processing", label: "Refund Processing" },
  { value: "refunded", label: "Refunded" },
];

const FORM_INR = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const fmtDateShort = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default function AdminReturns() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [requestType, setRequestType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Action confirm modals
  const [confirm, setConfirm] = useState(null);
  const [modalInput, setModalInput] = useState("");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 20);
      if (tab) params.set("tab", tab);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (requestType) params.set("request_type", requestType);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await apiCall(`/api/admin/order-returns?${params.toString()}`);
      const data = res.data || {};
      setRows(data.returnRequests || []);
      setSummary(data.summary || {});
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load returns", "error");
    } finally {
      setLoading(false);
    }
  }, [page, tab, search, statusFilter, requestType, dateFrom, dateTo, showToast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (row) => {
    setDetailLoading(row.id);
    try {
      const res = await apiCall(`/api/admin/order-returns/${row.id}`);
      const data = res.data?.returnRequest;
      if (!data) throw new Error("Return details unavailable");
      setDetail(data);
    } catch (err) {
      showToast(`Failed to load details: ${err.message}`, "error");
    } finally {
      setDetailLoading(null);
    }
  };

  const refreshAfterAction = async () => {
    fetchList();
    if (detail) {
      try {
        const res = await apiCall(`/api/admin/order-returns/${detail.id}`);
        setDetail(res.data?.returnRequest || detail);
      } catch {
        /* keep stale detail */
      }
    }
  };

  const runAction = async () => {
    if (!confirm) return;
    setActionLoading(confirm.type);
    try {
      const { type, row } = confirm;
      if (type === "approve") {
        await apiCall(`/api/admin/order-returns/${row.id}/approve`, {
          method: "POST",
          body: JSON.stringify({ approved_amount: row.requested_amount ?? null, notes: "Approved by admin" }),
        });
        showToast("Return request approved.");
      } else if (type === "reject") {
        if (modalInput.trim().length < 3) {
          showToast("A rejection reason (min 3 characters) is required.", "error");
          return;
        }
        await apiCall(`/api/admin/order-returns/${row.id}/reject`, {
          method: "POST",
          body: JSON.stringify({ rejection_reason: modalInput.trim() }),
        });
        showToast("Return request rejected.");
      } else if (type === "start_refund") {
        const res = await apiCall(`/api/admin/order-returns/${row.id}/start-refund`, {
          method: "POST",
          body: JSON.stringify({
            notes: modalInput.trim() || "Refund initiated by admin",
            refund_reference: null,
          }),
        });
        const refund = res.data?.refund;
        if (refund?.auto_completed) {
          showToast("Refund completed via payment gateway.");
        } else if (refund?.message) {
          showToast(refund.message, refund.attempted ? "error" : "success");
        } else {
          showToast("Refund started.");
        }
      } else if (type === "complete_refund") {
        await apiCall(`/api/admin/order-returns/${row.id}/complete-refund`, {
          method: "POST",
          body: JSON.stringify({ refund_reference: modalInput.trim() || null }),
        });
        showToast("Refund marked as completed.");
      } else if (type === "process_cod_refund") {
        await apiCall(`/api/admin/order-returns/${row.id}/process-cod-refund`, {
          method: "POST",
        });
        showToast("COD refund processed and marked completed.");
      }
      setConfirm(null);
      setModalInput("");
      refreshAfterAction();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const summaryCards = useMemo(() => [
    { label: "Total Requests", value: summary.total ?? rows.length, color: "from-gray-700 to-gray-900", icon: RotateCcw },
    { label: "Pending Review", value: summary.pending_review ?? 0, color: "from-amber-700/70 to-amber-900/60", icon: Clock },
    { label: "Approved", value: summary.approved ?? 0, color: "from-cyan-700/70 to-cyan-900/60", icon: CheckCircle2 },
    { label: "Rejected", value: summary.rejected ?? 0, color: "from-rose-700/70 to-rose-900/60", icon: XCircle },
    { label: "Refund Processing", value: summary.refund_processing ?? 0, color: "from-indigo-700/70 to-indigo-900/60", icon: RefreshCcw },
    { label: "Refunded", value: summary.refunded ?? 0, color: "from-emerald-700/70 to-emerald-900/60", icon: ShieldCheck },
  ], [summary, rows.length]);

  const badge = (meta) => (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${meta?.color || "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta?.label || "Unknown"}
    </span>
  );

  return (
    <div className="space-y-5">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Returns & Refunds</h2>
          <p className="text-xs text-gray-500 mt-0.5">Review return requests, approve or reject them, and track refunds end-to-end.</p>
        </div>
      </div>

      {/* Summary cards - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 p-3 sm:p-4 min-h-[90px]`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-300 truncate pr-2">{card.label}</p>
              <card.icon size={14} className="text-white/70 flex-shrink-0" />
            </div>
            <p className="mt-1.5 text-lg sm:text-2xl font-extrabold text-white">{card.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              tab === t.key
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-gray-900/40 text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput.trim()); setPage(1); } }}
            placeholder="Search customer, email, order #..."
            className="w-full bg-black border border-gray-700 rounded-xl pl-9 pr-9 py-2 text-sm outline-none text-white focus:border-cyan-400"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white" aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="bg-black border border-gray-700 text-sm rounded-xl px-3 py-2 outline-none text-white focus:border-cyan-400 cursor-pointer">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={requestType} onChange={(e) => { setPage(1); setRequestType(e.target.value); }} className="bg-black border border-gray-700 text-sm rounded-xl px-3 py-2 outline-none text-white focus:border-cyan-400 cursor-pointer">
          <option value="">All Types</option>
          <option value="return">Return</option>
          <option value="exchange">Exchange</option>
          <option value="refund">Refund</option>
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} className="bg-black border border-gray-700 text-sm rounded-xl px-3 py-2 outline-none text-white focus:border-cyan-400 [color-scheme:dark] min-w-[140px] flex-1" />
          <input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} className="bg-black border border-gray-700 text-sm rounded-xl px-3 py-2 outline-none text-white focus:border-cyan-400 [color-scheme:dark] min-w-[140px] flex-1" />
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {loading ? (
        <AdminLoading />
      ) : isMobile ? (
        <MobileCards rows={rows} onView={openDetail} detailLoading={detailLoading} />
      ) : (
        <DesktopTable
          rows={rows}
          onView={openDetail}
          detailLoading={detailLoading}
          FORM_INR={FORM_INR}
          fmtDate={fmtDate}
          badge={badge}
        />
      )}

      {!loading && !isMobile && (
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Detail Drawer (Desktop) / Modal (Mobile) */}
      {detail && (
        <DetailDrawer
          detail={detail}
          onClose={() => setDetail(null)}
          onAction={(type) => { setConfirm({ type, row: detail }); setModalInput(""); }}
          FORM_INR={FORM_INR}
          fmtDate={fmtDate}
          fmtDateShort={fmtDateShort}
          badge={badge}
        />
      )}

      {/* Confirm action modal */}
      {confirm && (
        <ConfirmModal
          confirm={confirm}
          modalInput={modalInput}
          setModalInput={setModalInput}
          onCancel={() => { setConfirm(null); setModalInput(""); }}
          onConfirm={runAction}
          actionLoading={actionLoading}
          FORM_INR={FORM_INR}
        />
      )}
    </div>
  );
}

/* ============================================================
   MOBILE CARDS
   ============================================================ */
function MobileCards({ rows, onView, detailLoading }) {
  if (rows.length === 0) {
    return (
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center">
        <p className="text-gray-500">No return requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-xs font-bold text-white">{row.order_number}</span>
                <span className="text-xs text-gray-500">{row.order_date ? fmtDateShort(row.order_date) : "-"}</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{row.customer_name || "Guest"}</p>
              <p className="text-xs text-gray-500 truncate">{row.customer_email || "-"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gray-700 bg-gray-800/40 px-2 py-0.5 text-xs font-medium capitalize text-gray-300">{row.request_type || "return"}</span>
                {badge(STATUS_META[row.status])}
                {row.refund_status && badge(REFUND_STATUS_META[row.refund_status])}
                {row.payment_method && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                    String(row.payment_method).toLowerCase() === "cod" || String(row.payment_method).toLowerCase() === "cash_on_delivery"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  }`}>
                    {row.payment_method.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {row.product_name || `${row.product_count || 0} items`} • {FORM_INR(row.requested_amount)}
              </p>
            </div>
            <button
              onClick={() => onView(row)}
              disabled={detailLoading === row.id}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
            >
              {detailLoading === row.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   DESKTOP TABLE
   ============================================================ */
function DesktopTable({ rows, onView, detailLoading, FORM_INR, fmtDate, badge }) {
  if (rows.length === 0) {
    return (
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center">
        <p className="text-gray-500">No return requests found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">Order</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold">Product</th>
              <th className="p-3 font-semibold text-right">Amount</th>
              <th className="p-3 font-semibold text-center">Type</th>
              <th className="p-3 font-semibold text-center">Status</th>
              <th className="p-3 font-semibold text-center w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-800/20 transition">
                <td className="p-3">
                  <p className="text-sm font-semibold text-white truncate max-w-[200px]">{row.customer_name || "Guest"}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.customer_email || "-"}</p>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <p className="font-mono text-xs font-bold text-white">{row.order_number}</p>
                  <p className="text-xs text-gray-500">{row.order_date ? fmtDate(row.order_date) : "-"}</p>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                    String(row.payment_method).toLowerCase() === "cod" || String(row.payment_method).toLowerCase() === "cash_on_delivery"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  }`}>
                    {row.payment_method ? row.payment_method.toUpperCase() : "—"}
                  </span>
                </td>
                <td className="p-3">
                  <p className="text-sm font-medium text-white truncate max-w-[180px]">{row.product_name || `${row.product_count || 0} items`}</p>
                  {row.product_quantity > 0 && <p className="text-xs text-gray-500">qty {row.product_quantity}</p>}
                </td>
                <td className="p-3 text-right text-sm font-mono text-emerald-400 whitespace-nowrap">{FORM_INR(row.requested_amount)}</td>
                <td className="p-3 text-center whitespace-nowrap">
                  <span className="rounded-full border border-gray-700 bg-gray-800/40 px-2 py-0.5 text-xs font-medium capitalize text-gray-300">{row.request_type || "return"}</span>
                </td>
                <td className="p-3 text-center whitespace-nowrap">{badge(STATUS_META[row.status])}</td>
                <td className="p-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => onView(row)}
                    disabled={detailLoading === row.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                  >
                    {detailLoading === row.id ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL DRAWER (Desktop) / MODAL (Mobile)
   ============================================================ */
function DetailDrawer({ detail, onClose, onAction, FORM_INR, fmtDate, fmtDateShort, badge }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const StatusIcon = ({ status }) => {
    const icons = {
      pending: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
      product_received: ShieldCheck,
      refund_processing: RefreshCcw,
      refunded: CheckCircle2,
    };
    return icons[status] || Clock;
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm pb-0">
        <div className="w-full max-h-[90vh] bg-gray-950 border-t border-gray-800 rounded-t-2xl overflow-y-auto">
          <DetailContent detail={detail} onClose={onClose} onAction={onAction} FORM_INR={FORM_INR} fmtDate={fmtDate} fmtDateShort={fmtDateShort} badge={badge} StatusIcon={StatusIcon} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl">
        <DetailContent detail={detail} onClose={onClose} onAction={onAction} FORM_INR={FORM_INR} fmtDate={fmtDate} fmtDateShort={fmtDateShort} badge={badge} StatusIcon={StatusIcon} />
      </div>
    </div>
  );
}

function DetailContent({ detail, onClose, onAction, FORM_INR, fmtDate, fmtDateShort, badge, StatusIcon }) {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Return Request #{detail.id}</h3>
          <p className="font-mono text-xs text-gray-500">{detail.order_number}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {badge(STATUS_META[detail.status])}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition" aria-label="Close"><X size={18} /></button>
        </div>
      </div>

      {/* Customer + Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Customer</p>
          <p className="text-sm font-bold text-white">{detail.customer?.name || "Guest"}</p>
          <p className="text-xs text-gray-400 break-all">{detail.customer?.email || "-"}</p>
          {detail.customer?.phone && <p className="text-xs text-gray-400 mt-1">{detail.customer.phone}</p>}
        </div>
        <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Order</p>
          <p className="text-xs text-gray-400">Ordered: <span className="text-white">{fmtDate(detail.order?.order_date)}</span></p>
          <p className="text-xs text-gray-400">Total: <span className="text-emerald-400 font-mono font-semibold">{FORM_INR(detail.order?.total)}</span></p>
          <p className="text-xs text-gray-400">Payment: <span className="capitalize text-white">{detail.order?.payment_method || "-"}</span></p>
          <p className="text-xs text-gray-400">
            Payment status: <span className={`capitalize ${detail.order?.payment_status === "refunded" ? "text-emerald-400" : "text-amber-400"}`}>{detail.order?.payment_status || "-"}</span>
            {detail.order?.refund_status ? <span className="text-gray-500"> · refund {detail.order.refund_status}</span> : null}
          </p>
        </div>
      </div>

      {/* Request Details */}
      <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Request</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-gray-500">Requested</p><p className="font-mono text-white">{FORM_INR(detail.requested_amount)}</p></div>
          <div><p className="text-xs text-gray-500">Approved</p><p className="font-mono text-emerald-400">{detail.approved_amount != null ? FORM_INR(detail.approved_amount) : "—"}</p></div>
          <div><p className="text-xs text-gray-500">Type</p><p className="capitalize text-white">{detail.request_type || "return"}</p></div>
          <div><p className="text-xs text-gray-500">Processed by</p><p className="text-gray-400 break-all">{detail.processed_by || "—"}</p></div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-500">Reason</p>
          <p className="text-sm text-white mt-1 whitespace-pre-wrap break-words">{detail.reason || "-"}</p>
        </div>
        {detail.details && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Details</p>
            <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">{detail.details}</p>
          </div>
        )}
        {detail.rejection_reason && (
          <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
            <p className="text-xs font-semibold text-rose-400">Rejection reason</p>
            <p className="text-sm text-rose-200 mt-1 whitespace-pre-wrap break-words">{detail.rejection_reason}</p>
          </div>
        )}
        {detail.refund_reference && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-xs font-semibold text-emerald-400">Refund reference</p>
            <p className="text-sm text-emerald-200 mt-1 font-mono break-all">{detail.refund_reference}</p>
          </div>
        )}

        {/* COD Refund Details */}
        {detail.order?.payment_method && ["cod", "cash_on_delivery"].includes(String(detail.order.payment_method).toLowerCase()) && (
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold text-cyan-400 mb-3">COD Refund Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Refund Method</p>
                <p className="font-medium text-white capitalize">{detail.refund_method || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Refund Status</p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  detail.refund_status === "details_submitted" ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
                  : detail.refund_status === "details_required" ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                  : detail.refund_status === "processing" ? "text-indigo-400 bg-indigo-400/10 border-indigo-400/20"
                  : detail.refund_status === "completed" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                  : "text-gray-400 bg-gray-400/10 border-gray-400/20"
                }`}>
                  {detail.refund_status ? detail.refund_status.replace("_", " ") : "—"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-white">{detail.refund_details_submitted_at ? fmtDate(detail.refund_details_submitted_at) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-white">{detail.refund_completed_at ? fmtDate(detail.refund_completed_at) : "—"}</p>
              </div>
            </div>
            {detail.refund_method === "upi" && detail.upi_id && (
              <div className="mt-3">
                <p className="text-xs text-gray-500">UPI ID</p>
                <p className="text-sm font-mono text-white break-all">{detail.upi_id}</p>
              </div>
            )}
            {detail.refund_method === "bank" && (
              <div className="mt-3 space-y-2">
                {detail.account_holder_name && (
                  <div>
                    <p className="text-xs text-gray-500">Account Holder</p>
                    <p className="text-sm text-white">{detail.account_holder_name}</p>
                  </div>
                )}
                {detail.account_number && (
                  <div>
                    <p className="text-xs text-gray-500">Account Number</p>
                    <p className="text-sm font-mono text-white">****{String(detail.account_number).slice(-4)}</p>
                  </div>
                )}
                {detail.ifsc_code && (
                  <div>
                    <p className="text-xs text-gray-500">IFSC Code</p>
                    <p className="text-sm font-mono text-white">{detail.ifsc_code}</p>
                  </div>
                )}
                {detail.bank_name && (
                  <div>
                    <p className="text-xs text-gray-500">Bank Name</p>
                    <p className="text-sm text-white">{detail.bank_name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Products */}
      <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Products ({detail.order?.items?.length || 0})</p>
        <div className="space-y-2">
          {detail.order?.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-900/60 p-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img src={item.product_image || "/assest/placeholder.png"} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-800 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500">Qty {item.quantity} × {FORM_INR(item.final_price ?? item.price)}</p>
                </div>
              </div>
              <p className="text-sm font-mono text-emerald-400 whitespace-nowrap flex-shrink-0">{FORM_INR((item.final_price ?? item.price ?? 0) * (item.quantity || 1))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Status Timeline</p>
        {detail.timeline?.length ? (
          <ol className="relative border-l border-gray-800 ml-2 space-y-4">
            {detail.timeline.map((entry, i) => (
              <li key={i} className="relative pl-6">
                <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${entry.type === "rejected" ? "bg-rose-400" : entry.type === "refund_completed" ? "bg-emerald-400" : "bg-cyan-400"}`} />
                <p className="text-sm font-semibold text-white">{entry.label}</p>
                {entry.note && <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-wrap break-words">{entry.note}</p>}
                <p className="text-xs text-gray-600 mt-0.5">{fmtDate(entry.at)} · {entry.actor}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-gray-500">No timeline events yet.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-gray-800">
        {detail.status === "pending" && (
          <>
            <button
              onClick={() => onAction("reject")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition"
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={() => onAction("approve")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
            >
              <CheckCircle2 size={14} /> Approve Return
            </button>
          </>
        )}
        {(detail.status === "approved" || detail.status === "product_received") && (
          <button
            onClick={() => onAction("start_refund")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition"
          >
            <BadgeIndianRupee size={14} /> Start Refund
          </button>
        )}
        {detail.status === "refund_processing" && (
          <button
            onClick={() => onAction("complete_refund")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
          >
            <ShieldCheck size={14} /> Mark Refund Completed
          </button>
        )}
        {/* COD: Process refund when details are submitted */}
        {detail.status === "approved" && detail.refund_method && detail.refund_status === "details_submitted" && (
          <button
            onClick={() => onAction("process_cod_refund")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
          >
            <BadgeIndianRupee size={14} /> Process COD Refund
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRM ACTION MODAL
   ============================================================ */
function ConfirmModal({ confirm, modalInput, setModalInput, onCancel, onConfirm, actionLoading, FORM_INR }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${
            confirm.type === "reject" ? "bg-rose-500/10 text-rose-400"
              : confirm.type === "approve" ? "bg-cyan-500/10 text-cyan-400"
              : confirm.type === "complete_refund" ? "bg-emerald-500/10 text-emerald-400"
              : confirm.type === "process_cod_refund" ? "bg-emerald-500/10 text-emerald-400"
              : "bg-indigo-500/10 text-indigo-400"
          }`}>
            {confirm.type === "reject" ? <XCircle size={20} /> : confirm.type === "approve" ? <CheckCircle2 size={20} /> : confirm.type === "complete_refund" ? <ShieldCheck size={20} /> : confirm.type === "process_cod_refund" ? <BadgeIndianRupee size={20} /> : <RefreshCcw size={20} />}
          </div>
          <h3 className="text-lg font-bold text-white capitalize">
            {confirm.type === "approve" ? "Approve Return" : confirm.type === "reject" ? "Reject Return" : confirm.type === "start_refund" ? "Start Refund" : confirm.type === "process_cod_refund" ? "Process COD Refund" : "Mark Refund Completed"}
          </h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {confirm.type === "approve" && <>Approve the return request for <strong className="text-white">{confirm.row.order_number}</strong>. A refund of <strong className="text-emerald-400">{FORM_INR(confirm.row.requested_amount)}</strong> will be authorised.</>}
          {confirm.type === "reject" && <>Rejecting this request notifies the customer. The reason you enter below is shared with them.</>}
          {confirm.type === "start_refund" && <>This will attempt an automatic refund through the payment gateway when available; otherwise the refund is marked as processing for manual completion.</>}
          {confirm.type === "complete_refund" && <>Only use this when the money is actually back with the customer.</>}
          {confirm.type === "process_cod_refund" && <>This will mark the COD refund as completed for order <strong className="text-white">{confirm.row.order_number}</strong>. The refund of <strong className="text-emerald-400">{FORM_INR(confirm.row.requested_amount)}</strong> via <strong className="text-cyan-400">{confirm.row.refund_method?.toUpperCase()}</strong> will be recorded as completed.</>}
        </p>

        {(confirm.type === "reject" || confirm.type === "start_refund" || confirm.type === "complete_refund") && (
          <textarea
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            placeholder={confirm.type === "reject" ? "Rejection reason (required)..." : confirm.type === "complete_refund" ? "Refund reference / transaction id (optional)..." : "Optional notes..."}
            rows={3}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm outline-none text-white placeholder-gray-600 focus:border-cyan-400 mb-4"
          />
        )}

        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 border border-gray-700 hover:bg-gray-800/60 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading === confirm.type}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              confirm.type === "reject"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
                : confirm.type === "approve"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25"
                  : confirm.type === "complete_refund"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                    : confirm.type === "process_cod_refund"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25"
            }`}
          >
            {actionLoading === confirm.type && <Loader2 size={16} className="animate-spin" />}
            {confirm.type === "approve" ? "Confirm Approval" : confirm.type === "reject" ? "Reject Request" : confirm.type === "start_refund" ? "Start Refund" : confirm.type === "process_cod_refund" ? "Process COD Refund" : "Confirm Completion"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}