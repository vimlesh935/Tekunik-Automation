const { query } = require("../config/db");
const { NOTIFICATION_TYPES, createNotification } = require("./notificationService");
const { ACTIVITY_TYPES, createActivity } = require("./adminActivityService");

// ─── PRICE DROP CONFIG ─────────────────────────────────────────────
const PRICE_DROP_MIN_PERCENT = 2;
const PRICE_DROP_MIN_AMOUNT = 50;
const DROP_TITLES = [
  { threshold: 25, title: "🚨 Huge Price Drop — Don't Miss It" },
  { threshold: 10, title: "🔥 Big Price Drop on Your Wishlist" },
  { threshold: 0, title: "Price Drop on Your Wishlist" },
];

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * Determine the effective customer-facing selling price.
 * If sale_price is present and lower than price, use sale_price.
 */
const getEffectivePrice = (product) => {
  const price = toMoney(product?.price);
  const salePrice = toMoney(product?.sale_price);
  if (salePrice > 0 && salePrice < price) return salePrice;
  return price;
};

const calculateDropPercent = (oldPrice, newPrice) => {
  if (!oldPrice || oldPrice <= 0) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 10000) / 100;
};

const pickTitle = (dropPercent) => {
  if (dropPercent >= 25) return "🚨 Huge Price Drop — Don't Miss It";
  if (dropPercent >= 10) return "🔥 Big Price Drop on Your Wishlist";
  return "Price Drop on Your Wishlist";
};

/**
 * Record a price change into product_price_history.
 */
