const { query } = require("../config/db");

const ACTIVITY_TYPES = Object.freeze({
  USER_REGISTERED: "USER_REGISTERED",
  USER_LOGIN: "USER_LOGIN",
  PRODUCT_VIEWED: "PRODUCT_VIEWED",
  PRODUCT_SEARCHED: "PRODUCT_SEARCHED",
  ZERO_RESULT_SEARCH: "ZERO_RESULT_SEARCH",
  WISHLIST_ADDED: "WISHLIST_ADDED",
  WISHLIST_REMOVED: "WISHLIST_REMOVED",
  CART_ITEM_ADDED: "CART_ITEM_ADDED",
  CART_ITEM_REMOVED: "CART_ITEM_REMOVED",
  CART_ABANDONED: "CART_ABANDONED",
  PRODUCT_COMPARE: "PRODUCT_COMPARE",
  CHECKOUT_STARTED: "CHECKOUT_STARTED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  REVIEW_SUBMITTED: "REVIEW_SUBMITTED",
  REVIEW_LOW_RATING: "REVIEW_LOW_RATING",
  REVIEW_PENDING: "REVIEW_PENDING",
  ADDRESS_ADDED: "ADDRESS_ADDED",
  SMART_HOME_REQUEST_CREATED: "SMART_HOME_REQUEST_CREATED",
  SMART_HOME_REQUEST_UPDATED: "SMART_HOME_REQUEST_UPDATED",
  OFFER_VIEWED: "OFFER_VIEWED",
  OFFER_USED: "OFFER_USED",
  HIGH_PRODUCT_INTEREST: "HIGH_PRODUCT_INTEREST",
  PRODUCT_DEMAND: "PRODUCT_DEMAND",
  LOW_STOCK_DEMAND: "LOW_STOCK_DEMAND",
  PRICE_DROPPED: "PRICE_DROPPED",
  BACK_IN_STOCK: "BACK_IN_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  DEMAND_EXCEEDS_RESTOCK: "DEMAND_EXCEEDS_RESTOCK",
  RESTOCK_BELOW_DEMAND: "RESTOCK_BELOW_DEMAND",
  POST_RESTOCK_PURCHASE: "POST_RESTOCK_PURCHASE",
});

