import { BadgePercent, Box, CheckCircle2, Heart, Info, RefreshCw, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Hook to get translated notification types
 * Must be used within a component that has access to useTranslation
 */
export const useNotificationTypes = () => {
  const { t } = useTranslation();

  return {
    ORDER_PLACED: { label: t('notificationTypes.orderPlaced'), icon: Box, color: "text-cyan-400" },
    ORDER_CONFIRMED: { label: t('notificationTypes.orderConfirmed'), icon: CheckCircle2, color: "text-cyan-400" },
    ORDER_PROCESSING: { label: t('notificationTypes.orderProcessing'), icon: Box, color: "text-blue-400" },
    ORDER_PACKED: { label: t('notificationTypes.orderPacked'), icon: Box, color: "text-teal-400" },
    ORDER_SHIPPED: { label: t('notificationTypes.orderShipped'), icon: Truck, color: "text-indigo-400" },
    ORDER_IN_TRANSIT: { label: t('notificationTypes.orderInTransit'), icon: Truck, color: "text-indigo-400" },
    ORDER_OUT_FOR_DELIVERY: { label: t('notificationTypes.orderOutForDelivery'), icon: Truck, color: "text-amber-400" },
    ORDER_DELIVERED: { label: t('notificationTypes.orderDelivered'), icon: CheckCircle2, color: "text-emerald-400" },
    ORDER_DELIVERY_FAILED: { label: t('notificationTypes.orderDeliveryFailed'), icon: Info, color: "text-rose-400" },
    ORDER_CANCELLED: { label: t('notificationTypes.orderCancelled'), icon: Info, color: "text-rose-400" },
    WISHLIST: { label: t('notificationTypes.wishlist'), icon: Heart, color: "text-rose-400" },
    OFFER: { label: t('notificationTypes.offers'), icon: BadgePercent, color: "text-amber-400" },
    PRICE_DROP: { label: t('notificationTypes.priceDrops'), icon: BadgePercent, color: "text-emerald-400" },
    BACK_IN_STOCK: { label: t('notificationTypes.backInStock'), icon: RefreshCw, color: "text-cyan-400" },
    SYSTEM: { label: t('notificationTypes.system'), icon: Info, color: "text-slate-400" },
    NEW_PRODUCT: { label: t('notificationTypes.products'), icon: Box, color: "text-cyan-400" },
    PRODUCT_UPDATE: { label: t('notificationTypes.products'), icon: Box, color: "text-cyan-400" },
    PRODUCT_UNAVAILABLE: { label: t('notificationTypes.products'), icon: Info, color: "text-rose-400" },
    NEW_CATEGORY: { label: t('notificationTypes.products'), icon: Box, color: "text-cyan-400" },
    SMART_HOME: { label: t('notificationTypes.smartHome'), icon: Info, color: "text-indigo-400" },
  };
};

/**
 * Hook to get translated notification filter types
 */
export const useNotificationFilterTypes = () => {
  const { t } = useTranslation();

  return [
    { label: t('notificationTypes.all'), value: "" },
    { label: t('notificationTypes.unread'), value: "unread" },
    { label: t('notificationTypes.orderPlaced'), value: "ORDER" },
    { label: t('notificationTypes.priceDrops'), value: "PRICE_DROP" },
    { label: t('notificationTypes.offers'), value: "OFFER" },
    { label: t('notificationTypes.products'), value: "PRODUCTS" },
    { label: t('notificationTypes.wishlist'), value: "WISHLIST" },
    { label: t('notificationTypes.smartHome'), value: "SMART_HOME" },
    { label: t('notificationTypes.system'), value: "SYSTEM" },
  ];
};

// Legacy exports for backward compatibility (non-translated)
export const notificationTypes = {
  ORDER_PLACED: { label: "Order Placed", icon: Box, color: "text-cyan-400" },
  ORDER_CONFIRMED: { label: "Order Confirmed", icon: CheckCircle2, color: "text-cyan-400" },
  ORDER_PROCESSING: { label: "Order Processing", icon: Box, color: "text-blue-400" },
  ORDER_PACKED: { label: "Order Packed", icon: Box, color: "text-teal-400" },
  ORDER_SHIPPED: { label: "Order Shipped", icon: Truck, color: "text-indigo-400" },
  ORDER_IN_TRANSIT: { label: "In Transit", icon: Truck, color: "text-indigo-400" },
  ORDER_OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Truck, color: "text-amber-400" },
  ORDER_DELIVERED: { label: "Order Delivered", icon: CheckCircle2, color: "text-emerald-400" },
  ORDER_DELIVERY_FAILED: { label: "Delivery Failed", icon: Info, color: "text-rose-400" },
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
  { label: "All", value: "" },
  { label: "Unread", value: "unread" },
  { label: "Orders", value: "ORDER" },
  { label: "Price Drops", value: "PRICE_DROP" },
  { label: "Offers", value: "OFFER" },
  { label: "Products", value: "PRODUCTS" },
  { label: "Wishlist", value: "WISHLIST" },
  { label: "Smart Home", value: "SMART_HOME" },
  { label: "System", value: "SYSTEM" },
];
