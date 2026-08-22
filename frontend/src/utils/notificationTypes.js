import { BadgePercent, Box, CheckCircle2, Heart, Info, RefreshCw, Truck } from "lucide-react";

export const notificationTypes = {
  ORDER_PLACED: { label: "Order Placed", icon: Box, color: "text-cyan-400" },
  ORDER_CONFIRMED: { label: "Order Confirmed", icon: CheckCircle2, color: "text-cyan-400" },
  ORDER_PROCESSING: { label: "Order Processing", icon: Box, color: "text-blue-400" },
  ORDER_SHIPPED: { label: "Order Shipped", icon: Truck, color: "text-indigo-400" },
  ORDER_OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Truck, color: "text-amber-400" },
  ORDER_DELIVERED: { label: "Order Delivered", icon: CheckCircle2, color: "text-emerald-400" },
  ORDER_CANCELLED: { label: "Order Cancelled", icon: Info, color: "text-rose-400" },
  WISHLIST: { label: "Wishlist", icon: Heart, color: "text-rose-400" },
  OFFER: { label: "Offers", icon: BadgePercent, color: "text-amber-400" },
  PRICE_DROP: { label: "Price Drops", icon: BadgePercent, color: "text-emerald-400" },
  BACK_IN_STOCK: { label: "Back in Stock", icon: RefreshCw, color: "text-cyan-400" },
  SYSTEM: { label: "System", icon: Info, color: "text-slate-400" },
  NEW_PRODUCT: { label: "Products", icon: Box, color: "text-cyan-400" },
  PRODUCT_UPDATE: { label: "Products", icon: Box, color: "text-cyan-400" },
  PRODUCT_UNAVAILABLE: { label: "Products", icon: Info, color: "text-rose-400" },
  NEW_CATEGORY: { label: "Products", icon: Box, color: "text-cyan-400" },
  SMART_HOME: { label: "Smart Home", icon: Info, color: "text-indigo-400" },
};

export const notificationFilterTypes = [
  { label: "All", value: "" }, { label: "Unread", value: "unread" },
  { label: "Orders", value: "ORDER" }, { label: "Price Drops", value: "PRICE_DROP" },
  { label: "Offers", value: "OFFER" },
  { label: "Products", value: "PRODUCTS" }, { label: "Wishlist", value: "WISHLIST" },
  { label: "Smart Home", value: "SMART_HOME" }, { label: "System", value: "SYSTEM" },
];