const PRIORITY = Object.freeze({
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

// Map activity types to their default priority and whether they're actionable
const ACTIVITY_CONFIG = Object.freeze({
  USER_REGISTERED: { priority: PRIORITY.HIGH, actionable: true },
  USER_LOGIN: { priority: PRIORITY.LOW, actionable: false },
  PRODUCT_VIEWED: { priority: PRIORITY.LOW, actionable: false },
  PRODUCT_SEARCHED: { priority: PRIORITY.LOW, actionable: false },
  ZERO_RESULT_SEARCH: { priority: PRIORITY.HIGH, actionable: true },
  WISHLIST_ADDED: { priority: PRIORITY.NORMAL, actionable: true },
  WISHLIST_REMOVED: { priority: PRIORITY.LOW, actionable: false },
  CART_ITEM_ADDED: { priority: PRIORITY.NORMAL, actionable: true },
  CART_ITEM_REMOVED: { priority: PRIORITY.LOW, actionable: false },
  CART_ABANDONED: { priority: PRIORITY.HIGH, actionable: true },
  PRODUCT_COMPARE: { priority: PRIORITY.NORMAL, actionable: false },
  CHECKOUT_STARTED: { priority: PRIORITY.LOW, actionable: false },
  PAYMENT_SUCCESS: { priority: PRIORITY.HIGH, actionable: true },
  PAYMENT_FAILED: { priority: PRIORITY.HIGH, actionable: true },
  ORDER_CREATED: { priority: PRIORITY.HIGH, actionable: true },
  ORDER_CANCELLED: { priority: PRIORITY.NORMAL, actionable: true },
  REVIEW_SUBMITTED: { priority: PRIORITY.NORMAL, actionable: true },
  REVIEW_LOW_RATING: { priority: PRIORITY.HIGH, actionable: true },
  REVIEW_PENDING: { priority: PRIORITY.HIGH, actionable: true },
  ADDRESS_ADDED: { priority: PRIORITY.LOW, actionable: false },
  SMART_HOME_REQUEST_CREATED: { priority: PRIORITY.HIGH, actionable: true },
  SMART_HOME_REQUEST_UPDATED: { priority: PRIORITY.NORMAL, actionable: true },
  OFFER_VIEWED: { priority: PRIORITY.LOW, actionable: false },
  OFFER_USED: { priority: PRIORITY.NORMAL, actionable: false },
  HIGH_PRODUCT_INTEREST: { priority: PRIORITY.HIGH, actionable: true },
  PRODUCT_DEMAND: { priority: PRIORITY.HIGH, actionable: true },
  LOW_STOCK_DEMAND: { priority: PRIORITY.HIGH, actionable: true },
  PRICE_DROPPED: { priority: PRIORITY.HIGH, actionable: false },
  BACK_IN_STOCK: { priority: PRIORITY.HIGH, actionable: false },
  OUT_OF_STOCK: { priority: PRIORITY.NORMAL, actionable: true },
  DEMAND_EXCEEDS_RESTOCK: { priority: PRIORITY.CRITICAL, actionable: true },
  RESTOCK_BELOW_DEMAND: { priority: PRIORITY.HIGH, actionable: true },
  POST_RESTOCK_PURCHASE: { priority: PRIORITY.NORMAL, actionable: false },
});

// Map activity types to their display category
const ACTIVITY_CATEGORY = {
  USER_REGISTERED: "customers",
  USER_LOGIN: "customers",
  PRODUCT_VIEWED: "products",
  PRODUCT_SEARCHED: "search",
  ZERO_RESULT_SEARCH: "search",
  WISHLIST_ADDED: "wishlist",
  WISHLIST_REMOVED: "wishlist",
  CART_ITEM_ADDED: "cart",
  CART_ITEM_REMOVED: "cart",
  CART_ABANDONED: "cart",
  PRODUCT_COMPARE: "products",
  CHECKOUT_STARTED: "orders",
  PAYMENT_SUCCESS: "orders",
  PAYMENT_FAILED: "orders",
  ORDER_CREATED: "orders",
  ORDER_CANCELLED: "orders",
  REVIEW_SUBMITTED: "reviews",
  REVIEW_LOW_RATING: "reviews",
  REVIEW_PENDING: "reviews",
  ADDRESS_ADDED: "customers",
  SMART_HOME_REQUEST_CREATED: "smart_home",
  SMART_HOME_REQUEST_UPDATED: "smart_home",
  OFFER_VIEWED: "offers",
  OFFER_USED: "offers",
  HIGH_PRODUCT_INTEREST: "products",
  PRODUCT_DEMAND: "products",
  LOW_STOCK_DEMAND: "products",
  PRICE_DROPPED: "products",
  BACK_IN_STOCK: "inventory",
  OUT_OF_STOCK: "inventory",
  DEMAND_EXCEEDS_RESTOCK: "inventory",
  RESTOCK_BELOW_DEMAND: "inventory",
  POST_RESTOCK_PURCHASE: "inventory",
};

/**
 * Create an admin activity log entry.
 * Uses event_key for deduplication where appropriate.
 * Non-critical: failures are logged but don't break the main operation.
 */
const createActivity = async ({ userId = null, activityType, entityType = null, entityId = null, metadata = {}, priority = null, isActionable = null, eventKey = null }) => {
  if (!activityType) return null;
  const config = ACTIVITY_CONFIG[activityType] || { priority: PRIORITY.LOW, actionable: false };
  const finalPriority = priority || config.priority;
  const finalActionable = isActionable !== null ? isActionable : config.actionable;

  try {
    const result = await query(
      `INSERT INTO admin_activity_logs (user_id, activity_type, entity_type, entity_id, metadata, priority, is_actionable, event_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [userId, activityType, entityType, entityId, JSON.stringify(metadata), finalPriority, finalActionable ? 1 : 0, eventKey],
    );
    const [row] = await query("SELECT * FROM admin_activity_logs WHERE id = ?", [result.insertId]);
    return row || null;
  } catch (error) {
    console.warn(`[ADMIN ACTIVITY] Failed to create ${activityType}:`, error.message);
    return null;
  }
};

/**
 * Get activities with filters, search, pagination, and date range.
 */
const getActivities = async ({ page = 1, limit = 30, type = "", category = "", priority = "", unread = "", search = "", dateRange = "", from = "", to = "" } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const filters = ["1=1"];
  const params = [];

  if (type) {
    if (type === "ORDERS") {
      filters.push("activity_type LIKE ?");
      params.push("ORDER_%");
    } else if (type === "PAYMENTS") {
      filters.push("activity_type LIKE ?");
      params.push("PAYMENT_%");
    } else {
      filters.push("activity_type = ?");
      params.push(type);
    }
  }

  if (category) {
    const types = Object.entries(ACTIVITY_CATEGORY)
      .filter(([, cat]) => cat === category)
      .map(([type]) => type);
    if (types.length) {
      filters.push(`activity_type IN (${types.map(() => "?").join(",")})`);
      params.push(...types);
    }
  }

  if (priority) {
    filters.push("priority = ?");
    params.push(priority);
  }

  if (unread === "1" || unread === "true") {
    filters.push("is_actionable = 1 AND is_read = 0");
  }

  if (search) {
    filters.push("(metadata LIKE ? OR activity_type LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (dateRange) {
    const now = new Date();
    let startDate;
    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        y.setHours(0, 0, 0, 0);
        startDate = y;
        break;
      }
      case "7days": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d;
        break;
      }
      case "30days": {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        startDate = d;
        break;
      }
      default:
        startDate = null;
    }
    if (startDate) {
      filters.push("created_at >= ?");
      params.push(startDate.toISOString().slice(0, 19).replace("T", " "));
    }
  }

  if (from) {
    filters.push("created_at >= ?");
    params.push(from);
  }
  if (to) {
    filters.push("created_at <= ?");
    params.push(to);
  }

  const where = filters.join(" AND ");
  const offset = (safePage - 1) * safeLimit;

  const [[count], rows] = await Promise.all([
    query(`SELECT COUNT(*) AS count FROM admin_activity_logs WHERE ${where}`, params),
    query(
      `SELECT a.*, 
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.username, 'Guest') AS customer_name,
              u.email AS customer_email
       FROM admin_activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset],
    ),
  ]);

  return {
    activities: rows.map((row) => ({
      ...row,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata || "{}") : row.metadata,
      category: ACTIVITY_CATEGORY[row.activity_type] || "system",
    })),
    pagination: {
      total: Number(count.count),
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(Number(count.count) / safeLimit),
    },
  };
};

