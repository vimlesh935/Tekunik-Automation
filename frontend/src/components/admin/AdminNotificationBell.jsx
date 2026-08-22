import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronRight, User, Heart, ShoppingCart, Star, Package, Home, Search, AlertTriangle, TrendingUp, Zap, Percent, Eye, Scale, CreditCard, MapPin, Tag } from "lucide-react";
import { adminActivityService } from "../../services/api";

const ACTIVITY_META = {
  USER_REGISTERED: { icon: User, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "New Customer" },
  USER_LOGIN: { icon: User, color: "text-blue-400", bg: "bg-blue-500/10", label: "Customer Login" },
  WISHLIST_ADDED: { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10", label: "Wishlist Activity" },
  WISHLIST_REMOVED: { icon: Heart, color: "text-pink-400/60", bg: "bg-pink-500/5", label: "Wishlist Removed" },
  CART_ITEM_ADDED: { icon: ShoppingCart, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Cart Activity" },
  CART_ITEM_REMOVED: { icon: ShoppingCart, color: "text-cyan-400/60", bg: "bg-cyan-500/5", label: "Cart Removed" },
  CART_ABANDONED: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Abandoned Cart" },
  ORDER_CREATED: { icon: Package, color: "text-purple-400", bg: "bg-purple-500/10", label: "New Order" },
  ORDER_CANCELLED: { icon: Package, color: "text-red-400", bg: "bg-red-500/10", label: "Order Cancelled" },
  REVIEW_SUBMITTED: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "New Review" },
  REVIEW_LOW_RATING: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Low Rating Review" },
  REVIEW_PENDING: { icon: Star, color: "text-amber-400", bg: "bg-amber-500/10", label: "Review Pending" },
  SMART_HOME_REQUEST_CREATED: { icon: Home, color: "text-teal-400", bg: "bg-teal-500/10", label: "Smart Home Request" },
  SMART_HOME_REQUEST_UPDATED: { icon: Home, color: "text-teal-400/70", bg: "bg-teal-500/5", label: "Smart Home Updated" },
  PRODUCT_VIEWED: { icon: Eye, color: "text-gray-400", bg: "bg-gray-500/10", label: "Product View" },
  PRODUCT_SEARCHED: { icon: Search, color: "text-gray-400", bg: "bg-gray-500/10", label: "Search" },
  ZERO_RESULT_SEARCH: { icon: Search, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Product Opportunity" },
  PRODUCT_COMPARE: { icon: Scale, color: "text-indigo-400", bg: "bg-indigo-500/10", label: "Product Compare" },
  PAYMENT_SUCCESS: { icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Payment Success" },
  PAYMENT_FAILED: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Payment Failed" },
  HIGH_PRODUCT_INTEREST: { icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10", label: "High Product Interest" },
  PRODUCT_DEMAND: { icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10", label: "Product Demand" },
  LOW_STOCK_DEMAND: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Inventory Attention" },
  PRICE_DROPPED: { icon: Tag, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Price Dropped" },
  OFFER_VIEWED: { icon: Percent, color: "text-green-400", bg: "bg-green-500/10", label: "Offer Viewed" },
  OFFER_USED: { icon: Percent, color: "text-green-400", bg: "bg-green-500/10", label: "Offer Used" },
  ADDRESS_ADDED: { icon: MapPin, color: "text-gray-400", bg: "bg-gray-500/10", label: "Address Added" },
};

const getActivityMeta = (type) => ACTIVITY_META[type] || { icon: Bell, color: "text-gray-400", bg: "bg-gray-500/10", label: "Activity" };

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const getActivityTitle = (activity) => {
  const meta = getActivityMeta(activity.activity_type);
  const m = activity.metadata || {};
  switch (activity.activity_type) {
    case "USER_REGISTERED":
      return `${m.name || activity.name || "A customer"} registered`;
    case "USER_LOGIN":
      return `${m.name || activity.name || "A customer"} logged in`;
    case "WISHLIST_ADDED":
      return `${m.productName || "A product"} added to wishlist`;
    case "WISHLIST_REMOVED":
      return `${m.productName || "A product"} removed from wishlist`;
    case "CART_ITEM_ADDED":
      return `${m.productName || "A product"} added to cart`;
    case "CART_ITEM_REMOVED":
      return `${m.productName || "A product"} removed from cart`;
    case "CART_ABANDONED":
      return `${m.itemCount || 0} items worth ₹${Number(m.cartValue || 0).toLocaleString("en-IN")} abandoned`;
    case "ORDER_CREATED":
      return `Order ${m.orderNumber || ""} placed for ₹${Number(m.totalAmount || 0).toLocaleString("en-IN")}`;
    case "ORDER_CANCELLED":
      return `Order ${m.orderNumber || ""} was cancelled`;
    case "REVIEW_SUBMITTED":
      return `${m.customerName || "A customer"} submitted a ${m.rating || ""}-star review`;
    case "REVIEW_LOW_RATING":
      return `${m.customerName || "A customer"} gave ${m.productName || "a product"} ${m.rating || ""} stars`;
    case "REVIEW_PENDING":
      return `A review is waiting for moderation`;
    case "SMART_HOME_REQUEST_CREATED":
      return `New smart home request from ${m.fullName || "a customer"}`;
    case "SMART_HOME_REQUEST_UPDATED":
      return `Smart home request ${m.proposalNumber || ""} updated to ${m.status || ""}`;
    case "PRODUCT_VIEWED":
      return `${m.productName || "A product"} was viewed`;
    case "PRODUCT_SEARCHED":
      return `Search: "${m.query || ""}"`;
    case "ZERO_RESULT_SEARCH":
      return `"${m.query || ""}" searched ${m.count || 0} times with no results`;
    case "PRODUCT_COMPARE":
      return `Products compared: ${(m.productNames || []).join(", ")}`;
    case "PAYMENT_SUCCESS":
      return `Payment successful for order ${m.orderNumber || ""}`;
    case "PAYMENT_FAILED":
      return `Payment failed for order ${m.orderNumber || ""}`;
    case "HIGH_PRODUCT_INTEREST":
      return `${m.productName || "A product"} has high customer interest`;
    case "PRODUCT_DEMAND":
      return `${m.productName || "A product"} is trending`;
    case "LOW_STOCK_DEMAND":
      return `${m.productName || "A product"} is trending with low stock`;
    case "PRICE_DROPPED":
      return `${m.productName || "A product"} price dropped from ₹${Number(m.oldPrice || 0).toLocaleString("en-IN")} to ₹${Number(m.newPrice || 0).toLocaleString("en-IN")}`;
    case "OFFER_VIEWED":
      return `Offer viewed`;
    case "OFFER_USED":
      return `Offer used`;
    case "ADDRESS_ADDED":
      return `Customer added a delivery address`;
    default:
      return meta.label;
  }
};

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [countRes, recentRes] = await Promise.all([
        adminActivityService.unreadCount(),
        adminActivityService.recent(8),
      ]);
      setUnread(countRes?.data?.count || 0);
      setActivities(recentRes?.data?.activities || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.warn("[ADMIN BELL] Failed to load:", error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await adminActivityService.markAllRead();
      setUnread(0);
      setActivities((prev) => prev.map((a) => ({ ...a, is_read: 1 })));
    } catch (error) {
      console.warn("[ADMIN BELL] Mark all read failed:", error.message);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminActivityService.markRead(id);
      setUnread((prev) => Math.max(0, prev - 1));
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)));
    } catch (error) {
      console.warn("[ADMIN BELL] Mark read failed:", error.message);
    }
  };

  const badgeText = unread === 0 ? null : unread > 9 ? "9+" : String(unread);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
        aria-label="Admin notifications"
      >
        <Bell size={18} />
        {badgeText && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-[#0d0d0d] border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60 bg-gray-900/40">
            <div>
              <h3 className="text-sm font-bold text-white">Activity Center</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {unread > 0 ? `${unread} new activit${unread === 1 ? "y" : "ies"}` : "All caught up"}
                {lastUpdated && (
                  <span className="ml-2 text-emerald-400/70">• Live</span>
                )}
              </p>
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* Activity list */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
            {loading && activities.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-500 text-sm">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                <Bell size={28} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No activities yet</p>
                <p className="text-[10px] mt-1">Customer actions will appear here</p>
              </div>
            ) : (
              activities.map((activity) => {
                const meta = getActivityMeta(activity.activity_type);
                const Icon = meta.icon;
                return (
                  <button
                    key={activity.id}
                    onClick={() => {
                      if (!activity.is_read) handleMarkRead(activity.id);
                      navigate("/admin/notifications");
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-800/30 transition-colors border-b border-gray-800/20 last:border-b-0 ${
                      !activity.is_read ? "bg-cyan-500/[0.03]" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${meta.bg} shrink-0`}>
                      <Icon size={16} className={meta.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {getActivityTitle(activity)}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {activity.name || "Customer"} • {timeAgo(activity.created_at)}
                      </p>
                    </div>
                    {!activity.is_read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <button
            onClick={() => {
              navigate("/admin/notifications");
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900/40 text-cyan-400 text-xs font-bold hover:bg-gray-800/40 transition-colors border-t border-gray-800/60"
          >
            View Activity Center <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}