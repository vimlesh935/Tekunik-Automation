const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

/** Helper: build date WHERE clause for analytics filtering */
function buildDateFilter(range, prefix = "o") {
  if (range === "today") {
    return `AND DATE(${prefix}.created_at) = CURDATE()`;
  } else if (range === "week") {
    return `AND ${prefix}.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
  } else if (range === "month") {
    return `AND MONTH(${prefix}.created_at) = MONTH(CURDATE()) AND YEAR(${prefix}.created_at) = YEAR(CURDATE())`;
  }
  return ""; // "all" or default — no date filter
}

/** GET /api/admin/dashboard/analytics?range=today|week|month|all — Single unified analytics endpoint */
const getUnifiedAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || "all";
  const df = buildDateFilter(range, "o");

  // ── Aggregated counts ──────────────────────────────────────────────
  const [totalOrdersRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE 1=1 ${df}`
  );
  const [deliveredRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'delivered' ${df}`
  );
  const [cancelledRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'cancelled' ${df}`
  );
  const [pendingRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status IN ('pending', 'confirmed', 'processing') ${df}`
  );
  const [outForDeliveryRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'out_for_delivery' ${df}`
  );
  const [revenueRow] = await query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders o WHERE o.status = 'delivered' ${df}`
  );

  // ── Customer count for the period ──────────────────────────────────
  const [customersRow] = await query(
    `SELECT COUNT(DISTINCT o.user_id) AS count FROM orders o WHERE o.user_id IS NOT NULL ${df}`
  );

  // ── Daily revenue (last 14 days, always unfiltered for chart) ──────
  const dailyRevenue = await query(`
    SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    WHERE status = 'delivered'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  // ── Summary (scoped to the selected range) ─────────────────────────
  const [summary] = await query(`
    SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(total_amount), 0) AS total_revenue,
           COALESCE(AVG(total_amount), 0) AS avg_order_value,
           COUNT(DISTINCT DATE(created_at)) AS active_days
    FROM orders o
    WHERE o.status = 'delivered' ${df}
  `);

  // ── Last 30 days (always unfiltered for trend comparison) ──────────
  const [last30DeliveredRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );
  const [last30RevenueRow] = await query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );

  // ── Recent orders (scoped to range) ────────────────────────────────
  const recentOrders = await query(`
    SELECT o.id, o.order_number, o.tracking_number, o.status, o.payment_status,
           o.total_amount, o.created_at,
           COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE 1=1 ${df}
    ORDER BY o.created_at DESC
    LIMIT 8
  `);

  const recentUsers = await query(`
    SELECT u.id, u.email, u.is_verified, u.created_at,
           up.first_name, up.last_name, up.city
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC
    LIMIT 5
  `);

  // ── Top selling products (scoped to range) ─────────────────────────
  const topProducts = await query(`
    SELECT oi.product_id, p.name AS product_name,
           SUM(oi.quantity) AS total_sold,
           SUM(oi.price * oi.quantity) AS total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'delivered' ${df}
    GROUP BY oi.product_id, p.name
    ORDER BY total_sold DESC
    LIMIT 10
  `);

  return success(res, "Analytics fetched", {
    stats: {
      totalOrders: Number(totalOrdersRow.count),
      deliveredOrders: Number(deliveredRow.count),
      cancelledOrders: Number(cancelledRow.count),
      pendingOrders: Number(pendingRow.count),
      outForDelivery: Number(outForDeliveryRow.count),
      revenue: parseFloat(revenueRow.total),
      totalCustomers: Number(customersRow.count),
    },
    summary: {
      total_orders: Number(summary.total_orders),
      total_revenue: parseFloat(summary.total_revenue),
      avg_order_value: parseFloat(summary.avg_order_value),
      active_days: Number(summary.active_days),
    },
    dailyRevenue,
    last30Days: {
      deliveredOrders: Number(last30DeliveredRow.count),
      revenue: parseFloat(last30RevenueRow.total),
    },
    recentOrders,
    recentUsers,
    topProducts,
  });
});

