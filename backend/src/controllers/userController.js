const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl } = require("../utils/uploadPaths");

const normalizeOrderItemImages = (items) =>
  items.map((item) => ({
    ...item,
    product_image: normalizeImageUrl(item.product_image),
  }));

/** GET /api/user/profile — Get current user's profile */
const getProfile = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.email, u.is_verified, u.created_at,
            up.first_name, up.last_name, up.phone, up.address, up.city
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!rows.length) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  return success(res, "Profile fetched", { user: rows[0] });
});

/** PUT /api/user/profile — Update current user's profile */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, phone, address, city } = req.body;

  // Update user_profiles table
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, city)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       first_name = VALUES(first_name),
       last_name = VALUES(last_name),
       phone = VALUES(phone),
       address = VALUES(address),
       city = VALUES(city)`,
    [userId, (first_name && String(first_name)) || "User", (last_name && String(last_name)) || "-", (phone && String(phone)) || null, (address && String(address)) || null, (city && String(city)) || null]
  );

  // Fetch updated profile
  const rows = await query(
    `SELECT u.id, u.email, u.is_verified, u.created_at,
            up.first_name, up.last_name, up.phone, up.address, up.city
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = ?`,
    [userId]
  );

  return success(res, "Profile updated", { user: rows[0] });
});

/** GET /api/user/orders — Get current user's orders */
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const orders = await query(
    `SELECT o.*,
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), 'User') AS customer_name
     FROM orders o
     LEFT JOIN user_profiles up ON o.user_id = up.user_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  // Get order items and tracking for each order
  for (const order of orders) {
    const items = await query(
      `SELECT oi.*, p.image_url AS product_image, p.sku AS product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = normalizeOrderItemImages(items);

    // Compute total_products (distinct product count) and total_quantity (sum of qty)
    order.total_products = items.length;
    order.total_quantity = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    // Fetch tracking history
    const tracking = await query(
      `SELECT status, label, description, timestamp, created_at
       FROM order_tracking
       WHERE order_id = ?
       ORDER BY timestamp ASC, id ASC`,
      [order.id]
    );
    order.trackingHistory = tracking;
  }

  return success(res, "Orders fetched", { orders });
});

/** GET /api/user/orders/:id — Get a single order details */
const getUserOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.id;

  const [order] = await query(
    `SELECT o.*,
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), 'User') AS customer_name
     FROM orders o
     LEFT JOIN user_profiles up ON o.user_id = up.user_id
     WHERE o.id = ? AND o.user_id = ?`,
    [orderId, userId]
  );

  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  order.items = normalizeOrderItemImages(items);

  // Compute counts
  order.total_products = items.length;
  order.total_quantity = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  // Fetch tracking history
  const tracking = await query(
    `SELECT status, label, description, timestamp, created_at
     FROM order_tracking
     WHERE order_id = ?
     ORDER BY timestamp ASC, id ASC`,
    [orderId]
  );
  order.trackingHistory = tracking;

  return success(res, "Order fetched", { order });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserOrders,
  getUserOrder,
};
