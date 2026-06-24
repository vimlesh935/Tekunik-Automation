const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

/** GET /api/admin/dashboard/stats — Real counts from MySQL */
const getStats = asyncHandler(async (req, res) => {
  const [totalProductsRow] = await query("SELECT COUNT(*) AS count FROM products");
  const [totalCategoriesRow] = await query("SELECT COUNT(*) AS count FROM product_categories");
  const [totalUsersRow] = await query("SELECT COUNT(*) AS count FROM users");
  const [totalOrdersRow] = await query("SELECT COUNT(*) AS count FROM orders");
  const [revenueRow] = await query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'delivered'"
  );
  const [pendingOrdersRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'"
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
  // Total Orders
  const [totalRow] = await query("SELECT COUNT(*) AS count FROM orders");

  // Delivered Orders
  const [deliveredRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'delivered'"
  );

  // Cancelled Orders
  const [cancelledRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'cancelled'"
  );

  // Pending Orders (pending + confirmed + processing)
  const [pendingRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status IN ('pending', 'confirmed', 'processing')"
  );

  // Out For Delivery
  const [outForDeliveryRow] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE status = 'out_for_delivery'"
  );

  // Revenue from Delivered orders only
  const [revenueRow] = await query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'delivered'"
  );

  // Last 30 Days Analytics
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
  const period = req.query.period || "all";

  let dateFilter = "";
  if (period === "today") {
    dateFilter = "WHERE DATE(created_at) = CURDATE() AND status = 'delivered'";
  } else if (period === "week") {
    dateFilter = "WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status = 'delivered'";
  } else if (period === "month") {
    dateFilter = "WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'delivered'";
  } else {
    dateFilter = "WHERE status = 'delivered'";
  }

  // Revenue by payment method
  const paymentMethodRevenue = await query(`
    SELECT payment_method, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total
    FROM orders
    ${dateFilter}
    GROUP BY payment_method
  `);

  // Daily revenue for chart (last 14 days)
  const dailyRevenue = await query(`
    SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    WHERE status = 'delivered'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  // Recent transactions (last 30 days)
  const recentTransactions = await query(`
    SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.payment_status,
           o.status, o.created_at,
           COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE status = 'delivered'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY o.created_at DESC
    LIMIT 20
  `);

  // Summary
  const [summary] = await query(`
    SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(total_amount), 0) AS total_revenue,
           COALESCE(AVG(total_amount), 0) AS avg_order_value,
           COUNT(DISTINCT DATE(created_at)) AS active_days
    FROM orders
    WHERE status = 'delivered'
  `);

  return success(res, "Revenue analytics fetched", {
    summary,
    dailyRevenue,
    paymentMethodRevenue,
    recentTransactions,
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

module.exports = { getStats, getOrderAnalytics, getRevenueAnalytics, getActiveProducts };