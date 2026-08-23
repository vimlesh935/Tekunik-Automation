const { query } = require("../config/db");
const { NOTIFICATION_TYPES } = require("./notificationService");
const {
  ACTIVITY_TYPES,
  createActivity,
} = require("./adminActivityService");
const {
  getEffectivePrice,
  calculateDropPercent,
  isEligibleDrop,
} = require("./priceDropService");

// ─── CONFIG ─────────────────────────────────────────────────────────
const ALERT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  NOTIFIED: "NOTIFIED",
  CANCELLED: "CANCELLED",
});

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatINR = (value) =>
  `₹${toMoney(value).toLocaleString("en-IN")}`;

/**
 * Subscribe a customer to back-in-stock alerts for a product.
 * Idempotent: re-activates CANCELLED/NOTIFIED alerts instead of duplicating.
 * Only allowed while the product is actually unavailable (stock <= 0).
 */
const subscribeAlert = async ({ userId, productId, variantId = null }) => {
  if (!userId || !productId) {
    return { success: false, reason: "missing_params" };
  }

  const [product] = await query(
    "SELECT id, name, stock_quantity FROM products WHERE id = ?",
    [productId],
  );
  if (!product) return { success: false, reason: "product_not_found" };

  if (Number(product.stock_quantity) > 0) {
    return { success: false, reason: "already_in_stock" };
  }

  const [existing] = await query(
    "SELECT id, status FROM back_in_stock_alerts WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );

  if (existing) {
    if (existing.status === ALERT_STATUS.ACTIVE) {
      return { success: true, alreadyActive: true };
    }
    await query(
      "UPDATE back_in_stock_alerts SET status = 'ACTIVE', notified_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [existing.id],
    );
    return { success: true, reactivated: true };
  }

  await query(
    "INSERT INTO back_in_stock_alerts (user_id, product_id, variant_id, status) VALUES (?, ?, ?, 'ACTIVE')",
    [userId, productId, variantId],
  );
  return { success: true, created: true };
};

/**
 * Cancel a customer's back-in-stock alert.
 * Cancelled alerts must never receive notifications.
 */
const cancelAlert = async ({ userId, productId }) => {
  if (!userId || !productId) return { success: false, reason: "missing_params" };
  const result = await query(
    "UPDATE back_in_stock_alerts SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ? AND status != 'CANCELLED'",
    [userId, productId],
  );
  return { success: true, cancelled: result.affectedRows > 0 };
};

/** Get a customer's alert state for a product. */
const getAlertStatus = async ({ userId, productId }) => {
  if (!userId || !productId) return null;
  const [row] = await query(
    "SELECT id, status, created_at, notified_at FROM back_in_stock_alerts WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );
  return row || null;
};

/** Get all of a customer's alerts (for account/dashboard views). */
const getMyAlerts = async (userId) => {
  return query(
    `SELECT a.id, a.product_id, a.status, a.created_at, a.notified_at,
            p.name AS product_name, p.image_url, p.price, p.sale_price,
            p.stock_quantity, p.stock_status
     FROM back_in_stock_alerts a
     LEFT JOIN products p ON p.id = a.product_id
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`,
    [userId],
  );
};

/** Count active waiting customers for one product. */
const getWaitingCount = async (productId) => {
  const [row] = await query(
    "SELECT COUNT(*) AS count FROM back_in_stock_alerts WHERE product_id = ? AND status = 'ACTIVE'",
    [productId],
  );
  return Number(row?.count || 0);
};

/** Waiting counts for many products at once (admin product cards). */
const getWaitingCounts = async (productIds = []) => {
  const ids = [...new Set((productIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return {};
  const placeholders = ids.map(() => "?").join(",");
  const rows = await query(
    `SELECT product_id, COUNT(*) AS count
     FROM back_in_stock_alerts
     WHERE status = 'ACTIVE' AND product_id IN (${placeholders})
     GROUP BY product_id`,
    ids,
  );
  const map = {};
  for (const row of rows) map[Number(row.product_id)] = Number(row.count);
  return map;
};

/** Admin: list customers waiting for a product (no sensitive data exposed). */
const getWaitingCustomers = async (productId, { page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const offset = (safePage - 1) * safeLimit;

  const [[count], rows] = await Promise.all([
    query(
      `SELECT COUNT(*) AS count
       FROM back_in_stock_alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.product_id = ? AND a.status = 'ACTIVE'`,
      [productId],
    ),
    query(
      `SELECT a.id, a.user_id, a.status, a.created_at, a.notified_at,
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.username, u.email) AS customer_name,
              u.email AS customer_email
       FROM back_in_stock_alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE a.product_id = ? AND a.status = 'ACTIVE'
       ORDER BY a.created_at ASC
       LIMIT ? OFFSET ?`,
      [productId, safeLimit, offset],
    ),
  ]);

  return {
    customers: rows,
    pagination: {
      total: Number(count?.count || 0),
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(Number(count?.count || 0) / safeLimit),
    },
  };
};

/**
 * Efficiently bulk-insert customer notifications.
 * Uses multi-row INSERT with ON DUPLICATE KEY UPDATE for dedup safety
 * (notifications has UNIQUE(user_id, event_key)).
 */
const insertBulkNotifications = async (rows) => {
  const CHUNK_SIZE = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const placeholders = [];
    const params = [];
    for (const row of chunk) {
      placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      params.push(
        row.userId,
        row.type,
        row.title,
        row.message,
        JSON.stringify(row.data || {}),
        row.actionUrl || null,
        row.eventKey || null,
        row.priority || "NORMAL",
        row.entityType || null,
        row.entityId || null,
      );
    }
    try {
      await query(
        `INSERT INTO notifications
          (user_id, type, title, message, data, action_url, event_key, priority, entity_type, entity_id)
         VALUES ${placeholders.join(", ")}
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
        params,
      );
      inserted += chunk.length;
    } catch (error) {
      console.warn("[BACK IN STOCK] Bulk notification chunk failed:", error.message);
    }
  }
  return inserted;
};

/**
 * Detect whether this same update also caused a qualifying price drop
 * (effective-price comparison, same rules as the Price Drop system).
 */
const detectQualifyingPriceDrop = (oldProduct, newProduct) => {
  const oldEffective = getEffectivePrice(oldProduct);
  const newEffective = getEffectivePrice(newProduct);
  if (!oldEffective || !newEffective || newEffective >= oldEffective) return null;
  if (!isEligibleDrop(oldEffective, newEffective)) return null;
  return {
    oldPrice: oldEffective,
    newPrice: newEffective,
    dropAmount: Math.round((oldEffective - newEffective) * 100) / 100,
    dropPercent: calculateDropPercent(oldEffective, newEffective),
  };
};

/**
 * CORE STOCK TRANSITION PROCESSOR.
 *
 * Called after ANY real inventory change (admin product update, stock update,
 * bulk restock). Reads OLD vs NEW stock from the database and only acts on a
 * genuine transition:
 *   old <= 0 AND new > 0  → BACK_IN_STOCK event
 *   old > 0  AND new === 0 → OUT_OF_STOCK transition (reactivates alerts)
 *   anything else          → no-op (duplicate protection)
 *
 * When the same update also caused a qualifying price drop, eligible
 * customers receive ONE combined "Back in Stock + Price Drop" notification
 * instead of two separate ones.
 *
 * Returns a summary for the API response / admin UI.
 */
const processStockTransition = async ({ product, oldProduct, changedBy = null }) => {
  try {
    if (!product || !oldProduct || !product.id) {
      return { processed: false, reason: "missing_product_data" };
    }

    const oldStock = Number(oldProduct.stock_quantity) || 0;
    const newStock = Number(product.stock_quantity) || 0;

    // ── No meaningful transition → duplicate protection ──
    if (!(oldStock <= 0 && newStock > 0) && !(oldStock > 0 && newStock === 0)) {
      return { processed: false, reason: "no_transition", oldStock, newStock };
    }

    // ── Product went OUT of stock ──
    if (newStock === 0) {
      // Reactivate NOTIFIED alerts so customers are alerted on the NEXT restock
      // cycle too (they never received the product). Cancelled stay cancelled.
      await query(
        "UPDATE back_in_stock_alerts SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND status = 'NOTIFIED'",
        [product.id],
      );
      await createActivity({
        activityType: ACTIVITY_TYPES.OUT_OF_STOCK,
        entityType: "product",
        entityId: product.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          previousStock: oldStock,
          newStock: 0,
        },
        priority: "NORMAL",
        isActionable: false,
        eventKey: `OUT_OF_STOCK:${product.id}:${Date.now()}`,
      });
      return { processed: true, outOfStock: true, oldStock, newStock: 0 };
    }

    // ── Genuine BACK IN STOCK transition (old <= 0, new > 0) ──
    const restockId = Date.now();
    const waitingRows = await query(
      `SELECT a.id, a.user_id
       FROM back_in_stock_alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.product_id = ? AND a.status = 'ACTIVE'
       ORDER BY a.created_at ASC`,
      [product.id],
    );
    const waitingCount = waitingRows.length;

    // Combined price-drop detection (same update)
    const priceDrop = detectQualifyingPriceDrop(oldProduct, product);

    let notificationsCreated = 0;
    let notifiedUserIds = [];

    if (waitingCount > 0) {
      const title = priceDrop
        ? "🔥 Back in Stock + Price Drop"
        : "🎉 Back in Stock!";
      const message = priceDrop
        ? `${product.name} is back in stock at ${formatINR(priceDrop.newPrice)} — down from ${formatINR(priceDrop.oldPrice)}.`
        : `${product.name} is back in stock and ready to order.`;

      const data = {
        productId: product.id,
        productName: product.name,
        newStock,
        ...(priceDrop
          ? {
              oldPrice: priceDrop.oldPrice,
              newPrice: priceDrop.newPrice,
              dropAmount: priceDrop.dropAmount,
              dropPercent: priceDrop.dropPercent,
              combinedWithPriceDrop: true,
            }
          : {}),
      };

      const notificationRows = waitingRows.map((alert) => ({
        userId: alert.user_id,
        type: NOTIFICATION_TYPES.BACK_IN_STOCK,
        title,
        message,
        data,
        actionUrl: `/product/${product.id}`,
        eventKey: `BACK_IN_STOCK:${product.id}:${restockId}`,
        priority: "HIGH",
        entityType: "product",
        entityId: product.id,
      }));

      notificationsCreated = await insertBulkNotifications(notificationRows);
      notifiedUserIds = waitingRows.map((r) => Number(r.user_id));

      // Mark alerts as NOTIFIED (keep records for analytics/history)
      const alertIds = waitingRows.map((r) => r.id);
      const idPlaceholders = alertIds.map(() => "?").join(",");
      await query(
        `UPDATE back_in_stock_alerts SET status = 'NOTIFIED', notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${idPlaceholders})`,
        alertIds,
      );
    }

    // ── Admin Activity: always record the restock event ──
    await createActivity({
      activityType: ACTIVITY_TYPES.BACK_IN_STOCK,
      entityType: "product",
      entityId: product.id,
      metadata: {
        productId: product.id,
        productName: product.name,
        previousStock: oldStock,
        newStock,
        waitingCustomers: waitingCount,
        notificationsCreated,
        ...(priceDrop
          ? {
              combinedWithPriceDrop: true,
              oldPrice: priceDrop.oldPrice,
              newPrice: priceDrop.newPrice,
              dropAmount: priceDrop.dropAmount,
              dropPercent: priceDrop.dropPercent,
            }
          : {}),
        changedBy: changedBy || "admin",
      },
      priority: "HIGH",
      isActionable: false,
      eventKey: `BACK_IN_STOCK:${product.id}:${restockId}`,
    });

    // ── Smart operational alerts ──
    if (waitingCount > newStock) {
      await createActivity({
        activityType: ACTIVITY_TYPES.DEMAND_EXCEEDS_RESTOCK,
        entityType: "product",
        entityId: product.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          waitingCustomers: waitingCount,
          restockedUnits: newStock,
          message: `${waitingCount} customers were waiting, but only ${newStock} units were restocked.`,
        },
        priority: "CRITICAL",
        isActionable: true,
        eventKey: `DEMAND_EXCEEDS_RESTOCK:${product.id}:${restockId}`,
      });
    } else if (
      waitingCount > 0 &&
      product.low_stock_limit !== undefined &&
      product.low_stock_limit !== null &&
      newStock <= Number(product.low_stock_limit)
    ) {
      await createActivity({
        activityType: ACTIVITY_TYPES.RESTOCK_BELOW_DEMAND,
        entityType: "product",
        entityId: product.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          waitingCustomers: waitingCount,
          currentStock: newStock,
          message: `${newStock} units are available, but ${waitingCount} customers were waiting for this product.`,
        },
        priority: "HIGH",
        isActionable: true,
        eventKey: `RESTOCK_BELOW_DEMAND:${product.id}:${restockId}`,
      });
    }

    return {
      processed: true,
      backInStock: true,
      oldStock,
      newStock,
      waitingCustomers: waitingCount,
      notificationsCreated,
      notifiedUserIds,
      priceDrop: priceDrop || null,
      demandExceedsRestock: waitingCount > newStock,
    };
  } catch (error) {
    // Never break the inventory update because notification processing failed.
    console.error("[BACK IN STOCK] processStockTransition error:", error.message);
    return { processed: false, reason: "error", error: error.message };
  }
};

/**
 * Restock demand analytics for a single product (admin).
 */
const getProductRestockAnalytics = async (productId) => {
  const [product] = await query(
    "SELECT id, name, stock_quantity, low_stock_limit FROM products WHERE id = ?",
    [productId],
  );
  if (!product) return null;

  const [alerts] = await query(
    `SELECT
       SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS waiting,
       SUM(CASE WHEN status = 'NOTIFIED' THEN 1 ELSE 0 END) AS notified,
       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
       COUNT(*) AS total
     FROM back_in_stock_alerts WHERE product_id = ?`,
    [productId],
  );

  const [restocks] = await query(
    `SELECT COALESCE(SUM(new_stock - old_stock), 0) AS stock_added
     FROM inventory_logs
     WHERE product_id = ? AND new_stock > old_stock`,
    [productId],
  );

  const [purchases] = await query(
    `SELECT COUNT(*) AS purchases_after_restock
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE oi.product_id = ?
       AND o.created_at >= COALESCE(
         (SELECT MAX(notified_at) FROM back_in_stock_alerts WHERE product_id = ? AND notified_at IS NOT NULL),
         DATE_SUB(NOW(), INTERVAL 30 DAY))
       AND o.status NOT IN ('cancelled')`,
    [productId, productId],
  );

  return {
    product: {
      id: product.id,
      name: product.name,
      currentStock: Number(product.stock_quantity),
      lowStockLimit: product.low_stock_limit,
    },
    waitingCustomers: Number(alerts?.waiting || 0),
    notificationsSent: Number(alerts?.notified || 0),
    cancelledAlerts: Number(alerts?.cancelled || 0),
    totalAlerts: Number(alerts?.total || 0),
    stockAdded: Number(restocks?.stock_added || 0),
    purchasesAfterRestock: Number(purchases?.purchases_after_restock || 0),
  };
};

/**
 * Get user IDs of all ACTIVE subscribers for a product.
 * Used by callers to exclude subscribers from standalone broadcasts
 * (e.g. PRICE_DROP) when a combined notification will be sent instead.
 */
const getActiveSubscriberIds = async (productId) => {
  if (!productId) return [];
  const rows = await query(
    `SELECT a.user_id
     FROM back_in_stock_alerts a
     JOIN users u ON u.id = a.user_id
     WHERE a.product_id = ? AND a.status = 'ACTIVE'`,
    [productId],
  );
  return rows.map((row) => Number(row.user_id));
};

/**
 * Back-in-stock processor used by the admin product-update orchestration.
 * The caller has ALREADY verified a genuine restock transition
 * (oldStock <= 0 AND newStock > 0) and computed any qualifying price drop.
 *
 * - Notifies every ACTIVE subscriber (ONE combined notification when the same
 *   update also caused a qualifying price drop).
 * - Marks alerts NOTIFIED with notified_at.
 * - Records BACK_IN_STOCK admin activity + smart demand alerts.
 */
const processBackInStock = async ({ product, oldStock, newStock, changedBy = null, priceChange = null }) => {
  try {
    if (!product || !product.id) return { processed: false, reason: "missing_product_data" };

    // Duplicate protection: only act on a genuine 0 -> positive transition.
    if (!(Number(oldStock) <= 0 && Number(newStock) > 0)) {
      return { processed: false, reason: "no_transition", oldStock, newStock };
    }

    const restockId = Date.now();
    const waitingRows = await query(
      `SELECT a.id, a.user_id
       FROM back_in_stock_alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.product_id = ? AND a.status = 'ACTIVE'
       ORDER BY a.created_at ASC`,
      [product.id],
    );
    const waitingCount = waitingRows.length;

    let notificationsCreated = 0;
    let notifiedUserIds = [];

    if (waitingCount > 0) {
      const title = priceChange
        ? "🔥 Back in Stock + Price Drop"
        : "🎉 Back in Stock!";
      const message = priceChange
        ? `${product.name} is back in stock at ${formatINR(priceChange.newPrice)} — down from ${formatINR(priceChange.oldPrice)}.`
        : `${product.name} is back in stock and ready to order.`;

      const data = {
        productId: product.id,
        productName: product.name,
        newStock: Number(newStock),
        ...(priceChange
          ? {
              oldPrice: priceChange.oldPrice,
              newPrice: priceChange.newPrice,
              dropAmount: priceChange.dropAmount,
              dropPercent: priceChange.dropPercent,
              combinedWithPriceDrop: true,
            }
          : {}),
      };

      notificationsCreated = await insertBulkNotifications(
        waitingRows.map((alert) => ({
          userId: alert.user_id,
          type: NOTIFICATION_TYPES.BACK_IN_STOCK,
          title,
          message,
          data,
          actionUrl: `/product/${product.id}`,
          eventKey: `BACK_IN_STOCK:${product.id}:${restockId}`,
          priority: "HIGH",
          entityType: "product",
          entityId: product.id,
        })),
      );
      notifiedUserIds = waitingRows.map((r) => Number(r.user_id));

      const alertIds = waitingRows.map((r) => r.id);
      const idPlaceholders = alertIds.map(() => "?").join(",");
      await query(
        `UPDATE back_in_stock_alerts SET status = 'NOTIFIED', notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${idPlaceholders})`,
        alertIds,
      );
    }

    await createActivity({
      activityType: ACTIVITY_TYPES.BACK_IN_STOCK,
      entityType: "product",
      entityId: product.id,
      metadata: {
        productId: product.id,
        productName: product.name,
        previousStock: Number(oldStock),
        newStock: Number(newStock),
        waitingCustomers: waitingCount,
        notificationsCreated,
        ...(priceChange
          ? {
              combinedWithPriceDrop: true,
              oldPrice: priceChange.oldPrice,
              newPrice: priceChange.newPrice,
              dropAmount: priceChange.dropAmount,
              dropPercent: priceChange.dropPercent,
            }
          : {}),
        changedBy: changedBy || "admin",
      },
      priority: "HIGH",
      isActionable: false,
      eventKey: `BACK_IN_STOCK:${product.id}:${restockId}`,
    });

    // Smart operational alerts
    if (waitingCount > Number(newStock)) {
      await createActivity({
        activityType: ACTIVITY_TYPES.DEMAND_EXCEEDS_RESTOCK,
        entityType: "product",
        entityId: product.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          waitingCustomers: waitingCount,
          restockedUnits: Number(newStock),
          message: `${waitingCount} customers were waiting, but only ${Number(newStock)} units were restocked.`,
        },
        priority: "CRITICAL",
        isActionable: true,
        eventKey: `DEMAND_EXCEEDS_RESTOCK:${product.id}:${restockId}`,
      });
    } else if (
      waitingCount > 0 &&
      product.low_stock_limit !== undefined &&
      product.low_stock_limit !== null &&
      Number(newStock) <= Number(product.low_stock_limit)
    ) {
      await createActivity({
        activityType: ACTIVITY_TYPES.RESTOCK_BELOW_DEMAND,
        entityType: "product",
        entityId: product.id,
        metadata: {
          productId: product.id,
          productName: product.name,
          waitingCustomers: waitingCount,
          currentStock: Number(newStock),
          message: `${Number(newStock)} units are available, but ${waitingCount} customers were waiting for this product.`,
        },
        priority: "HIGH",
        isActionable: true,
        eventKey: `RESTOCK_BELOW_DEMAND:${product.id}:${restockId}`,
      });
    }

    return {
      processed: true,
      backInStock: true,
      oldStock: Number(oldStock),
      newStock: Number(newStock),
      waitingCustomers: waitingCount,
      notificationsCreated,
      notifiedUserIds,
      priceDrop: priceChange || null,
      demandExceedsRestock: waitingCount > Number(newStock),
    };
  } catch (error) {
    console.error("[BACK IN STOCK] processBackInStock error:", error.message);
    return { processed: false, reason: "error", error: error.message };
  }
};

module.exports = {
  ALERT_STATUS,
  subscribeAlert,
  cancelAlert,
  getAlertStatus,
  getMyAlerts,
  getWaitingCount,
  getWaitingCounts,
  getWaitingCustomers,
  getActiveSubscriberIds,
  processStockTransition,
  processBackInStock,
  getProductRestockAnalytics,
};
