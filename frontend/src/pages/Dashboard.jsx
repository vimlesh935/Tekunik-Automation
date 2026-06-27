import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Package,
  MapPin,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader,
  Settings,
  Mail,
  Phone,
  Home,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  Eye,
  UserCircle,
  Calendar,
  CreditCard,
  X,
  Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import apiCall, { productService, orderService, userService, reviewService } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";
import { useCart } from "../context/CartContext.jsx";

// Animation Configurations
const fadeInContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const fadeInUpItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
};

export default function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [notification, setNotification] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [notifType, setNotifType] = useState("success");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewProducts, setReviewProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

useEffect(() => {
     loadDashboardData();
     loadRecommendedProducts();

     const onVisible = () => {
       if (document.visibilityState === "visible") loadDashboardData();
     };
     document.addEventListener("visibilitychange", onVisible);

     const interval = setInterval(() => loadDashboardData(), 30000);

     return () => {
       document.removeEventListener("visibilitychange", onVisible);
       clearInterval(interval);
     };
   }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, ordersRes] = await Promise.all([
        apiCall("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiCall("/api/user/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const userData = profileRes.data?.user || profileRes.data;
      setProfile(userData);

      const orderData = ordersRes.data?.orders || ordersRes.data || [];
      const parsedOrders = (Array.isArray(orderData) ? orderData : []).map(
        (o) => {
          let items = [];
          if (typeof o.items === "string") {
            try {
              items = JSON.parse(o.items || "[]");
            } catch (parseErr) {
              console.warn("Failed to parse order items:", o.items, parseErr);
              items = [];
            }
          } else if (Array.isArray(o.items)) {
            items = o.items;
          }
          return {
            ...o,
            items: items,
          };
        },
      );
      setOrders(parsedOrders);

      setForm({
        first_name: userData?.first_name || "",
        last_name: userData?.last_name || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
        city: userData?.city || "",
      });
    } catch (err) {
      console.warn("Dashboard load error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      const response = await productService.getAllProducts(1, 4);
      const products = response.data?.products || [];
      setRecommendedProducts(products.slice(0, 4));
    } catch (err) {
      console.warn("Failed to load recommended products:", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiCall("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const updatedUser = res.data?.user || res.data;
      setProfile(updatedUser);
      setEditMode(false);
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotifType(type);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    showNotification(`${product.name} added to cart!`, "success");
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    const confirmCancel = window.confirm(
      `Cancel order ${orderNumber}? This cannot be undone.`,
    );
    if (!confirmCancel) return;
    setCancellingOrderId(orderId);
    try {
      const response = await orderService.cancelOrder(orderId);
      const updatedOrder = response?.data?.order;
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? updatedOrder : order,
          ),
        );
      } else {
        await loadDashboardData();
      }
      showNotification("Order cancelled successfully", "success");
    } catch (error) {
      showNotification(error?.message || "Failed to cancel order", "error");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const openReviewModal = async (order) => {
    setReviewOrder(order);
    setRating(0);
    setHoverRating(0);
    setReviewTitle("");
    setReviewMessage("");
    setSelectedProduct(null);
    setReviewProducts([]);
    setShowReviewModal(true);

    try {
      const res = await userService.getOrder(order.id);
      const items = res.data?.order?.items || order.items || [];
      setReviewProducts(items);
      if (items.length > 0) setSelectedProduct(items[0].product_id);
    } catch (error) {
      const items = order.items || [];
      setReviewProducts(items);
      if (items.length > 0) setSelectedProduct(items[0].product_id);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct || !rating || !reviewOrder) return;
    setSubmittingReview(true);
    setReviewSuccess(false);

    try {
      await reviewService.createReview({
        order_id: reviewOrder.id,
        product_id: selectedProduct,
        rating,
        review_title: reviewTitle.trim() || null,
        review_message: reviewMessage.trim() || null,
      });
      setReviewSuccess(true);
      showNotification("Review submitted successfully and is pending approval.", "success");
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 1200);
    } catch (error) {
      showNotification(error?.message || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={14} className="text-amber-400" />;
      case "confirmed":
        return <CheckCircle size={14} className="text-cyan-400" />;
      case "processing":
        return <Loader size={14} className="text-blue-400 animate-spin" />;
      case "packed":
        return <Package size={14} className="text-purple-400" />;
      case "shipped":
        return <Truck size={14} className="text-indigo-400" />;
      case "out_for_delivery":
        return <Truck size={14} className="text-orange-400" />;
      case "delivered":
        return <CheckCircle size={14} className="text-emerald-400" />;
      case "cancelled":
        return <XCircle size={14} className="text-rose-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "confirmed":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "packed":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "shipped":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "out_for_delivery":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cancelled":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const isCancellable = (status) => {
    const cancellable = ["pending", "confirmed", "processing"];
    return cancellable.includes(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070f1e] flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Layer */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 bg-slate-900/95 shadow-2xl backdrop-blur-xl border rounded-xl px-5 py-3.5 text-sm max-w-sm ${
              notifType === "success"
                ? "border-emerald-500/30"
                : "border-rose-500/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notifType === "success"
                    ? "bg-emerald-500/10"
                    : "bg-rose-500/10"
                }`}
              >
                {notifType === "success" ? (
                  <CheckCircle size={15} className="text-emerald-400" />
                ) : (
                  <XCircle size={15} className="text-rose-400" />
                )}
              </div>
              <span className="text-slate-200 font-medium">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Professional Header Row */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shadow-inner">
                <UserCircle size={32} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
                </h1>
                {/* <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{profile?.email || "Customer Account Panel"}</p> */}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition-colors"
                >
                  <ShoppingBag size={16} /> Continue Shopping
                </Link>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-slate-700/50 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Error dynamic block */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3.5 text-sm text-rose-400 font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Primary Workspace Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Navigation Controls Wrapper */}
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-3 lg:pb-0 border-b border-slate-800 lg:border-none whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <User size={16} /> Profile Information
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Package size={16} /> Order Portfolio
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "addresses"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <MapPin size={16} /> Delivery Address
            </button>

            </nav>

          {/* Interactive Screen Dynamic Layer */}
          <div className="space-y-8 min-w-0">
            <AnimatePresence mode="wait">
              {/* PROFILE CONTROL VIEW */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Profile Information
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Manage your personal details and contact information.
                      </p>
                    </div>
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all"
                      >
                        <Settings size={14} /> Modify Data
                      </button>
                    )}
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={form.first_name}
                            onChange={(e) =>
                              setForm({ ...form, first_name: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={form.last_name}
                            onChange={(e) =>
                              setForm({ ...form, last_name: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Address
                        </label>
                        <textarea
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                              setForm({ ...form, city: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-slate-800 mt-6">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md disabled:opacity-50 transition-colors"
                        >
                          {saving ? "Saving Changes..." : "Update Profile"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="px-5 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <User size={12} className="text-amber-400" /> Full
                          Name
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.first_name} {profile?.last_name || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Mail size={12} className="text-amber-400" /> Email
                          Address
                        </div>
                        <p className="text-white text-sm font-semibold break-all">
                          {profile?.email}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Phone size={12} className="text-amber-400" /> Phone
                          Number
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.phone || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Home size={12} className="text-amber-400" /> City
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.city || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4 sm:col-span-2">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <MapPin size={12} className="text-amber-400" />{" "}
                          Address
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {profile?.address || "No address saved"}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ORDER PORTFOLIO VIEW - Professional Ecommerce Design */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Order Portfolio
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Track and manage your orders.
                      </p>
                    </div>
                    <Link
                      to="/orders"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Complete History <ChevronRight size={14} />
                    </Link>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-3.5">
                      {recentOrders.map((order) => {
                        const totalProducts = order.total_products || order.items?.length || 0;
                        const totalQuantity = order.total_quantity || (order.items || []).reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                        const formattedDate = order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A";
                        return (
                          <motion.div
                            key={order.id}
                            whileHover={{
                              y: -2,
                              backgroundColor: "rgba(30, 41, 59, 0.4)",
                            }}
                            className="rounded-lg bg-slate-950 border border-slate-800 p-4 hover:border-blue-500/30 transition-all cursor-pointer"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            {/* Top Row: Order Number + Status */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 text-slate-300">
                                {order.order_number}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(order.status)}`}
                              >
                                {getStatusIcon(order.status)}
                                <span className="uppercase tracking-wider">
                                  {order.status === "out_for_delivery" ? "Out For Delivery" : order.status}
                                </span>
                              </span>
                            </div>

                            {/* Middle: Stats Row - Products, Items, Date */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium mb-2">
                              <span className="text-slate-300 font-semibold">
                                {totalProducts} Product{totalProducts !== 1 ? "s" : ""}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-slate-300 font-semibold">
                                {totalQuantity} Item{totalQuantity !== 1 ? "s" : ""}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {formattedDate}
                              </span>
                            </div>

                            {/* Bottom Row: Amount + Action Buttons */}
                            <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-1">
                              <p className="text-base font-black text-amber-400">
                                ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2">
                                {order.status === "delivered" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openReviewModal(order);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                                  >
                                    <Star size={12} /> Write Review
                                  </button>
                                )}
                                {isCancellable(order.status) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleCancelOrder(order.id, order.order_number);
                                    }}
                                    disabled={cancellingOrderId === order.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                  >
                                    {cancellingOrderId === order.id ? (
                                      "Cancelling..."
                                    ) : (
                                      <>
                                        <X size={12} /> Cancel
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                        <ShoppingBag size={20} className="text-slate-500" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-300 mb-1">
                        No orders placed yet
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        You haven't placed any orders yet. Start shopping to see
                        your order history here.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center justify-center text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white shadow-md transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}

                  {orders.length > 0 && (
                    <div className="mt-5 rounded-lg bg-slate-950 border border-slate-800 p-3.5 flex items-center gap-3">
                      <Truck
                        size={16}
                        className="text-amber-400 flex-shrink-0"
                      />
                      <p className="text-xs text-slate-400 font-medium">
                        Track your order status in real time.{" "}
                        <Link
                          to="/track-order"
                          className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                        >
                          Track Order <ChevronRight size={12} />
                        </Link>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ADDRESS CONTROL VIEW */}
              {activeTab === "addresses" && (
                <motion.div
                  key="addresses-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="border-b border-slate-800 pb-5 mb-6">
                    <h2 className="text-lg font-bold text-white">
                      Delivery Address
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Your saved delivery address for orders.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-white">
                          Default Address
                        </p>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          {profile?.address ? (
                            <>
                              {profile.address}
                              {profile.city && `, ${profile.city}`}
                            </>
                          ) : (
                            <span className="text-slate-500 italic">
                              No address saved. Update your profile to add a
                              delivery address.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HIGH END RECOMMENDED DECK GRID (Always Visible for E-com retention) */}
            {/* {recommendedProducts.length > 0 && (
              <motion.div
                variants={fadeInContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/5 border border-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <Sparkles size={10} /> Algorithmic Alignment
                    </div>
                    <h2 className="text-base font-bold text-white">Suggested Curations</h2>
                  </div>
                  <Link to="/shop" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-0.5">
                    All Catalogs <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={fadeInUpItem}
                      className="group relative rounded-lg bg-slate-950 border border-slate-800 p-3.5 flex flex-col justify-between hover:border-slate-700/80 transition-all"
                    >
                      <Link to={`/product/${product.id}`} className="block space-y-3">
                        <div className="relative h-32 w-full overflow-hidden rounded bg-slate-900 border border-slate-800/40">
                          {product.image_url ? (
                            <SafeImage
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              fallback={<div className="flex h-full items-center justify-center text-slate-700"><Package size={24} className="opacity-40" /></div>}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-700">
                              <Package size={24} className="opacity-40" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h3>
                          <p className="text-sm font-black text-amber-400 mt-1">₹{parseFloat(product.price || 0).toFixed(2)}</p>
                        </div>
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock_quantity <= 0}
                        className="mt-3.5 w-full rounded-md bg-blue-600 hover:bg-blue-700 py-2 text-[11px] font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ShoppingCart size={12} /> Procure Unit
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )} */}
          </div>
        </div>
      </div>

      {/* Floating Tactical Checkout Gateway Anchor */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link
          to="/checkout"
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 border border-blue-500/30 transition-colors group"
        >
          <ShoppingCart
            size={20}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </motion.div>

      <AnimatePresence>
        {showReviewModal && reviewOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-[20px] border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">
                    Rate Your Experience
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {reviewOrder.order_number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {reviewProducts.length > 1 && (
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select Product
                  </label>
                  <select
                    value={selectedProduct || ""}
                    onChange={(e) => setSelectedProduct(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {reviewProducts.map((item) => (
                      <option key={item.product_id} value={item.product_id}>
                        {item.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reviewProducts.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                  No reviewable products were found for this order.
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-400">
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
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Great product!"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Review Message
                    </label>
                    <textarea
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-[12px] border border-slate-700 bg-slate-800 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={!rating || !selectedProduct || submittingReview || reviewProducts.length === 0 || reviewSuccess}
                  className="motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] bg-blue-600 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewSuccess ? (
                    <>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-current">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      <span>Review Submitted Successfully</span>
                    </>
                  ) : submittingReview ? (
                    <>
                      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-[2px] border-current border-t-transparent" />
                      <span className="tabular-nums tracking-wide">Submitting Review...</span>
                    </>
                  ) : (
                    <>
                      <Star size={15} className="fill-white/90" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
