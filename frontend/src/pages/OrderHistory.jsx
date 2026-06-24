import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService, orderService, reviewService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import OrderReviewSection from "../components/OrderReviewSection.jsx";
import {
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Calendar,
  Eye,
  X,
  AlertTriangle,
  Star,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderHistory() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState({ id: null, number: null });
  const [cancelledOrders, setCancelledOrders] = useState(new Set());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewProducts, setReviewProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState(new Map());

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (!authLoading) navigate("/login");
      return;
    }
    fetchOrders();

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => fetchOrders(), 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
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

  const isCancellable = (status) => {
    const cancellable = ["pending", "confirmed", "processing"];
    return cancellable.includes(status);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const openCancelModal = (orderId, orderNumber) => {
    setCancelTarget({ id: orderId, number: orderNumber });
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget.id) return;
    setShowCancelModal(false);
    setCancellingOrderId(cancelTarget.id);
    try {
      await orderService.cancelOrder(cancelTarget.id);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelTarget.id ? { ...order, status: "cancelled" } : order,
        ),
      );
      setCancelledOrders((prev) => new Set(prev).add(cancelTarget.id));
      addToast("Order cancelled successfully", "success");
    } catch (error) {
      addToast(error?.message || "Failed to cancel order", "error");
    } finally {
      setCancellingOrderId(null);
      setCancelTarget({ id: null, number: null });
    }
  };

  const openReviewModal = async (order) => {
    setReviewOrder(order);
    setRating(0);
    setHoverRating(0);
    setReviewTitle("");
    setReviewMessage("");
    setSelectedProduct(null);
    try {
      const res = await userService.getOrder(order.id);
      const items = res.data?.order?.items || [];
      setReviewProducts(items);
      if (items.length > 0) setSelectedProduct(items[0].product_id);
    } catch {
      setReviewProducts([]);
      setSelectedProduct(null);
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct || !rating || !reviewOrder) return;
    setSubmittingReview(true);
    try {
      await reviewService.createReview({
        order_id: reviewOrder.id,
        product_id: selectedProduct,
        rating,
        review_title: reviewTitle.trim() || null,
        review_message: reviewMessage.trim() || null,
      });
      setReviewedProducts((prev) => new Map(prev).set(`${reviewOrder.id}-${selectedProduct}`, true));
      addToast("Review submitted successfully!", "success");
      setShowReviewModal(false);
    } catch (error) {
      addToast(error?.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const allProductsReviewed = (order, reviewedMap) => {
    return false;
  };

  if (authLoading && orders.length === 0) {
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
              You haven't placed any orders yet. Start shopping to see your
              order history here.
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
              <div
                key={order.id}
                className="rounded-3xl border border-white/10 bg-gray-900/70 p-6 hover:bg-gray-900/90 hover:border-cyan-500/30 transition-all group animate-fade-in"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(order.status)}`}
                      >
                        <Package size={12} />
                        {order.status?.charAt(0).toUpperCase() +
                          order.status?.slice(1).replace(/_/g, " ")}
                      </span>
                      {order.item_count && (
                        <span className="text-xs text-gray-500">
                          {order.item_count} item
                          {order.item_count > 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {order.total_products || order.items?.length || 0} Product{(order.total_products || order.items?.length || 0) !== 1 ? "s" : ""}
                        {" "}·{" "}
                        {order.total_quantity || (order.items || []).reduce((s, i) => s + (parseInt(i.quantity) || 0), 0)} Items
                      </span>
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
                      <p className="text-lg font-bold text-cyan-400">
                        ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                      </p>
                      <p
                        className={`text-xs mt-1 ${order.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {order.payment_status || "pending"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 group-hover:bg-cyan-500/10 transition"
                        title="View details"
                      >
                        <Eye
                          size={18}
                          className="text-gray-400 group-hover:text-cyan-400 transition"
                        />
                      </Link>
                      {isCancellable(order.status) && !cancelledOrders.has(order.id) ? (
                        <button
                          type="button"
                          onClick={() =>
                            openCancelModal(order.id, order.order_number)
                          }
                          disabled={cancellingOrderId === order.id}
                          className="w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-800 disabled:to-red-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-[12px] py-2.5 px-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(220,38,38,0.25)] active:scale-[0.98]"
                        >
                          <X size={14} />
                          Cancel Order
                        </button>
                      ) : cancelledOrders.has(order.id) ? (
                        <span className="inline-flex items-center justify-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-[10px] py-2.5 px-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Order Cancelled
                        </span>
                      ) : null}
                      {order.status === "delivered" && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(order)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-[10px] py-2.5 px-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          <Star size={13} />
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center gap-3">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
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
              ),
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[20px] shadow-2xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h3 className="text-xl font-black text-white text-center tracking-tight">
              Cancel Order
            </h3>
            <p className="mt-3 text-sm text-slate-400 text-center leading-relaxed">
              Are you sure you want to cancel order{" "}
              <span className="font-mono text-slate-200 font-bold">
                #{cancelTarget.number}
              </span>
              ?<br />
              <span className="text-xs text-slate-500">
                This action cannot be undone.
              </span>
            </p>
            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 inline-flex items-center justify-center rounded-[12px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm py-3 transition-all duration-200 border border-slate-700"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingOrderId === cancelTarget.id}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-800 disabled:to-red-800 disabled:cursor-not-allowed text-white font-bold text-sm py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_6px_28px_rgba(220,38,38,0.3)] active:scale-[0.98]"
              >
                {cancellingOrderId === cancelTarget.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>Cancel Order</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showReviewModal && reviewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowReviewModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[20px] shadow-2xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white tracking-tight">
                Rate Your Experience
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {reviewProducts.length > 1 && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProduct || ""}
                  onChange={(e) => setSelectedProduct(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 outline-none"
                >
                  {reviewProducts.map((item) => (
                    <option key={item.product_id} value={item.product_id}>
                      {item.product_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Rating
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className="transition-all duration-150 hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={32}
                      className={`transition-colors duration-150 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Review Title
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Great product!"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:border-amber-500 outline-none transition"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Review Message
              </label>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:border-amber-500 outline-none transition resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 inline-flex items-center justify-center rounded-[12px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm py-3 transition-all duration-200 border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={!rating || !selectedProduct || submittingReview}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm py-3 transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_28px_rgba(245,158,11,0.3)] active:scale-[0.98]"
              >
                {submittingReview ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star size={15} className="fill-white" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