/**
 * Get unread actionable count for the bell badge.
 */
const unreadCount = async () => {
  const [row] = await query(
    "SELECT COUNT(*) AS count FROM admin_activity_logs WHERE is_actionable = 1 AND is_read = 0"
  );
  return Number(row?.count || 0);
};

const markRead = async (id) =>
  query("UPDATE admin_activity_logs SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ?", [id]);

const markAllRead = async () => {
  await query(
    "UPDATE admin_activity_logs SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE is_actionable = 1 AND is_read = 0"
  );
  return unreadCount();
};

const remove = (id) => query("DELETE FROM admin_activity_logs WHERE id = ?", [id]);

/**
 * Get recent activities for the bell dropdown (compact).
 */
const getRecent = async (limit = 10) => {
  const rows = await query(
    `SELECT a.*, 
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.username, 'Anonymous') AS name
     FROM admin_activity_logs a
     LEFT JOIN users u ON a.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE a.is_actionable = 1
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ?`,
    [Math.min(20, Math.max(1, Number(limit) || 10))],
  );
  return rows.map((row) => ({
    ...row,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata || "{}") : row.metadata,
    category: ACTIVITY_CATEGORY[row.activity_type] || "system",
  }));
};

/**
 * Get customer activity timeline for a specific user.
 */
