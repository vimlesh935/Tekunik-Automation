import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePincodeLookup } from "../hooks/usePincodeLookup.js";
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
  Heart,
  Trash2,
  Bell,
  Ticket,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import apiCall, { productService, orderService, userService, reviewService, wishlistService, backInStockService, couponService } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";
import CancelSuccessMessage from "../components/CancelSuccessMessage.jsx";
import { useCart } from "../context/CartContext.jsx";
import useRecentlyViewed from "../hooks/useRecentlyViewed.js";
import RecentlyViewedSection from "../components/RecentlyViewedSection.jsx";

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
  const recentlyViewed = useRecentlyViewed();
  // Honor deep links such as /dashboard?tab=offers-coupons (notifications).
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return tabParam === "offers-coupons" ? "offers-coupons" : "profile";
  });
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [removingFromWishlist, setRemovingFromWishlist] = useState(null);
  // Back-in-stock alert state per wishlist item (product_id -> true)
  const [notifySubscribed, setNotifySubscribed] = useState({});
  const [notifyLoadingId, setNotifyLoadingId] = useState(null);
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
    pincode: "",
  });
  const [notification, setNotification] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [notifType, setNotifType] = useState("success");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelSuccessOrder, setCancelSuccessOrder] = useState(null);
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
  const [cityLocked, setCityLocked] = useState(false);
  const { loading: pincodeLoading, error: pincodeError, lookup: lookupPincode } = usePincodeLookup();

  const [myCoupons, setMyCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const copyCouponCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 1800);
    } catch (err) {
      setCopiedCode("");
    }
  };

  useEffect(() => {
    if (activeTab !== "offers-coupons") return;
    let mounted = true;
    setCouponsLoading(true);
    couponService
      .my()
      .then((res) => { if (mounted) setMyCoupons(res?.data?.coupons || []); })
      .catch(() => { if (mounted) setMyCoupons([]); })
      .finally(() => { if (mounted) setCouponsLoading(false); });
    return () => { mounted = false; };
  }, [activeTab]);

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
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        apiCall("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiCall("/api/user/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        wishlistService.getWishlist(),
      ]);

      const userData = profileRes.data?.user || profileRes.data;
      setProfile(userData);

      setWishlist(wishlistRes.wishlist || wishlistRes.data?.wishlist || []);

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
      setTotalOrders(ordersRes.data?.pagination?.total || parsedOrders.length);
      setTotalItems(ordersRes.data?.total_items || 0);

      setForm({
        first_name: userData?.first_name || "",
        last_name: userData?.last_name || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
        city: userData?.city || "",
        pincode: userData?.pincode || "",
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
      showNotification("Delivery address updated successfully.", "success");
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

  const handleRemoveWishlist = async (productId) => {
    setRemovingFromWishlist(productId);
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      showNotification("Product removed from wishlist", "success");
    } catch (error) {
      showNotification(error?.message || "Failed to remove from wishlist", "error");
    } finally {
      setRemovingFromWishlist(null);
    }
  };

  // ─── BACK IN STOCK: Notify Me for out-of-stock wishlist items ────
  const handleNotifyWishlistItem = async (productId) => {
    if (!productId || notifyLoadingId) return;
    setNotifyLoadingId(productId);
    try {
      await backInStockService.subscribe(productId);
      setNotifySubscribed((prev) => ({ ...prev, [productId]: true }));
      showNotification("We'll notify you when this product is back in stock! 🔔", "success");
    } catch (error) {
      if (error?.code === "ALREADY_IN_STOCK") {
        showNotification("Good news — this product is back in stock!", "success");
      } else {
        showNotification(error?.message || "Could not register your notification.", "error");
      }
    } finally {
      setNotifyLoadingId(null);
    }
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
        setCancelSuccessOrder(updatedOrder);
      } else {
        await loadDashboardData();
        const existingOrder = orders.find(o => o.id === orderId);
        setCancelSuccessOrder(existingOrder || { id: orderId, order_number: orderNumber });
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
        return <Clock size={14} className="text-cyan-400" />;
      case "confirmed":
        return <CheckCircle size={14} className="text-cyan-400" />;
      case "processing":
        return <Loader size={14} className="text-cyan-400 animate-spin" />;
      case "packed":
        return <Package size={14} className="text-cyan-400" />;
      case "shipped":
        return <Truck size={14} className="text-cyan-400" />;
      case "out_for_delivery":
        return <Truck size={14} className="text-cyan-400" />;
      case "delivered":
        return <CheckCircle size={14} className="text-cyan-400" />;
      case "cancelled":
        return <XCircle size={14} className="text-cyan-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "confirmed":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "processing":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "packed":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "shipped":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "out_for_delivery":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "delivered":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "cancelled":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans antialiased selection:bg-cyan-400 selection:text-white">
      {/* Toast Notification Layer */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 bg-slate-900/95 shadow-2xl backdrop-blur-xl border rounded-xl px-5 py-3.5 text-sm max-w-sm ${
              notifType === "success"
                ? "border-cyan-500/30"
                : "border-rose-500/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notifType === "success"
                    ? "bg-cyan-500/10"
                    : "bg-rose-500/10"
                }`}
              >
                {notifType === "success" ? (
                  <CheckCircle size={15} className="text-cyan-400" />
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
                <UserCircle size={32} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/15 transition-colors"
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
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <User size={16} /> Profile Information
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "orders"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Package size={16} /> Order Portfolio
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "addresses"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <MapPin size={16} /> Delivery Address
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "wishlist"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Heart size={16} /> My Wishlist
            </button>
            <button
              onClick={() => setActiveTab("recently-viewed")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "recently-viewed" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Eye size={16} /> Recently Viewed
            </button>
            <button
              onClick={() => setActiveTab("offers-coupons")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "offers-coupons"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Ticket size={16} /> Offers & Coupons
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
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
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
                            onChange={(e) => {
                              setForm({ ...form, city: e.target.value });
                              setCityLocked(false);
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            readOnly={cityLocked}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={form.pincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setForm({ ...form, pincode: value });
                            if (value.length === 6) {
                              lookupPincode(
                                value,
                                (result) => {
                                  setForm((prev) => ({ ...prev, pincode: value, city: result.city }));
                                  setCityLocked(true);
                                },
                                () => {
                                  setCityLocked(false);
                                }
                              );
                            } else {
                              setCityLocked(false);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                        {pincodeLoading && (
                          <p className="text-xs text-cyan-400 mt-1">Fetching location...</p>
                        )}
                        {pincodeError && (
                          <p className="text-xs text-rose-400 mt-1">{pincodeError}</p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-slate-800 mt-6">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg shadow-md disabled:opacity-50 transition-colors"
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
                          <User size={12} className="text-cyan-400" /> Full
                          Name
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.first_name} {profile?.last_name || "N/A"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Mail size={12} className="text-cyan-400" /> Email
                          Address
                        </div>
                        <p className="text-white text-sm font-semibold break-all">
                          {profile?.email}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Phone size={12} className="text-cyan-400" /> Phone
                          Number
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.phone || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <Home size={12} className="text-cyan-400" /> City
                        </div>
                        <p className="text-white text-sm font-semibold">
                          {profile?.city || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-4 sm:col-span-2">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                          <MapPin size={12} className="text-cyan-400" />{" "}
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Complete History <ChevronRight size={14} />
                    </Link>
                  </div>

                  {/* Aggregate Portfolio Summary */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 pb-5 border-b border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <Package size={18} className="text-cyan-400" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Orders</p>
                        <p className="text-lg font-black text-white">{totalOrders}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      <Package size={18} className="text-cyan-400" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Items</p>
                        <p className="text-lg font-black text-white">{totalItems}</p>
                      </div>
                    </div>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-3.5">
                      {recentOrders.map((order) => {
                        const totalQuantity = parseInt(order.total_quantity) || 0;
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
                            className="rounded-lg bg-slate-950 border border-slate-800 p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
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

                            {/* Middle: Stats Row - Items, Date, Refund Status */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium mb-2">
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
                              <p className="text-base font-black text-cyan-400">
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
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
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
                        className="inline-flex items-center justify-center text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-white shadow-md transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  )}

                  {orders.length > 0 && (
                    <div className="mt-5 rounded-lg bg-slate-950 border border-slate-800 p-3.5 flex items-center gap-3">
                      <Truck
                        size={16}
                        className="text-cyan-400 flex-shrink-0"
                      />
                      <p className="text-xs text-slate-400 font-medium">
                        Track your order status in real time.{" "}
                        <Link
                          to="/track-order"
                          className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-0.5"
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
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">Delivery Address</h2>
                        <p className="text-slate-400 text-xs mt-0.5">Your saved delivery address for orders.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            first_name: profile?.first_name || "",
                            last_name: profile?.last_name || "",
                            phone: profile?.phone || "",
                            address: profile?.address || "",
                            city: profile?.city || "",
                            pincode: profile?.pincode || "",
                          });
                          setEditMode(true);
                          setActiveTab("profile");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all"
                      >
                        <Settings size={14} /> Edit Address
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950 border border-slate-800 p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
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
                              {profile.pincode && ` - ${profile.pincode}`}
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

              {/* WISHLIST CONTROL VIEW */}
              {activeTab === "wishlist" && (
                <motion.div
                  key="wishlist-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl"
                >
                  <div className="border-b border-slate-800 pb-5 mb-6">
                    <h2 className="text-lg font-bold text-white">
                      My Wishlist
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Products you have saved for later.
                    </p>
                  </div>

                  {wishlist.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                      {wishlist.map((item) => (
                        <div key={item.id || item.product_id} className="relative rounded-lg bg-slate-950 border border-slate-800 p-4 flex flex-col group hover:border-slate-700 transition-colors">
                          <Link to={`/product/${item.product_id}`} className="block flex-shrink-0 mb-3 w-full h-32 relative rounded-md overflow-hidden bg-slate-900 border border-slate-800/60 flex items-center justify-center">
                            {item.image_url ? (
                              <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-contain p-2" />
                            ) : (
                              <ShoppingBag size={24} className="text-slate-700" />
                            )}
                          </Link>
                          
                          <div className="flex-grow flex flex-col justify-between">
                            <Link to={`/product/${item.product_id}`} className="block mb-2">
                              <h3 className="text-sm font-bold text-slate-100 hover:text-cyan-400 line-clamp-2 transition-colors">
                                {item.name}
                              </h3>
                            </Link>

                            {/* Out of stock → one-click Back-in-Stock alert */}
                            {Number(item.stock_quantity) <= 0 && (
                              <div className="mb-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 mb-2">
                                  Out of Stock
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleNotifyWishlistItem(item.product_id)}
                                  disabled={notifyLoadingId === item.product_id || notifySubscribed[item.product_id]}
                                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                                    notifySubscribed[item.product_id]
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
                                      : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white hover:border-amber-500"
                                  }`}
                                >
                                  {notifyLoadingId === item.product_id ? (
                                    <Loader size={13} className="animate-spin" />
                                  ) : (
                                    <Bell size={13} />
                                  )}
                                  {notifySubscribed[item.product_id]
                                    ? "✓ Notification Active"
                                    : "🔔 Notify Me When Available"}
                                </button>
                              </div>
                            )}
                            <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-800/60">
                              <div className="flex flex-col">
                                {item.price_dropped && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                    🔥 Price Dropped{item.drop_amount > 0 ? ` ₹${Number(item.drop_amount).toLocaleString("en-IN")}` : ""}
                                  </span>
                                )}
                                <span className="text-sm font-black text-white">
                                  ₹{parseFloat(item.final_price || item.price || 0).toFixed(2)}
                                </span>
                                {item.sale_price && parseFloat(item.sale_price) < parseFloat(item.price) && (
                                  <span className="text-[10px] text-slate-500 line-through">
                                    ₹{parseFloat(item.price || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleAddToCart(item, e)}
                                  disabled={item.stock_quantity <= 0}
                                  className="w-8 h-8 rounded-lg bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600 hover:text-white hover:border-cyan-500 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Add to Cart"
                                >
                                  <ShoppingCart size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveWishlist(item.product_id)}
                                  disabled={removingFromWishlist === item.product_id}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white hover:border-rose-500 flex items-center justify-center transition-colors disabled:opacity-50"
                                  title="Remove from Wishlist"
                                >
                                  {removingFromWishlist === item.product_id ? (
                                    <Loader size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                        <Heart size={20} className="text-slate-500" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-300 mb-1">
                        Your wishlist is empty
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Save items you love here to buy them later.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center justify-center text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-white shadow-md transition-colors"
                      >
                        Browse Products
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "recently-viewed" && (
                <RecentlyViewedSection
                  products={recentlyViewed.products}
                  onRemove={recentlyViewed.remove}
                  onClear={recentlyViewed.clear}
                  onAddToCart={handleAddToCart}
                  wishlist={wishlist.map((item) => Number(item.product_id))}
                  compact
                />
              )}
              {activeTab === "offers-coupons" && (
                <motion.div key="offers-coupons-tab" variants={tabContentVariants} initial="hidden" animate="show" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <Ticket size={20} className="text-cyan-400" /> My Offers & Coupons
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Redeem your coupons at checkout to unlock exclusive offers.
                    </p>
                  </div>

                  {couponsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader size={20} className="animate-spin text-cyan-400" />
                    </div>
                  ) : myCoupons.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                      <Ticket size={28} className="mx-auto text-slate-600" />
                      <p className="mt-3 text-slate-400 text-sm">You have no active coupons right now.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {myCoupons.map((c) => {
                        const daysLeft = c.expiresAt ? Math.max(1, Math.ceil((new Date(c.expiresAt) - new Date()) / 86400000)) : null;
                        const isPct = c.offerType === "percentage" || c.offerType === "percent";
                        const valueLabel = isPct ? `${c.offerValue}% OFF` : `₹${Number(c.offerValue || 0).toLocaleString("en-IN")} OFF`;
                        return (
                          <div key={c.id} className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Welcome Offer</span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {daysLeft ? `Expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}` : "No expiry"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{c.offerName || "Offer"}</h3>
                              <p className="text-sm text-slate-400">{c.offerDescription || valueLabel}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              <span>{valueLabel}</span>
                              {Number(c.minOrder || 0) > 0 && <span>Min order ₹{Number(c.minOrder).toLocaleString("en-IN")}</span>}
                              {Number(c.maxDiscount || 0) > 0 && <span>Max savings ₹{Number(c.maxDiscount).toLocaleString("en-IN")}</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <code className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-1.5 text-sm font-mono text-cyan-300 tracking-wide">
                                {c.code}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyCouponCode(c.code)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                              >
                                {copiedCode === c.code ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copiedCode === c.code ? "Copied" : "Copy Code"}
                              </button>
                              <Link to="/shop" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-indigo-500">
                                Shop Now
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
          className="w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white shadow-2xl shadow-cyan-600/40 border border-cyan-500/30 transition-colors group"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
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
                                ? "fill-cyan-400 text-cyan-400"
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
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
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
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
                  className="motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] flex-1 inline-flex items-center justify-center gap-2 rounded-[12px] bg-cyan-600 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:bg-cyan-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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

      <CancelSuccessMessage
        show={!!cancelSuccessOrder}
        order={cancelSuccessOrder}
        onClose={() => setCancelSuccessOrder(null)}
      />
    </div>
  );
}