import React, { useCallback, useEffect, useState } from "react";
import { Eye, FileDown, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall, { getApiUrl } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import OrderDetailModal from "../../components/admin/OrderDetailModal.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderFilter, setOrderFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", 20);
      if (orderFilter) params.set("status", orderFilter);
      const res = await apiCall(`/api/admin/orders?${params.toString()}`);
      const payload = res.data;
      setOrders(payload?.orders || []);
      setTotalPages(payload?.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [orderFilter, page, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (id, status) => {
    try {
      await apiCall(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      showToast("Order status updated.");
      fetchOrders();
    } catch (err) {
      showToast(err.message || "Failed to update order status", "error");
    }
  };

  const openOrderDetail = async (order) => {
    setOrderDetailLoading(order.id);
    try {
      const res = await apiCall(`/api/admin/orders/${order.id}`);
      const detail = res.data?.order;
      if (!detail) throw new Error("Order details are unavailable");
      setSelectedOrderDetail(detail);
    } catch (err) {
      showToast(`Failed to load order details: ${err.message}`, "error");
    } finally {
      setOrderDetailLoading(null);
    }
  };

  const downloadInvoice = async (orderId) => {
    setInvoiceLoading(orderId);
    try {
      const response = await fetch(getApiUrl(`/api/admin/orders/${orderId}/invoice`), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully.");
    } catch (err) {
      showToast(`Failed to download invoice: ${err.message}`, "error");
    } finally {
      setInvoiceLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-white tracking-tight">Orders</h2><p className="text-xs text-gray-500">Manage order status, order details, and invoices.</p></div>
        <select value={orderFilter} onChange={(e) => { setPage(1); setOrderFilter(e.target.value); }} className="bg-black border border-gray-700 text-sm rounded-xl px-4 py-2 outline-none text-white focus:border-cyan-400 cursor-pointer">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      {loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400"><th className="p-4 font-semibold">Order</th><th className="p-4 font-semibold">Customer</th><th className="p-4 font-semibold text-right">Amount</th><th className="p-4 font-semibold text-center">Payment</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Date</th><th className="p-4 font-semibold text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4"><p className="font-mono text-sm font-bold text-white">{order.order_number || `#${order.id}`}</p><p className="text-xs text-gray-500">{order.item_count || order.items_count || 0} items</p></td>
                  <td className="p-4"><p className="text-sm font-semibold text-white">{order.customer_name || order.guest_name || "Guest"}</p><p className="text-xs text-gray-500 break-all">{order.customer_email || order.guest_email || "-"}</p></td>
                  <td className="p-4 text-right text-sm font-mono text-emerald-400">₹{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                  <td className="p-4 text-center text-xs text-amber-400 capitalize">{order.payment_status || "pending"}</td>
                  <td className="p-4 text-center"><select value={order.status || "pending"} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="bg-black border border-gray-700 text-xs rounded px-2 py-1.5 outline-none text-white focus:border-cyan-400 cursor-pointer">{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}</select></td>
                  <td className="p-4 text-center text-xs text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "-"}</td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openOrderDetail(order)} disabled={orderDetailLoading === order.id} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="View Details">{orderDetailLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}</button><button onClick={() => downloadInvoice(order.id)} disabled={invoiceLoading === order.id} className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition" title="Download Invoice">{invoiceLoading === order.id ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}</button></div></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <OrderDetailModal order={selectedOrderDetail} onClose={() => setSelectedOrderDetail(null)} />
    </div>
  );
}