const getCustomerActivity = async (userId, { page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const offset = (safePage - 1) * safeLimit;

  const [[count], rows] = await Promise.all([
    query("SELECT COUNT(*) AS count FROM admin_activity_logs WHERE user_id = ?", [userId]),
    query(
      `SELECT a.*, 
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.username, 'Anonymous') AS name
       FROM admin_activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [userId, safeLimit, offset],
    ),
  ]);

  return {
    activities: rows.map((row) => ({
      ...row,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata || "{}") : row.metadata,
      category: ACTIVITY_CATEGORY[row.activity_type] || "system",
    })),
    pagination: {
      total: Number(count.count),
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(Number(count.count) / safeLimit),
    },
  };
};

/**
 * Get product activity summary for a specific product.
 */
const getProductActivity = async (productId, { page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const offset = (safePage - 1) * safeLimit;

  // Get summary counts
  const [summary] = await query(
    `SELECT 
       SUM(CASE WHEN activity_type = 'PRODUCT_VIEWED' THEN 1 ELSE 0 END) AS views,
       SUM(CASE WHEN activity_type = 'WISHLIST_ADDED' THEN 1 ELSE 0 END) AS wishlist_adds,
       SUM(CASE WHEN activity_type = 'CART_ITEM_ADDED' THEN 1 ELSE 0 END) AS cart_adds,
       SUM(CASE WHEN activity_type = 'PRODUCT_COMPARE' THEN 1 ELSE 0 END) AS compares,
       SUM(CASE WHEN activity_type = 'ORDER_CREATED' THEN 1 ELSE 0 END) AS orders,
       SUM(CASE WHEN activity_type = 'REVIEW_SUBMITTED' THEN 1 ELSE 0 END) AS reviews
     FROM admin_activity_logs
     WHERE entity_type = 'product' AND entity_id = ?`,
    [productId],
  );

  const [[count], rows] = await Promise.all([
    query(
      "SELECT COUNT(*) AS count FROM admin_activity_logs WHERE entity_type = 'product' AND entity_id = ?",
      [productId],
    ),
    query(
      `SELECT a.*, 
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), u.username, 'Anonymous') AS name
       FROM admin_activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE a.entity_type = 'product' AND a.entity_id = ?
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [productId, safeLimit, offset],
    ),
  ]);

  return {
    summary: {
      views: Number(summary?.views || 0),
      wishlist_adds: Number(summary?.wishlist_adds || 0),
      cart_adds: Number(summary?.cart_adds || 0),
      compares: Number(summary?.compares || 0),
      orders: Number(summary?.orders || 0),
      reviews: Number(summary?.reviews || 0),
    },
    activities: rows.map((row) => ({
      ...row,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata || "{}") : row.metadata,
      category: ACTIVITY_CATEGORY[row.activity_type] || "system",
    })),
    pagination: {
      total: Number(count.count),
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(Number(count.count) / safeLimit),
    },
  };
};

/**
 * Get dashboard summary counts for the admin dashboard widget.
 */
const getDashboardSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 19).replace("T", " ");

  const [row] = await query(
    `SELECT
      SUM(CASE WHEN activity_type = 'USER_REGISTERED' AND created_at >= ? THEN 1 ELSE 0 END) AS new_customers,
      SUM(CASE WHEN activity_type = 'ORDER_CREATED' AND created_at >= ? THEN 1 ELSE 0 END) AS new_orders,
      SUM(CASE WHEN activity_type = 'WISHLIST_ADDED' AND created_at >= ? THEN 1 ELSE 0 END) AS wishlist_adds,
      SUM(CASE WHEN activity_type = 'CART_ITEM_ADDED' AND created_at >= ? THEN 1 ELSE 0 END) AS cart_adds,
      SUM(CASE WHEN activity_type = 'REVIEW_SUBMITTED' AND created_at >= ? THEN 1 ELSE 0 END) AS new_reviews,
      SUM(CASE WHEN activity_type = 'CART_ABANDONED' AND created_at >= ? THEN 1 ELSE 0 END) AS abandoned_carts,
      SUM(CASE WHEN activity_type = 'SMART_HOME_REQUEST_CREATED' AND created_at >= ? THEN 1 ELSE 0 END) AS smart_home_requests,
      SUM(CASE WHEN activity_type = 'REVIEW_LOW_RATING' AND created_at >= ? THEN 1 ELSE 0 END) AS low_rating_reviews,
      SUM(CASE WHEN activity_type = 'PAYMENT_FAILED' AND created_at >= ? THEN 1 ELSE 0 END) AS payment_failures
     FROM admin_activity_logs`,
    [todayStr, todayStr, todayStr, todayStr, todayStr, todayStr, todayStr, todayStr, todayStr],
  );

  return {
    new_customers: Number(row?.new_customers || 0),
    new_orders: Number(row?.new_orders || 0),
    wishlist_adds: Number(row?.wishlist_adds || 0),
    cart_adds: Number(row?.cart_adds || 0),
    new_reviews: Number(row?.new_reviews || 0),
    abandoned_carts: Number(row?.abandoned_carts || 0),
    smart_home_requests: Number(row?.smart_home_requests || 0),
    low_rating_reviews: Number(row?.low_rating_reviews || 0),
    payment_failures: Number(row?.payment_failures || 0),
  };
};