/** GET /api/admin/dashboard/stats — Real counts from MySQL */
const getStats = asyncHandler(async (req, res) => {
  const range = req.query.range || "all";
  const dateFilter = buildDateFilter(range);
  const dateFilterO = buildDateFilter(range, "o");

  const [totalProductsRow] = await query("SELECT COUNT(*) AS count FROM products");
  const [totalCategoriesRow] = await query("SELECT COUNT(*) AS count FROM product_categories");
  const [totalUsersRow] = await query("SELECT COUNT(*) AS count FROM users");
  const [totalOrdersRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE 1=1 ${dateFilterO}`
  );
  const [revenueRow] = await query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders o WHERE o.status = 'delivered' ${dateFilterO}`
  );
  const [pendingOrdersRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'pending' ${dateFilterO}`
  );
  const [lowStockRow] = await query(
    "SELECT COUNT(*) AS count FROM products WHERE stock < 10 AND status = 'active'"
  );

  const recentOrders = await query(`
    SELECT
      o.id, o.order_number, o.tracking_number, o.status, o.payment_status,
      o.total_amount, o.created_at,
      COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE 1=1 ${dateFilterO}
    ORDER BY o.created_at DESC
    LIMIT 8
  `);

  const recentUsers = await query(`
    SELECT u.id, u.email, u.is_verified, u.created_at,
           up.first_name, up.last_name, up.city
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY u.created_at DESC
    LIMIT 5
  `);

  return success(res, "Dashboard stats fetched", {
    stats: {
      totalProducts: Number(totalProductsRow.count),
      totalCategories: Number(totalCategoriesRow.count),
      totalUsers: Number(totalUsersRow.count),
      totalOrders: Number(totalOrdersRow.count),
      revenue: parseFloat(revenueRow.total),
      pendingOrders: Number(pendingOrdersRow.count),
      lowStock: Number(lowStockRow.count),
    },
    recentOrders,
    recentUsers,
  });
});

/** GET /api/admin/dashboard/order-analytics — Enhanced order analytics with real-time stats */
const getOrderAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || "all";
  const df = buildDateFilter(range, "o");

  const [totalRow] = await query(`SELECT COUNT(*) AS count FROM orders o WHERE 1=1 ${df}`);
  const [deliveredRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'delivered' ${df}`
  );
  const [cancelledRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'cancelled' ${df}`
  );
  const [pendingRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status IN ('pending', 'confirmed', 'processing') ${df}`
  );
  const [outForDeliveryRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o WHERE o.status = 'out_for_delivery' ${df}`
  );
  const [revenueRow] = await query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders o WHERE o.status = 'delivered' ${df}`
  );
  const [last30DeliveredRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );
  const [last30CancelledRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );
  const [last30RevenueRow] = await query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'delivered' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );

  return success(res, "Order analytics fetched", {
    totalOrders: Number(totalRow.count),
    deliveredOrders: Number(deliveredRow.count),
    cancelledOrders: Number(cancelledRow.count),
    pendingOrders: Number(pendingRow.count),
    outForDelivery: Number(outForDeliveryRow.count),
    revenue: parseFloat(revenueRow.total),
    last30Days: {
      deliveredOrders: Number(last30DeliveredRow.count),
      cancelledOrders: Number(last30CancelledRow.count),
      revenue: parseFloat(last30RevenueRow.total),
    },
  });
});

/** GET /api/admin/dashboard/revenue-analytics — Detailed revenue breakdown */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || "all";
  const df = buildDateFilter(range, "o");

  const dailyRevenue = await query(`
    SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    WHERE status = 'delivered'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const [summary] = await query(`
    SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(total_amount), 0) AS total_revenue,
           COALESCE(AVG(total_amount), 0) AS avg_order_value,
           COUNT(DISTINCT DATE(created_at)) AS active_days
    FROM orders o
    WHERE o.status = 'delivered' ${df}
  `);

  return success(res, "Revenue analytics fetched", {
    summary,
    dailyRevenue,
  });
});

/** GET /api/admin/dashboard/active-products — Products with stock analytics */
const getActiveProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  let where = "WHERE p.status = 'active'";
  const params = [];

  if (search) {
    where += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  const [totalRow] = await query(`SELECT COUNT(*) AS count FROM products p ${where}`, params);

  const products = await query(
    `SELECT p.*, pc.name AS category_name,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS total_orders
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     ${where}
     ORDER BY p.stock_quantity ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return success(res, "Active products fetched", {
    products,
    pagination: {
      total: Number(totalRow.count),
      page,
      limit,
      pages: Math.ceil(Number(totalRow.count) / limit),
    },
  });
});

module.exports = { getStats, getOrderAnalytics, getRevenueAnalytics, getActiveProducts, getUnifiedAnalytics };