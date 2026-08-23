import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Search, Filter, RefreshCw, CheckCheck, ChevronLeft, ChevronRight,
  User, Heart, ShoppingCart, Star, Package, Home, AlertTriangle, TrendingUp,
  Zap, Percent, Eye, Scale, CreditCard, MapPin, X, Clock, Activity, Tag
} from "lucide-react";
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
  BACK_IN_STOCK: { icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Product Back in Stock" },
  OUT_OF_STOCK: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Product Out of Stock" },
  DEMAND_EXCEEDS_RESTOCK: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Demand Exceeds Restock" },
  RESTOCK_BELOW_DEMAND: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Restocked Below Customer Demand" },
  POST_RESTOCK_PURCHASE: { icon: ShoppingCart, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Purchase after Restock Alert" },
  OFFER_VIEWED: { icon: Percent, color: "text-green-400", bg: "bg-green-500/10", label: "Offer Viewed" },
  OFFER_USED: { icon: Percent, color: "text-green-400", bg: "bg-green-500/10", label: "Offer Used" },
  ADDRESS_ADDED: { icon: MapPin, color: "text-gray-400", bg: "bg-gray-500/10", label: "Address Added" },
};

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "customers", label: "Customers" },
  { value: "wishlist", label: "Wishlist" },
  { value: "cart", label: "Cart" },
  { value: "orders", label: "Orders" },
  { value: "reviews", label: "Reviews" },
  { value: "products", label: "Products" },
  { value: "inventory", label: "Inventory" },
  { value: "search", label: "Search" },
  { value: "smart_home", label: "Smart Home" },
  { value: "offers", label: "Offers" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const DATE_RANGES = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

const getActivityMeta = (type) => ACTIVITY_META[type] || { icon: Bell, color: "text-gray-400", bg: "bg-gray-500/10", label: "Activity" };

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

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
  const m = activity.metadata || {};
  switch (activity.activity_type) {
    case "USER_REGISTERED": return `${m.name || activity.customer_name || "A customer"} registered`;
    case "USER_LOGIN": return `${m.name || activity.customer_name || "A customer"} logged in`;
    case "WISHLIST_ADDED": return `${m.productName || "A product"} added to wishlist`;
    case "WISHLIST_REMOVED": return `${m.productName || "A product"} removed from wishlist`;
    case "CART_ITEM_ADDED": return `${m.productName || "A product"} added to cart`;
    case "CART_ITEM_REMOVED": return `${m.productName || "A product"} removed from cart`;
    case "CART_ABANDONED": return `${m.itemCount || 0} items worth ₹${Number(m.cartValue || 0).toLocaleString("en-IN")} abandoned`;
    case "ORDER_CREATED": return `Order ${m.orderNumber || ""} placed for ₹${Number(m.totalAmount || 0).toLocaleString("en-IN")}`;
    case "ORDER_CANCELLED": return `Order ${m.orderNumber || ""} was cancelled`;
    case "REVIEW_SUBMITTED": return `${m.customerName || "A customer"} submitted a ${m.rating || ""}-star review`;
    case "REVIEW_LOW_RATING": return `${m.customerName || "A customer"} gave ${m.productName || "a product"} ${m.rating || ""} stars`;
    case "REVIEW_PENDING": return `A review is waiting for moderation`;
    case "SMART_HOME_REQUEST_CREATED": return `New smart home request from ${m.fullName || "a customer"}`;
    case "SMART_HOME_REQUEST_UPDATED": return `Smart home request ${m.proposalNumber || ""} updated to ${m.status || ""}`;
    case "PRODUCT_VIEWED": return `${m.productName || "A product"} was viewed`;
    case "PRODUCT_SEARCHED": return `Search: "${m.query || ""}"`;
    case "ZERO_RESULT_SEARCH": return `"${m.query || ""}" searched ${m.count || 0} times with no results`;
    case "PRODUCT_COMPARE": return `Products compared: ${(m.productNames || []).join(", ")}`;
    case "PAYMENT_SUCCESS": return `Payment successful for order ${m.orderNumber || ""}`;
    case "PAYMENT_FAILED": return `Payment failed for order ${m.orderNumber || ""}`;
    case "HIGH_PRODUCT_INTEREST": return `${m.productName || "A product"} has high customer interest`;
    case "PRODUCT_DEMAND": return `${m.productName || "A product"} is trending`;
    case "LOW_STOCK_DEMAND": return `${m.productName || "A product"} is trending with low stock`;
    case "PRICE_DROPPED": return `${m.productName || "A product"} price dropped from ₹${Number(m.oldPrice || 0).toLocaleString("en-IN")} to ₹${Number(m.newPrice || 0).toLocaleString("en-IN")}`;
    case "BACK_IN_STOCK": {
      const priceNote = m.combinedWithPriceDrop
        ? ` at ₹${Number(m.newPrice || 0).toLocaleString("en-IN")} (🔥 Price Drop + Restock)`
        : "";
      return `${m.productName || "A product"} is back in stock${priceNote} — stock ${m.previousStock ?? 0} → ${m.newStock ?? 0}, ${m.notificationsCreated || 0} customer(s) notified`;
    }
    case "OUT_OF_STOCK": return `${m.productName || "A product"} became Out of Stock (${m.previousStock ?? 0} → ${m.newStock ?? 0})`;
    case "DEMAND_EXCEEDS_RESTOCK": return `${m.message || `${m.waitingCustomers || 0} customers were waiting but only ${m.restockedUnits || 0} units were restocked`}`;
    case "RESTOCK_BELOW_DEMAND": return `${m.message || `${m.currentStock || 0} units are available, but ${m.waitingCustomers || 0} customers were waiting for this product`}`;
    case "POST_RESTOCK_PURCHASE": return `${activity.customer_name || m.customerName || "A customer"} purchased ${m.productName || "a product"} after a restock alert`;
    case "OFFER_VIEWED": return `Offer viewed`;
    case "OFFER_USED": return `Offer used`;
    case "ADDRESS_ADDED": return `Customer added a delivery address`;
    default: return getActivityMeta(activity.activity_type).label;
  }
};