/**
 * Get "Needs Attention" items - high priority actionable items.
 */
const getNeedsAttention = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 19).replace("T", " ");

  const [row] = await query(
    `SELECT
      SUM(CASE WHEN activity_type = 'REVIEW_LOW_RATING' AND created_at >= ? THEN 1 ELSE 0 END) AS low_rating_reviews,
      SUM(CASE WHEN activity_type = 'PAYMENT_FAILED' AND created_at >= ? THEN 1 ELSE 0 END) AS payment_failures,
      SUM(CASE WHEN activity_type = 'CART_ABANDONED' AND created_at >= ? THEN 1 ELSE 0 END) AS abandoned_carts,
      SUM(CASE WHEN activity_type = 'SMART_HOME_REQUEST_CREATED' AND created_at >= ? THEN 1 ELSE 0 END) AS smart_home_requests,
      SUM(CASE WHEN activity_type = 'LOW_STOCK_DEMAND' AND created_at >= ? THEN 1 ELSE 0 END) AS low_stock_demand
     FROM admin_activity_logs`,
    [todayStr, todayStr, todayStr, todayStr, todayStr],
  );

  return {
    low_rating_reviews: Number(row?.low_rating_reviews || 0),
    payment_failures: Number(row?.payment_failures || 0),
    abandoned_carts: Number(row?.abandoned_carts || 0),
    smart_home_requests: Number(row?.smart_home_requests || 0),
    low_stock_demand: Number(row?.low_stock_demand || 0),
  };
};

/**
 * Smart aggregation: detect high product interest for a user.
 * If a user views the same product 4+ times, or views + wishlists + carts, create HIGH_PRODUCT_INTEREST.
 */
