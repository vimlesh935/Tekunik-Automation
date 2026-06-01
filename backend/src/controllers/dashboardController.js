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
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'paid'"
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

/** GET /api/admin/dashboard/revenue-analytics — Detailed revenue breakdown */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || "all";

  let dateFilter = "";
  const params = [];

  if (period === "today") {
    dateFilter = "WHERE DATE(o.created_at) = CURDATE()";
  } else if (period === "week") {
    dateFilter = "WHERE YEARWEEK(o.created_at) = YEARWEEK(CURDATE())";
  } else if (period === "month") {
    dateFilter = "WHERE MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())";
  }

  // Revenue by payment method
  const paymentMethodRevenue = await query(`
    SELECT payment_method, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total
    FROM orders o
    ${dateFilter ? dateFilter.replace("o.", "") : ""}
    GROUP BY payment_method
  `);
  if (period !== "all") params.length;

  // Daily revenue for chart (last 14 days)
  const dailyRevenue = await query(`
    SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  // Recent transactions
  const recentTransactions = await query(`
    SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.payment_status,
           o.status, o.created_at,
           COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
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
    ${dateFilter ? dateFilter.replace("o.", "") : ""}
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

module.exports = { getStats, getRevenueAnalytics, getActiveProducts };