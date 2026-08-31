import React, { useCallback, useEffect, useState } from "react";
import {
  Copy, Download, Edit2, Eye, Plus, RefreshCw, Search, Ticket, Trash2, ToggleLeft, ToggleRight, X,
} from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import { couponService } from "../../services/api.js";
import AdminPagination from "./AdminPagination.jsx";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  USED: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  EXPIRED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DISABLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const emptyCouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_cart_value: "",
  maximum_discount: "",
  starts_at: "",
  expires_at: "",
  usage_limit: "",
  per_user_limit: 1,
  stack_with_offer: true,
  is_active: true,
  offer_id: "",
};

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never");
const fmtDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "—");
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function AdminCoupons({ discounts = [], showToast }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Create / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyCouponForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // View / Usage Modal state
  const [viewCoupon, setViewCoupon] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const notify = useCallback(
    (message, type) => {
      if (typeof showToast === "function") showToast(message, type);
      else console.log(`[${type || "info"}] ${message}`);
    },
    [showToast],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadCoupons = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await couponService.adminList({ page, limit: 25, search, status: statusFilter });
        setCoupons(res?.data?.coupons || []);
        setPages(res?.data?.pagination?.pages || 1);
        setTotal(res?.data?.pagination?.total || 0);
      } catch (err) {
        notify(err.message || "Failed to load coupons", "error");
        setCoupons([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, statusFilter, notify],
  );

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(emptyCouponForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type || "percentage",
      discount_value: coupon.discount_value !== undefined ? String(coupon.discount_value) : "",
      minimum_cart_value: coupon.minimum_cart_value ? String(coupon.minimum_cart_value) : "",
      maximum_discount: coupon.maximum_discount ? String(coupon.maximum_discount) : "",
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : "",
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
      usage_limit: coupon.usage_limit !== null && coupon.usage_limit !== undefined ? String(coupon.usage_limit) : "",
      per_user_limit: coupon.per_user_limit || 1,
      stack_with_offer: coupon.stack_with_offer !== undefined ? Boolean(coupon.stack_with_offer) : true,
      is_active: coupon.is_active !== undefined ? Boolean(coupon.is_active) : true,
      offer_id: coupon.offer_id ? String(coupon.offer_id) : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openView = async (id) => {
    setViewLoading(true);
    setViewCoupon(null);
    try {
      const res = await couponService.adminGet(id);
      setViewCoupon(res?.data?.coupon || null);
    } catch (err) {
      notify(err.message || "Failed to load coupon", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const handleStatusToggle = async (coupon) => {
    const next = (coupon.is_active || coupon.status === "ACTIVE") ? "DISABLED" : "ACTIVE";
    setBusyId(coupon.id);
    try {
      await couponService.adminStatus(coupon.id, next);
      notify(`Coupon ${next === "ACTIVE" ? "activated" : "deactivated"} successfully`, "success");
      loadCoupons({ silent: true });
    } catch (err) {
      notify(err.message || "Failed to update coupon status", "error");
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (coupon) => {
    setConfirmState({
      title: "Delete Coupon",
      message: `Delete coupon "${coupon.code}"? This action cannot be undone.`,
      details: (
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4"><span className="text-gray-500">Code</span><span className="text-gray-200 font-mono font-bold">{coupon.code}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Discount</span><span className="text-gray-200">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Used</span><span className="text-gray-200">{coupon.used_count || 0} times</span></div>
        </div>
      ),
      onConfirm: async () => {
        setBusyId(coupon.id);
        try {
          await couponService.adminDelete(coupon.id);
          notify("Coupon deleted successfully", "success");
          setConfirmState(null);
          loadCoupons({ silent: true });
        } catch (err) {
          notify(err.message || "Failed to delete coupon", "error");
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify(`Copied ${code}`, "success");
    } catch {
      notify("Could not copy code", "error");
    }
  };

  const exportCsv = () => {
    const headers = ["Code", "Description", "Discount Type", "Discount Value", "Min Cart", "Max Discount", "Usage", "Usage Limit", "Per User Limit", "Stack With Offer", "Start Date", "Expiry Date", "Status"];
    const rows = coupons.map((c) => [
      c.code,
      c.description || "",
      c.discount_type || "percentage",
      c.discount_value || 0,
      c.minimum_cart_value || 0,
      c.maximum_discount || "",
      c.used_count || 0,
      c.usage_limit || "Unlimited",
      c.per_user_limit || 1,
      c.stack_with_offer ? "YES" : "NO",
      c.starts_at || "",
      c.expires_at || "Never",
      c.is_active ? "Active" : "Disabled",
    ]);
    const csv = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coupons-page-${page}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCoupon = async (e) => {
    e?.preventDefault();
    setFormError("");

    const codeTrim = String(form.code || "").trim().toUpperCase();
    if (!codeTrim) {
      setFormError("Coupon code is required");
      return;
    }

    const discountVal = parseFloat(form.discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
      setFormError("Please enter a valid discount value greater than 0");
      return;
    }

    if (form.discount_type === "percentage" && discountVal > 100) {
      setFormError("Percentage discount cannot exceed 100%");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: codeTrim,
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: discountVal,
        minimum_cart_value: form.minimum_cart_value ? parseFloat(form.minimum_cart_value) : 0,
        maximum_discount: form.maximum_discount ? parseFloat(form.maximum_discount) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString().replace("T", " ").slice(0, 19) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString().replace("T", " ").slice(0, 19) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
        per_user_limit: Math.max(1, parseInt(form.per_user_limit, 10) || 1),
        stack_with_offer: Boolean(form.stack_with_offer),
        is_active: Boolean(form.is_active),
        offer_id: form.offer_id ? parseInt(form.offer_id, 10) : null,
      };

      if (editingCoupon) {
        await couponService.adminUpdate(editingCoupon.id, payload);
        notify("Coupon updated successfully", "success");
      } else {
        await couponService.adminCreate(payload);
        notify("Coupon created successfully", "success");
      }
      setShowModal(false);
      loadCoupons({ silent: true });
    } catch (err) {
      setFormError(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-cyan-400 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
          <option value="EXPIRED">Expired</option>
          <option value="USED">Used</option>
        </select>
        <button
          onClick={() => loadCoupons({ silent: true })}
          disabled={refreshing}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-cyan-400 hover:border-cyan-400/40 transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={exportCsv}
          disabled={!coupons.length}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-emerald-400 hover:border-emerald-400/40 transition disabled:opacity-50"
          title="Export CSV (current page)"
        >
          <Download size={16} />
        </button>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-cyan-500 text-black font-bold text-sm rounded-lg hover:bg-cyan-400 transition flex items-center gap-2"
        >
          <Plus size={15} /> Create Coupon
        </button>
      </div>

      {/* Coupon List Table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
              <th className="p-4 font-semibold">Code</th>
              <th className="p-4 font-semibold">Discount</th>
              <th className="p-4 font-semibold text-right">Min Cart</th>
              <th className="p-4 font-semibold text-center">Usage</th>
              <th className="p-4 font-semibold text-center">Expiry</th>
              <th className="p-4 font-semibold text-center">Stacking</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading coupons…</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">No coupons found.</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(c.code)}
                        className="font-mono text-sm font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5"
                        title="Click to copy"
                      >
                        {c.code} <Copy size={12} className="text-gray-500" />
                      </button>
                    </div>
                    {c.description && <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{c.description}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.discount_type === "percentage" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                      {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `${formatCurrency(c.discount_value)} OFF`}
                    </span>
                    {c.maximum_discount ? <div className="text-[10px] text-gray-500 mt-0.5">Max {formatCurrency(c.maximum_discount)}</div> : null}
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-gray-300">
                    {c.minimum_cart_value > 0 ? formatCurrency(c.minimum_cart_value) : <span className="text-gray-500">None</span>}
                  </td>
                  <td className="p-4 text-center text-xs font-mono text-gray-300">
                    {c.used_count ?? 0} / {c.usage_limit ? c.usage_limit : "∞"}
                  </td>
                  <td className="p-4 text-center text-xs text-gray-400">
                    {fmtDate(c.expires_at)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.stack_with_offer ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
                      {c.stack_with_offer ? "Allowed" : "No Stacking"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[c.status] || (c.is_active ? STATUS_STYLES.ACTIVE : STATUS_STYLES.DISABLED)}`}>
                      {c.is_active ? "Active" : (c.status || "Disabled")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openView(c.id)}
                        disabled={busyId === c.id}
                        className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition"
                        title="View Usage / Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        disabled={busyId === c.id}
                        className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-md transition"
                        title="Edit Coupon"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(c)}
                        disabled={busyId === c.id}
                        className={`p-1.5 rounded-md transition ${c.is_active ? "text-emerald-400 hover:bg-emerald-400/10" : "text-gray-500 hover:text-cyan-400"}`}
                        title={c.is_active ? "Deactivate" : "Activate"}
                      >
                        {c.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => requestDelete(c)}
                        disabled={busyId === c.id}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition"
                        title="Delete Coupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <AdminPagination page={page} totalPages={pages} onPageChange={setPage} />
      </div>

      {/* ── CREATE / EDIT COUPON MODAL ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure discount parameters, cart thresholds, validity dates, and offer stacking.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") }))}
                    placeholder="e.g. SAVE20"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white font-mono uppercase focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Discount Value * {form.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={form.discount_type === "percentage" ? "100" : "999999"}
                    value={form.discount_value}
                    onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                    placeholder={form.discount_type === "percentage" ? "20" : "200"}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Minimum Cart Value */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Minimum Cart Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minimum_cart_value}
                    onChange={(e) => setForm((p) => ({ ...p, minimum_cart_value: e.target.value }))}
                    placeholder="e.g. 1000 (0 for none)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Maximum Discount (Cap for Percentage) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Maximum Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.maximum_discount}
                    onChange={(e) => setForm((p) => ({ ...p, maximum_discount: e.target.value }))}
                    placeholder="e.g. 500 (optional)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Total Usage Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.usage_limit}
                    onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                    placeholder="Unlimited if blank"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Per User Limit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.per_user_limit}
                    onChange={(e) => setForm((p) => ({ ...p, per_user_limit: e.target.value }))}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Description / Offer Title
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. 20% off on your smart home purchase"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-400 outline-none"
                />
              </div>

              {/* Rules & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                <label className="flex items-center gap-3 p-3 bg-gray-800/60 border border-gray-700 rounded-xl cursor-pointer hover:border-gray-600 transition">
                  <input
                    type="checkbox"
                    checked={form.stack_with_offer}
                    onChange={(e) => setForm((p) => ({ ...p, stack_with_offer: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Stack with Product Offers</p>
                    <p className="text-xs text-gray-400">Allow combining with existing product discounts</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-800/60 border border-gray-700 rounded-xl cursor-pointer hover:border-gray-600 transition">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">Status: Active</p>
                    <p className="text-xs text-gray-400">Enable this coupon for redemption</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><RefreshCw size={15} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Ticket size={15} /> {editingCoupon ? "Update Coupon" : "Create Coupon"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW DETAILS / USAGE MODAL ────────────────────────────────────── */}
      {(viewLoading || viewCoupon) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewCoupon(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {viewLoading || !viewCoupon ? (
              <p className="text-center text-gray-400 py-6">Loading coupon details…</p>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-xl font-black text-cyan-300">{viewCoupon.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{viewCoupon.description || "No description"}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[viewCoupon.status] || (viewCoupon.is_active ? STATUS_STYLES.ACTIVE : STATUS_STYLES.DISABLED)}`}>
                    {viewCoupon.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm bg-gray-800/40 p-4 rounded-xl border border-gray-800">
                  <div><dt className="text-gray-500 text-xs">Discount</dt><dd className="text-gray-200 font-semibold">{viewCoupon.discount_type === "percentage" ? `${viewCoupon.discount_value}%` : formatCurrency(viewCoupon.discount_value)}{viewCoupon.maximum_discount ? <span className="text-gray-500 text-xs"> (max {formatCurrency(viewCoupon.maximum_discount)})</span> : null}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Minimum Cart</dt><dd className="text-gray-200 font-semibold">{viewCoupon.minimum_cart_value ? formatCurrency(viewCoupon.minimum_cart_value) : "None"}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Total Usage</dt><dd className="text-gray-200 font-mono">{viewCoupon.used_count ?? 0} / {viewCoupon.usage_limit ? viewCoupon.usage_limit : "∞"}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Per User Limit</dt><dd className="text-gray-200 font-mono">{viewCoupon.per_user_limit ?? 1} per customer</dd></div>
                  <div><dt className="text-gray-500 text-xs">Stack With Offer</dt><dd className="text-gray-200">{viewCoupon.stack_with_offer ? "Yes" : "No"}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Assigned User</dt><dd className="text-gray-200">{viewCoupon.assigned_user || (viewCoupon.user_id ? `#${viewCoupon.user_id}` : "Shared")}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Start Date</dt><dd className="text-gray-200 text-xs">{fmtDateTime(viewCoupon.starts_at)}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Expiry Date</dt><dd className="text-gray-200 text-xs">{fmtDateTime(viewCoupon.expires_at)}</dd></div>
                </dl>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => { const c = viewCoupon; setViewCoupon(null); openEditModal(c); }}
                    className="flex-1 px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => setViewCoupon(null)}
                    className="flex-1 px-4 py-2 bg-cyan-500 text-black hover:bg-cyan-400 rounded-lg text-sm font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        show={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        details={confirmState?.details}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmState?.onConfirm}
      />
    </div>
  );
}
