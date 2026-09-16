/**
 * Centralized Status Translation Utility
 * 
 * Provides translation keys for all backend/database status values.
 * Use these keys with the t() function from useTranslation().
 */

// Order status translation keys
export const ORDER_STATUS_KEYS = {
  pending: 'status.order.pending',
  confirmed: 'status.order.confirmed',
  processing: 'status.order.processing',
  packed: 'status.order.packed',
  shipped: 'status.order.shipped',
  in_transit: 'status.order.inTransit',
  out_for_delivery: 'status.order.outForDelivery',
  delivered: 'status.order.delivered',
  delivery_failed: 'status.order.deliveryFailed',
  cancelled: 'status.order.cancelled',
  returned: 'status.order.returned',
  refunded: 'status.order.refunded',
  partially_refunded: 'status.order.partiallyRefunded',
};

// Payment status translation keys
export const PAYMENT_STATUS_KEYS = {
  pending: 'status.payment.pending',
  paid: 'status.payment.paid',
  failed: 'status.payment.failed',
  refunded: 'status.payment.refunded',
  refund_pending: 'status.payment.refundPending',
};

// Product status translation keys
export const PRODUCT_STATUS_KEYS = {
  active: 'status.product.active',
  inactive: 'status.product.inactive',
  out_of_stock: 'status.product.outOfStock',
  in_stock: 'status.product.inStock',
  low_stock: 'status.product.lowStock',
};

// Return status translation keys
export const RETURN_STATUS_KEYS = {
  pending: 'status.return.pending',
  approved: 'status.return.approved',
  rejected: 'status.return.rejected',
  processing: 'status.return.processing',
  completed: 'status.return.completed',
};

// Review status translation keys
export const REVIEW_STATUS_KEYS = {
  pending: 'status.review.pending',
  approved: 'status.review.approved',
  rejected: 'status.review.rejected',
};

// Refund status translation keys
export const REFUND_STATUS_KEYS = {
  pending: 'status.refund.pending',
  processed: 'status.refund.processed',
  failed: 'status.refund.failed',
};

// Coupon status translation keys
export const COUPON_STATUS_KEYS = {
  active: 'status.coupon.active',
  disabled: 'status.coupon.disabled',
  expired: 'status.coupon.expired',
  used: 'status.coupon.used',
};

// Shipment/Tracking step translation keys
export const TRACKING_STEP_KEYS = {
  order_confirmed: 'trackOrder.stepOrderConfirmed',
  confirmed: 'trackOrder.stepConfirmed',
  processing: 'trackOrder.stepProcessing',
  packed: 'trackOrder.stepPacked',
  shipped: 'trackOrder.stepShipped',
  in_transit: 'trackOrder.stepInTransit',
  out_for_delivery: 'trackOrder.stepOutForDelivery',
  delivered: 'trackOrder.stepDelivered',
  delivery_failed: 'trackOrder.stepDeliveryFailed',
};

/**
 * Get the translation key for a status value
 * @param {string} status - The status value from backend
 * @param {string} type - The status type (order, payment, product, etc.)
 * @returns {string} - The translation key
 */
export const getStatusKey = (status, type = 'order') => {
  const keyMaps = {
    order: ORDER_STATUS_KEYS,
    payment: PAYMENT_STATUS_KEYS,
    product: PRODUCT_STATUS_KEYS,
    return: RETURN_STATUS_KEYS,
    review: REVIEW_STATUS_KEYS,
    refund: REFUND_STATUS_KEYS,
    coupon: COUPON_STATUS_KEYS,
    tracking: TRACKING_STEP_KEYS,
  };
  
  const map = keyMaps[type] || ORDER_STATUS_KEYS;
  return map[status] || `${type}.status.${status}`;
};

/**
 * Get CSS color classes for a status (for badges)
 * @param {string} status - The status value
 * @param {string} type - The status type
 * @returns {string} - CSS class string
 */
export const getStatusColor = (status, type = 'order') => {
  const colorMaps = {
    order: {
      pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      confirmed: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      packed: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      shipped: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      in_transit: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      out_for_delivery: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      delivery_failed: 'text-red-400 bg-red-500/10 border-red-500/20',
      cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
      returned: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
    payment: {
      pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      failed: 'text-red-400 bg-red-500/10 border-red-500/20',
      refunded: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      refund_pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    product: {
      active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      inactive: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      out_of_stock: 'text-red-400 bg-red-500/10 border-red-500/20',
      in_stock: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      low_stock: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  };
  
  const map = colorMaps[type] || colorMaps.order;
  return map[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
};

export default {
  ORDER_STATUS_KEYS,
  PAYMENT_STATUS_KEYS,
  PRODUCT_STATUS_KEYS,
  RETURN_STATUS_KEYS,
  REVIEW_STATUS_KEYS,
  REFUND_STATUS_KEYS,
  COUPON_STATUS_KEYS,
  TRACKING_STEP_KEYS,
  getStatusKey,
  getStatusColor,
};