const recordPriceHistory = async ({ productId, oldPrice, newPrice, oldSalePrice, newSalePrice, changeType, dropPercent, changedBy = null, notes = null }) => {
  try {
    await query(
      `INSERT INTO product_price_history
        (product_id, old_price, new_price, old_sale_price, new_sale_price, change_type, drop_percentage, changed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, oldPrice, newPrice, oldSalePrice, newSalePrice, changeType, dropPercent, changedBy, notes]
    );
    return true;
  } catch (error) {
    console.warn("[PRICE DROP] Failed to record price history:", error.message);
    return false;
  }
};

/**
 * Get price history for a product.
 */
const getPriceHistory = async (productId, { limit = 20 } = {}) => {
  const rows = await query(
    `SELECT * FROM product_price_history
     WHERE product_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [productId, Math.min(50, Math.max(1, Number(limit) || 20))]
  );
  return rows;
};

/**
 * Add a PRICE_DROPPED activity type to the ACTIVITY_TYPES map at runtime.
 * (We keep this local to avoid mutating the frozen ACTIVITY_TYPES.)
 */
const PRICE_DROPPED = "PRICE_DROPPED";

/**
 * Check if a price change qualifies for a price-drop alert.
 */
const isEligibleDrop = (oldPrice, newPrice) => {
  const dropAmount = oldPrice - newPrice;
  const dropPercent = calculateDropPercent(oldPrice, newPrice);
  return dropAmount >= PRICE_DROP_MIN_AMOUNT || dropPercent >= PRICE_DROP_MIN_PERCENT;
};

/**
 * Find wishlist customers for a product.
 */
const getWishlistUserIds = async (productId) => {
  const rows = await query(
    "SELECT user_id FROM wishlist WHERE product_id = ? AND user_id IS NOT NULL",
    [productId]
  );
  return rows.map((row) => Number(row.user_id));
};

/**
 * Find customers who have this product in their cart (not just wishlist).
 */
const getCartUserIds = async (productId) => {
  const rows = await query(
    `SELECT c.user_id
     FROM cart_items ci
     JOIN carts c ON ci.cart_id = c.id
     WHERE ci.product_id = ? AND c.user_id IS NOT NULL`,
    [productId]
  );
  return rows.map((row) => Number(row.user_id));
};

/**
 * Process a price drop after a product has been updated.
 * - Detects real price reductions (effective price).
 * - Creates customer notifications for wishlist AND cart customers (deduped).
 * - Records admin activity.
 * - Records price history.
 *
 * Returns summary for the admin response.
 */
const processPriceDropAfterUpdate = async ({ product, oldProduct, changedBy = null }) => {
  try {
    if (!product || !oldProduct || !product.id) {
      return { detected: false, reason: "missing_product_data" };
    }

    const oldEffective = getEffectivePrice(oldProduct);
    const newEffective = getEffectivePrice(product);
    const oldPrice = toMoney(oldProduct.price);
    const newPrice = toMoney(product.price);
    const oldSale = toMoney(oldProduct.sale_price);
    const newSale = toMoney(product.sale_price);

    // Determine change type
    let changeType = "NO_CHANGE";
    const priceChanged = newPrice !== oldPrice;
    const saleChanged = (newSale || 0) !== (oldSale || 0);
    if (priceChanged && newPrice > oldPrice) changeType = "PRICE_INCREASE";
    else if (priceChanged && newPrice < oldPrice) changeType = "PRICE_DECREASE";
    else if (saleChanged && oldSale === null && newSale > 0) changeType = "SALE_PRICE_CREATED";
    else if (saleChanged && newSale === null && oldSale > 0) changeType = "SALE_PRICE_REMOVED";
    else if (saleChanged && newSale < oldSale) changeType = "SALE_PRICE_UPDATED";

    // Record history for ANY real price change (up or down)
    if (priceChanged || saleChanged) {
      await recordPriceHistory({
        productId: product.id,
        oldPrice: oldPrice,
        newPrice: newPrice,
        oldSalePrice: oldSale,
        newSalePrice: newSale,
        changeType,
        dropPercent: newEffective < oldEffective ? calculateDropPercent(oldEffective, newEffective) : null,
        changedBy,
      });
    }

    // Detect actual price drop
    if (newEffective >= oldEffective) {
      return { detected: false, reason: "no_price_drop" };
    }

    const dropAmount = Math.round((oldEffective - newEffective) * 100) / 100;
    const dropPercent = calculateDropPercent(oldEffective, newEffective);

    // Not eligible if too small
    if (!isEligibleDrop(oldEffective, newEffective)) {
      return { detected: true, notified: false, reason: "below_threshold", dropAmount, dropPercent };
    }

    // Gather eligible user IDs: wishlist first, then cart (dedup)
    const wishlistUserIds = await getWishlistUserIds(product.id);
    const cartUserIds = await getCartUserIds(product.id);
    const allUserIds = [...new Set([...wishlistUserIds, ...cartUserIds])];

    const inStock = Number(product.stock_quantity) > 0;
    const title = pickTitle(dropPercent);
    const message = inStock
      ? `${product.name} is now ₹${newEffective.toLocaleString("en-IN")}.`
      : `${product.name} is now ₹${newEffective.toLocaleString("en-IN")}, but it's currently out of stock.`;

    // Create notifications (bulk, dedup via event_key per user+product+effective price)
    let notificationsCreated = 0;
    for (const userId of allUserIds) {
      try {
        const result = await createNotification({
          userId,
          type: NOTIFICATION_TYPES.PRICE_DROP,
          title,
          message,
          data: {
            productId: product.id,
            productName: product.name,
            oldPrice: oldEffective,
            newPrice: newEffective,
            dropAmount,
            dropPercent,
            inStock,
          },
          actionUrl: `/product/${product.id}`,
          eventKey: `PRICE_DROP:${product.id}:${newEffective}`,
          priority: "HIGH",
          entityType: "product",
          entityId: product.id,
        });
        if (result) notificationsCreated++;
      } catch (e) {
        console.warn("[PRICE DROP] notify user failed:", userId, e.message);
      }
    }

    // Admin activity: log the price-drop event (info, not spamming admin notifications)
    await createActivity({
      activityType: PRICE_DROPPED,
      entityType: "product",
      entityId: product.id,
      metadata: {
        productId: product.id,
        productName: product.name,
        oldPrice: oldEffective,
        newPrice: newEffective,
        dropAmount,
        dropPercentage: dropPercent,
        wishlistCustomers: wishlistUserIds.length,
        cartCustomers: cartUserIds.length,
        notifiedCustomers: notificationsCreated,
        changedBy: changedBy || "admin",
      },
      priority: "HIGH",
      isActionable: false,
      eventKey: `PRICE_DROPPED:${product.id}:${newEffective}`,
    });

    return {
      detected: true,
      notified: notificationsCreated > 0,
      oldPrice: oldEffective,
      newPrice: newEffective,
      dropAmount,
      dropPercent,
      wishlistCustomers: wishlistUserIds.length,
      cartCustomers: cartUserIds.length,
      notificationsCreated,
    };
  } catch (error) {
    console.error("[PRICE DROP] processPriceDrop error:", error.message);
    return { detected: false, reason: "error", error: error.message };
  }
};

/**
 * Get price-drop analytics for the admin dashboard.
 */
const getPriceDropAnalytics = async ({ days = 30 } = {}) => {
  const rows = await query(
    `SELECT
       product_id,
       COUNT(*) AS drop_events,
       MAX(drop_percentage) AS max_drop_percent,
       SUM(CASE WHEN drop_percentage >= 10 THEN 1 ELSE 0 END) AS significant_drops
     FROM product_price_history
     WHERE change_type IN ('PRICE_DECREASE','SALE_PRICE_CREATED','SALE_PRICE_UPDATED')
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY product_id
     ORDER BY drop_events DESC`,
    [Math.min(90, Math.max(1, Number(days) || 30))]
  );
  const total = await query(
    `SELECT
       COUNT(DISTINCT product_id) AS products_dropped,
       COUNT(*) AS total_drop_events,
       COALESCE(SUM(CASE WHEN drop_percentage >= 10 THEN 1 ELSE 0 END), 0) AS significant_drops
     FROM product_price_history
     WHERE change_type IN ('PRICE_DECREASE','SALE_PRICE_CREATED','SALE_PRICE_UPDATED')
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [Math.min(90, Math.max(1, Number(days) || 30))]
  );
  const totalRow = total[0] || {};
  return {
    days: Number(days) || 30,
    summary: {
      products_dropped: Number(totalRow.products_dropped || 0),
      total_drop_events: Number(totalRow.total_drop_events || 0),
      significant_drops: Number(totalRow.significant_drops || 0),
    },
    products: rows,
  };
};

module.exports = {
  PRICE_DROPPED,
  PRICE_DROP_MIN_PERCENT,
  PRICE_DROP_MIN_AMOUNT,
  toMoney,
  getEffectivePrice,
  calculateDropPercent,
  isEligibleDrop,
  recordPriceHistory,
  getPriceHistory,
  getWishlistUserIds,
  getCartUserIds,
  processPriceDrop: processPriceDropAfterUpdate,
  getPriceDropAnalytics,
};