const getActivityDetail = (activity) => {
  const m = activity.metadata || {};
  switch (activity.activity_type) {
    case "USER_REGISTERED": return { customer: m.name || activity.customer_name, detail: m.email || "" };
    case "USER_LOGIN": return { customer: m.name || activity.customer_name, detail: m.email || "" };
    case "WISHLIST_ADDED": return { customer: activity.customer_name, detail: m.productName || "" };
    case "CART_ITEM_ADDED": return { customer: activity.customer_name, detail: `${m.productName || ""} × ${m.quantity || 1}` };
    case "ORDER_CREATED": return { customer: m.customerName || activity.customer_name, detail: `${m.itemCount || 0} items` };
    case "REVIEW_SUBMITTED": return { customer: m.customerName || activity.customer_name, detail: m.reviewPreview || "" };
    case "REVIEW_LOW_RATING": return { customer: m.customerName || activity.customer_name, detail: m.reviewPreview || "" };
    case "SMART_HOME_REQUEST_CREATED": return { customer: m.fullName || "", detail: m.homeType || "" };
    default: return { customer: activity.customer_name || activity.name, detail: "" };
  }
};

const priorityStyles = {
  LOW: "text-gray-500 bg-gray-500/10 border-gray-500/20",
  NORMAL: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  HIGH: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AdminActivityCenter() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unread, setUnread] = useState(0);

  // Filters
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        category,
        priority,
        unread: unreadOnly ? "1" : "",
        dateRange,
        search: debouncedSearch,
      };
      const [listRes, countRes] = await Promise.all([
        adminActivityService.list(params),
        adminActivityService.unreadCount(),
      ]);
      setActivities(listRes?.data?.activities || []);
      setPagination(listRes?.data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 });
      setUnread(countRes?.data?.count || 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error("[ACTIVITY CENTER] Load failed:", err);
    }
    setLoading(false);
  }, [page, category, priority, unreadOnly, dateRange, debouncedSearch]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(loadActivities, 20000);
    return () => clearInterval(interval);
  }, [loadActivities]);

  const handleMarkAllRead = async () => {
    try {
      await adminActivityService.markAllRead();
      setUnread(0);
      setActivities((prev) => prev.map((a) => ({ ...a, is_read: 1 })));
    } catch (err) {
      console.warn("[ACTIVITY CENTER] Mark all read failed:", err.message);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminActivityService.markRead(id);
      setUnread((prev) => Math.max(0, prev - 1));
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)));
    } catch (err) {
      console.warn("[ACTIVITY CENTER] Mark read failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      await adminActivityService.remove(id);
      loadActivities();
    } catch (err) {
      console.warn("[ACTIVITY CENTER] Delete failed:", err.message);
    }
  };

  const resetFilters = () => {
    setCategory("");
    setPriority("");
    setUnreadOnly(false);
    setDateRange("");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  // Group activities by date
  const grouped = activities.reduce((acc, activity) => {
    const key = formatDate(activity.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Activity size={22} className="text-cyan-400" />
            Activity Center
          </h2>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <Clock size={12} />
            Monitor important customer activity, orders and store events in real time.
            {lastUpdated && (
              <span className="flex items-center gap-1 text-emerald-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live • Updated {timeAgo(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition"
            >
              <CheckCheck size={14} /> Mark all read ({unread})
            </button>
          )}
          <button
            onClick={loadActivities}
            disabled={loading}
            className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, product, order ID..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/40"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/40"
          >
            {DATE_RANGES.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Unread toggle */}
          <button
            onClick={() => { setUnreadOnly((prev) => !prev); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-sm font-bold border transition ${
              unreadOnly
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "bg-gray-900/80 text-gray-500 border-gray-800 hover:text-gray-300"
            }`}
          >
            Unread only
          </button>

          {(category || priority || unreadOnly || dateRange || search) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-12 text-red-400 text-sm bg-red-500/5 border border-red-500/10 rounded-2xl">
          <AlertTriangle size={16} className="mr-2" /> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && activities.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-1.5 rounded-full border-t-2 border-cyan-400 animate-spin" />
            </div>
            <p className="text-sm text-gray-500 animate-pulse">Loading activity...</p>
          </div>
        </div>
      )}

      {/* Activity timeline */}
      {!loading && activities.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 bg-gray-900/30 border border-gray-800/40 rounded-2xl">
          <Bell size={40} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No activities found</p>
          <p className="text-[10px] mt-1">Try adjusting your filters or search</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{date}</h3>
                <div className="flex-1 h-px bg-gray-800/40" />
                <span className="text-[10px] text-gray-600">{items.length} activit{items.length === 1 ? "y" : "ies"}</span>
              </div>
              <div className="space-y-2">
                {items.map((activity) => {
                  const meta = getActivityMeta(activity.activity_type);
                  const Icon = meta.icon;
                  const detail = getActivityDetail(activity);
                  return (
                    <div
                      key={activity.id}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        !activity.is_read
                          ? "bg-cyan-500/[0.04] border-cyan-500/20"
                          : "bg-gray-900/40 border-gray-800/40 hover:border-gray-700/60"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${meta.bg} shrink-0`}>
                        <Icon size={18} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {getActivityTitle(activity)}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {detail.customer && <span className="text-gray-400">{detail.customer}</span>}
                              {detail.detail && <span className="text-gray-600"> • {detail.detail}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${priorityStyles[activity.priority] || priorityStyles.LOW}`}>
                              {activity.priority}
                            </span>
                            <span className="text-[10px] text-gray-600 whitespace-nowrap">
                              {formatTime(activity.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!activity.is_read && (
                            <button
                              onClick={() => handleMarkRead(activity.id)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="text-[10px] text-gray-600 hover:text-red-400 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-600 text-xs">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      p === page
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : "bg-gray-900/80 text-gray-400 border border-gray-800 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages}
              className="p-2 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}