const detectHighProductInterest = async (userId, productId) => {
  if (!userId || !productId) return null;

  const [stats] = await query(
    `SELECT
      SUM(CASE WHEN activity_type = 'PRODUCT_VIEWED' THEN 1 ELSE 0 END) AS views,
      SUM(CASE WHEN activity_type = 'WISHLIST_ADDED' THEN 1 ELSE 0 END) AS wishlist_adds,
      SUM(CASE WHEN activity_type = 'CART_ITEM_ADDED' THEN 1 ELSE 0 END) AS cart_adds,
      SUM(CASE WHEN activity_type = 'PRODUCT_COMPARE' THEN 1 ELSE 0 END) AS compares
     FROM admin_activity_logs
     WHERE user_id = ? AND entity_type = 'product' AND entity_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [userId, productId],
  );

  const views = Number(stats?.views || 0);
  const wishlistAdds = Number(stats?.wishlist_adds || 0);
  const cartAdds = Number(stats?.cart_adds || 0);
  const compares = Number(stats?.compares || 0);

  // High interest: 4+ views, or 2+ views + wishlist/cart/compare
  if (views >= 4 || (views >= 2 && (wishlistAdds > 0 || cartAdds > 0 || compares > 0))) {
    const [product] = await query("SELECT id, name FROM products WHERE id = ?", [productId]);
    if (product) {
      return createActivity({
        userId,
        activityType: ACTIVITY_TYPES.HIGH_PRODUCT_INTEREST,
        entityType: "product",
        entityId: productId,
        metadata: {
          productId,
          productName: product.name,
          views,
          wishlistAdds,
          cartAdds,
          compares,
        },
        eventKey: `HIGH_INTEREST:${userId}:${productId}:${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }
  return null;
};

/**
 * Detect product demand spike - if a product has unusually high activity today.
 */
const detectProductDemand = async (productId) => {
  if (!productId) return null;

  const [stats] = await query(
    `SELECT
      SUM(CASE WHEN activity_type = 'PRODUCT_VIEWED' THEN 1 ELSE 0 END) AS views,
      SUM(CASE WHEN activity_type = 'WISHLIST_ADDED' THEN 1 ELSE 0 END) AS wishlist_adds,
      SUM(CASE WHEN activity_type = 'CART_ITEM_ADDED' THEN 1 ELSE 0 END) AS cart_adds,
      SUM(CASE WHEN activity_type = 'PRODUCT_COMPARE' THEN 1 ELSE 0 END) AS compares
     FROM admin_activity_logs
     WHERE entity_type = 'product' AND entity_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [productId],
  );

  const views = Number(stats?.views || 0);
  const wishlistAdds = Number(stats?.wishlist_adds || 0);
  const cartAdds = Number(stats?.cart_adds || 0);
  const compares = Number(stats?.compares || 0);

  // Demand spike: 10+ views OR 5+ wishlist/cart/compare combined
  if (views >= 10 || (wishlistAdds + cartAdds + compares) >= 5) {
    const [product] = await query("SELECT id, name, stock_quantity, low_stock_limit FROM products WHERE id = ?", [productId]);
    if (product) {
      const lowStock = Number(product.stock_quantity) <= Number(product.low_stock_limit || 5);
      const activityType = lowStock ? ACTIVITY_TYPES.LOW_STOCK_DEMAND : ACTIVITY_TYPES.PRODUCT_DEMAND;
      return createActivity({
        activityType,
        entityType: "product",
        entityId: productId,
        metadata: {
          productId,
          productName: product.name,
          views,
          wishlistAdds,
          cartAdds,
          compares,
          stockQuantity: product.stock_quantity,
          lowStock,
        },
        eventKey: `${activityType}:${productId}:${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }
  return null;
};

/**
 * Detect zero-result search opportunity.
 * If a search term has been searched 5+ times with no results, create ZERO_RESULT_SEARCH.
 */
const detectZeroResultSearch = async (searchTerm) => {
  if (!searchTerm) return null;

  const [count] = await query(
    `SELECT COUNT(*) AS count FROM admin_activity_logs
     WHERE activity_type = 'PRODUCT_SEARCHED'
       AND metadata LIKE ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [`%"query":"${searchTerm}"%`],
  );

  if (Number(count?.count || 0) >= 5) {
    return createActivity({
      activityType: ACTIVITY_TYPES.ZERO_RESULT_SEARCH,
      entityType: "search",
      metadata: {
        query: searchTerm,
        count: Number(count.count),
      },
      eventKey: `ZERO_SEARCH:${searchTerm.toLowerCase()}:${new Date().toISOString().slice(0, 10)}`,
    });
  }
  return null;
};

/**
 * Detect abandoned carts - carts with items but no order in the last 30 minutes.
 * Deduplicated by event_key per day.
 */
const detectAbandonedCarts = async () => {
  const rows = await query(
    `SELECT c.user_id, c.id AS cart_id,
            COUNT(ci.id) AS item_count,
            SUM(p.price * ci.quantity) AS cart_value,
            MAX(ci.updated_at) AS last_activity
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.updated_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       AND ci.updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = c.user_id AND o.created_at > ci.updated_at)
     GROUP BY c.user_id, c.id
     HAVING item_count > 0`,
  );

  let created = 0;
  if (!Array.isArray(rows)) {
    console.warn("[ACTIVITY] Abandoned cart detection: invalid rows returned");
    return 0;
  }
  for (const cart of rows) {
    const [user] = await query("SELECT id, email FROM users WHERE id = ?", [cart.user_id]);
    if (!user) continue;

    const products = await query(
      `SELECT p.id, p.name, p.image_url, ci.quantity
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?
       LIMIT 3`,
      [cart.cart_id],
    );

    const result = await createActivity({
      userId: cart.user_id,
      activityType: ACTIVITY_TYPES.CART_ABANDONED,
      entityType: "cart",
      entityId: cart.cart_id,
      metadata: {
        cartId: cart.cart_id,
        itemCount: Number(cart.item_count),
        cartValue: Number(cart.cart_value || 0),
        lastActivity: cart.last_activity,
        products: products.map((p) => ({ id: p.id, name: p.name, imageUrl: p.image_url, quantity: p.quantity })),
      },
      eventKey: `CART_ABANDONED:${cart.user_id}:${new Date().toISOString().slice(0, 10)}`,
    });
    if (result) created++;
  }
  return created;
};

module.exports = {
  ACTIVITY_TYPES,
  PRIORITY,
  ACTIVITY_CONFIG,
  ACTIVITY_CATEGORY,
  createActivity,
  getActivities,
  getRecent,
  unreadCount,
  markRead,
  markAllRead,
  remove,
  getCustomerActivity,
  getProductActivity,
  getDashboardSummary,
  getNeedsAttention,
  detectHighProductInterest,
  detectProductDemand,
  detectZeroResultSearch,
  detectAbandonedCarts,
};