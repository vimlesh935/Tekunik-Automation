import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, Users, ShoppingCart, Heart, Star, Package, Home,
  AlertTriangle, ChevronRight, User, Eye, Search, Scale, CreditCard,
  TrendingUp, Zap, Percent, MapPin, Bell, Clock, Tag
} from "lucide-react";
import { adminActivityService } from "../../../services/api";

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
  const m = activity.metadata || {};
  switch (activity.activity_type) {
    case "USER_REGISTERED": return `${m.name || activity.name || "A customer"} registered`;
    case "USER_LOGIN": return `${m.name || activity.name || "A customer"} logged in`;
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
    case "OFFER_VIEWED": return `Offer viewed`;
    case "OFFER_USED": return `Offer used`;
    case "ADDRESS_ADDED": return `Customer added a delivery address`;
    default: return getActivityMeta(activity.activity_type).label;
  }
};

// ─── Live Activity Widget ─────────────────────────────────────────────
export function LiveActivityWidget({ refreshInterval = 20000 }) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await adminActivityService.recent(6);
      setActivities(res?.data?.activities || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.warn("[LIVE ACTIVITY] Failed to load:", error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);

  return (
    <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Activity size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Live Activity</h3>
            <p className="text-[10px] text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : "Auto-refreshing"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/notifications")}
          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
        >
          View All <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-600 text-sm">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600">
            <Activity size={28} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-[10px] mt-1">Customer actions will appear here</p>
          </div>
        ) : (
          activities.map((activity) => {
            const meta = getActivityMeta(activity.activity_type);
            const Icon = meta.icon;
            return (
              <button
                key={activity.id}
                onClick={() => navigate("/admin/notifications")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/40 hover:border-gray-700/60 transition-all text-left"
              >
                <div className={`p-2 rounded-lg ${meta.bg} shrink-0`}>
                  <Icon size={14} className={meta.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{getActivityTitle(activity)}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {activity.name || "Customer"} • {timeAgo(activity.created_at)}
                  </p>
                </div>
                {!activity.is_read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Today's Summary Widget ───────────────────────────────────────────
export function TodaySummaryWidget() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await adminActivityService.dashboardSummary();
      setSummary(res?.data || {});
    } catch (error) {
      console.warn("[TODAY SUMMARY] Failed to load:", error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items = summary ? [
    { label: "New Customers", value: summary.new_customers, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10", to: "/admin/users" },
    { label: "New Orders", value: summary.new_orders, icon: Package, color: "text-purple-400", bg: "bg-purple-500/10", to: "/admin/orders" },
    { label: "Wishlist Adds", value: summary.wishlist_adds, icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10", to: "/admin/notifications?category=wishlist" },
    { label: "Cart Adds", value: summary.cart_adds, icon: ShoppingCart, color: "text-cyan-400", bg: "bg-cyan-500/10", to: "/admin/notifications?category=cart" },
    { label: "New Reviews", value: summary.new_reviews, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", to: "/admin/reviews" },
    { label: "Abandoned Carts", value: summary.abandoned_carts, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", to: "/admin/notifications?category=cart" },
    { label: "Smart Home Requests", value: summary.smart_home_requests, icon: Home, color: "text-teal-400", bg: "bg-teal-500/10", to: "/admin/smart-home-requests" },
    { label: "Low-Rating Reviews", value: summary.low_rating_reviews, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", to: "/admin/reviews" },
    { label: "Payment Failures", value: summary.payment_failures, icon: CreditCard, color: "text-red-400", bg: "bg-red-500/10", to: "/admin/orders" },
  ] : [];

  return (
    <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Clock size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Today's Summary</h3>
            <p className="text-[10px] text-gray-600">Real-time store activity</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-600 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/40 hover:border-gray-700/60 transition-all text-left"
              >
                <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                  <Icon size={14} className={item.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-white font-mono">{item.value}</p>
                  <p className="text-[9px] text-gray-500 truncate">{item.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Price Drop Performance Widget ───────────────────────────────────
export function PriceDropAnalyticsWidget() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await adminActivityService.priceDropAnalytics(30);
      setAnalytics(res?.data || null);
    } catch (error) {
      console.warn("[PRICE DROP ANALYTICS] Failed to load:", error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = analytics?.summary;

  return (
    <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Tag size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Price Drop Performance</h3>
            <p className="text-[10px] text-gray-600">Last 30 days</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/notifications?category=products")}
          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
        >
          View Activity <ChevronRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-600 text-sm">Loading...</div>
      ) : !stats || stats.total_drop_events === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Tag size={28} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No price drops yet</p>
          <p className="text-[10px] mt-1">Price changes will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-gray-800/30 border border-gray-800/40">
            <p className="text-xl font-black text-emerald-400 font-mono">{stats.products_dropped}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Products Dropped</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-800/30 border border-gray-800/40">
            <p className="text-xl font-black text-cyan-400 font-mono">{stats.total_drop_events}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Drop Events</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-800/30 border border-gray-800/40">
            <p className="text-xl font-black text-amber-400 font-mono">{stats.significant_drops}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Significant (10%+)</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Needs Attention Widget ───────────────────────────────────────────
export function NeedsAttentionWidget() {
  const navigate = useNavigate();
  const [attention, setAttention] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await adminActivityService.needsAttention();
      setAttention(res?.data || {});
    } catch (error) {
      console.warn("[NEEDS ATTENTION] Failed to load:", error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items = attention ? [
    { label: "low-rating reviews", value: attention.low_rating_reviews, icon: Star, color: "text-red-400", bg: "bg-red-500/10", to: "/admin/reviews" },
    { label: "payment failures", value: attention.payment_failures, icon: CreditCard, color: "text-red-400", bg: "bg-red-500/10", to: "/admin/orders" },
    { label: "abandoned high-value carts", value: attention.abandoned_carts, icon: ShoppingCart, color: "text-amber-400", bg: "bg-amber-500/10", to: "/admin/notifications?category=cart" },
    { label: "smart-home requests awaiting response", value: attention.smart_home_requests, icon: Home, color: "text-teal-400", bg: "bg-teal-500/10", to: "/admin/smart-home-requests" },
    { label: "products with high demand + low stock", value: attention.low_stock_demand, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", to: "/admin/inventory" },
  ].filter((item) => item.value > 0) : [];

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/60 rounded-[1.75rem] p-6 transition-all hover:border-gray-700/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Needs Attention</h3>
            <p className="text-[10px] text-gray-600">High-priority items requiring action</p>
          </div>
        </div>
        {total > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
            {total} items
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-600 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <AlertTriangle size={28} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">All clear</p>
          <p className="text-[10px] mt-1">No items require attention right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-800/40 hover:border-gray-700/60 transition-all text-left"
              >
                <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                  <Icon size={14} className={item.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">{item.value} {item.label}</p>
                </div>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}