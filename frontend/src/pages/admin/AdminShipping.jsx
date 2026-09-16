import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  MapPin,
  Hash,
  Calendar,
  CreditCard,
  AlertTriangle,
  MoreVertical,
  Download,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall, { getApiUrl } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import ShippingDetailModal from "../../admin/components/ShippingDetailModal.jsx";
import ShippingSettingsModal from "../../admin/components/ShippingSettingsModal.jsx";
import ShippingZonesModal from "../../admin/components/ShippingZonesModal.jsx";
import ShippingMethodsModal from "../../admin/components/ShippingMethodsModal.jsx";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", action: "Start Processing" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", action: "Mark Processing" },
  processing: { label: "Processing", icon: Loader2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", action: "Mark Packed" },
  packed: { label: "Packed", icon: Package, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", action: "Mark Shipped" },
  shipped: { label: "Shipped", icon: Truck, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", action: "Mark In Transit" },
  in_transit: { label: "In Transit", icon: Truck, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", action: "Mark Out for Delivery" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "text-orange-400 bg-orange-500/10 border-orange-500/20", action: "Mark Delivered" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", action: null },
  delivery_failed: { label: "Delivery Failed", icon: AlertTriangle, color: "text-red-400 bg-red-500/10 border-red-500/20", action: "Retry Shipment" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-slate-400 bg-slate-500/10 border-slate-500/20", action: null },
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export default function AdminShipping() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiCall("/api/admin/shipping/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data?.summary || {});
    } catch (err) {
      console.error("Failed to fetch shipping summary:", err);
    }
  }, [token]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 20);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      
      const res = await apiCall(`/api/admin/shipping?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = res.data;
      setShipments(payload?.shipments || []);
      setTotalPages(payload?.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load shipments", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, token, showToast]);

  useEffect(() => {
    fetchSummary();
    fetchShipments();
  }, [fetchSummary, fetchShipments]);

  const handleStatusUpdate = async (shipment, newStatus) => {
    if (!newStatus) return;
    
    const requiresTracking = newStatus === "shipped";
    let extraData = {};

    if (requiresTracking) {
      const provider = window.prompt("Enter shipping provider/courier name:");
      if (!provider) return;
      
      const tracking = window.prompt("Enter tracking number:");
      if (!tracking) return;
      
      const estimatedDelivery = window.prompt("Enter estimated delivery date (YYYY-MM-DD):");
      if (!estimatedDelivery) return;
      
      extraData = { shipping_provider: provider, tracking_number: tracking, estimated_delivery: estimatedDelivery };
    } else if (newStatus === "cancelled") {
      const reason = window.prompt("Enter cancellation reason:");
      if (!reason) return;
      extraData = { cancelled_by: "ADMIN", cancel_reason: reason };
    } else if (newStatus === "delivery_failed") {
      const retry = window.confirm("Mark as delivery failed? This will allow retry later.");
      if (!retry) return;
    }

    setUpdatingId(shipment.id);
    try {
      await apiCall(`/api/admin/shipping/${shipment.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });
      showToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchShipments();
      fetchSummary();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  const getAvailableActions = (shipment) => {
    const actions = [];
    const nextStatus = getNextStatus(shipment.status);
    
    if (nextStatus) {
      actions.push({ status: nextStatus, label: STATUS_CONFIG[nextStatus]?.action || nextStatus });
    }

    // Add delivery_failed as alternative for shipped/in_transit/out_for_delivery
    if (["shipped", "in_transit", "out_for_delivery"].includes(shipment.status)) {
      actions.push({ status: "delivery_failed", label: "Mark Delivery Failed" });
    }

    // Add cancel for non-final statuses
    if (!["delivered", "cancelled"].includes(shipment.status)) {
      actions.push({ status: "cancelled", label: "Cancel Order" });
    }

    return actions;
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const SummaryCard = ({ title, count, icon: Icon, color }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-black text-white mt-1">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Shipping Management</h2>
          <p className="text-xs text-slate-400">Manage shipments, track orders, and configure shipping settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors"
          >
            <Settings size={16} /> Settings
          </button>
          <button
            onClick={() => setShowZones(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors"
          >
            <MapPin size={16} /> Zones
          </button>
          <button
            onClick={() => setShowMethods(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors"
          >
            <Truck size={16} /> Methods
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
        <SummaryCard title="Total Shipments" count={summary.total || 0} icon={Package} color="bg-indigo-500/10" />
        <SummaryCard title="Pending" count={(summary.pending || 0)} icon={Clock} color="bg-amber-500/10" />
        <SummaryCard title="Processing" count={0} icon={Loader2} color="bg-indigo-500/10" />
        <SummaryCard title="Packed" count={summary.packed || 0} icon={Package} color="bg-cyan-500/10" />
        <SummaryCard title="Shipped" count={summary.shipped || 0} icon={Truck} color="bg-amber-500/10" />
        <SummaryCard title="In Transit" count={summary.inTransit || 0} icon={Truck} color="bg-blue-500/10" />
        <SummaryCard title="Out for Delivery" count={summary.outForDelivery || 0} icon={Truck} color="bg-orange-500/10" />
        <SummaryCard title="Delivered" count={summary.delivered || 0} icon={CheckCircle} color="bg-emerald-500/10" />
        <SummaryCard title="Failed" count={summary.deliveryFailed || 0} icon={AlertTriangle} color="bg-red-500/10" />
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search order #, tracking #, customer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full sm:w-48 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <button
          onClick={() => { fetchShipments(); fetchSummary(); }}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Shipments Table */}
      {loading ? (
        <AdminLoading />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Order</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Items</th>
                  <th className="p-4 font-semibold hidden lg:table-cell">Method</th>
                  <th className="p-4 font-semibold hidden lg:table-cell">Provider</th>
                  <th className="p-4 font-semibold">Tracking</th>
                  <th className="p-4 font-semibold hidden md:table-cell">ETA</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {shipments.map((shipment) => {
                  const config = STATUS_CONFIG[shipment.status] || STATUS_CONFIG.pending;
                  const Icon = config.icon;
                  const actions = getAvailableActions(shipment);
                  const isUpdating = updatingId === shipment.id;

                  return (
                    <tr key={shipment.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-white">{shipment.customer_name || "Guest"}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{shipment.customer_email || shipment.guest_email || "-"}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-sm font-bold text-white">{shipment.order_number || `#${shipment.id}`}</p>
                        <p className="text-xs text-slate-400">{formatDate(shipment.created_at)}</p>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-slate-300">{shipment.item_count || 0} items</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-300 capitalize">{shipment.shipping_method || "standard"}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">{shipment.shipping_provider || "-"}</span>
                      </td>
                      <td className="p-4">
                        {shipment.tracking_number ? (
                          <span className="font-mono text-xs text-indigo-400">{shipment.tracking_number}</span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs text-slate-400">{shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : "-"}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${config.color}`}>
                          <Icon size={10} />
                          {config.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setSelectedShipment(shipment)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {actions.length === 1 ? (
                            <button
                              onClick={() => handleStatusUpdate(shipment, actions[0].status)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                            >
                              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : actions[0].label}
                            </button>
                          ) : actions.length > 1 ? (
                            <div className="relative">
                              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors">
                                Action <ChevronDown size={12} />
                              </button>
                              <div className="absolute bottom-full right-0 mb-1 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                                {actions.map((action) => (
                                  <button
                                    key={action.status}
                                    onClick={() => handleStatusUpdate(shipment, action.status)}
                                    disabled={isUpdating}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {shipments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">No shipments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Modals */}
      <ShippingDetailModal 
        shipment={selectedShipment} 
        onClose={() => setSelectedShipment(null)} 
      />
      <ShippingSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={fetchSummary} 
      />
      <ShippingZonesModal 
        isOpen={showZones} 
        onClose={() => setShowZones(false)} 
        onSave={fetchSummary} 
      />
      <ShippingMethodsModal 
        isOpen={showMethods} 
        onClose={() => setShowMethods(false)} 
        onSave={fetchSummary} 
      />
    </div>
  );
}