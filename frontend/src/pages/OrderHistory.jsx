import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import { Package, Clock, MapPin, ChevronRight, Loader2, ShoppingBag, Calendar, Eye } from "lucide-react";

export default function OrderHistory({ token }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [token]);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await userService.getOrders(page);
      const data = response.data;
      if (data) {
        setOrders(data.orders || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      addToast(error?.message || "Failed to load orders", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s) => {
    const colors = {
      pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      confirmed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return colors[s] || colors.pending;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-page text-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-300 py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          <p className="mt-2 text-gray-400">View and track all your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-16 text-center animate-fade-in">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 mb-6">
              <ShoppingBag size={36} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">No orders yet</h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-black hover:shadow-xl hover:shadow-cyan-500/30 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block rounded-3xl border border-white/10 bg-gray-900/70 p-6 hover:bg-gray-900/90 hover:border-cyan-500/30 transition-all group animate-fade-in"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        <Package size={12} />
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace(/_/g, " ")}
                      </span>
                      {order.item_count && (
                        <span className="text-xs text-gray-500">{order.item_count} item{order.item_count > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white font-mono truncate">
                      {order.order_number}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-cyan-400" />
                        {formatDate(order.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-cyan-400" />
                        {order.guest_city || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-cyan-400">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                      <p className={`text-xs mt-1 ${order.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {order.payment_status}
                      </p>
                    </div>
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 group-hover:bg-cyan-500/10 transition">
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-cyan-400 transition" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchOrders(page)}
                className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                  page === pagination.page
                    ? "bg-cyan-500 text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}