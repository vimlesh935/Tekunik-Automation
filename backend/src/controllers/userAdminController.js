const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

/** GET /api/admin/users?page=1&limit=20&search= */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let where = "WHERE 1=1";
  const params = [];
  if (search) {
    where += " AND (u.email LIKE ? OR up.first_name LIKE ? OR up.last_name LIKE ? OR up.phone LIKE ?)";
    params.push(search, search, search, search);
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id ${where}`,
    params
  );

  const users = await query(
    `SELECT u.id, u.email, u.role, u.is_verified, u.created_at,
            up.first_name, up.last_name, up.city, up.phone,
            (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') AS total_spent
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return success(res, "Users fetched", {
    users,
    pagination: {
      total: Number(totalRow.count),
      page,
      limit,
      pages: Math.ceil(Number(totalRow.count) / limit),
    },
  });
});

/** GET /api/admin/users/:id — full user profile with orders */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [user] = await query(
    `SELECT u.id, u.email, u.role, u.is_verified, u.created_at, u.updated_at,
            up.first_name, up.last_name, up.phone, up.address, up.city,
            (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') AS total_spent,
            (SELECT MAX(created_at) FROM orders WHERE user_id = u.id) AS last_order_date
     FROM users u
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE u.id = ?`,
    [id]
  );

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const orders = await query(
    `SELECT o.id, o.order_number, o.tracking_number, o.status, o.payment_status,
            o.payment_method, o.total_amount, o.created_at, o.guest_city,
            o.delivery_address, o.guest_state, o.guest_pincode,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [id]
  );

  return success(res, "User fetched", { user, orders });
});

/** PATCH /api/admin/users/:id/toggle — toggle is_verified (active/inactive) */
const toggleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query("SELECT id, is_verified FROM users WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("User not found", 404, "NOT_FOUND");

  const newStatus = existing[0].is_verified ? 0 : 1;
  await query("UPDATE users SET is_verified = ? WHERE id = ?", [newStatus, id]);
  return success(res, newStatus ? "User activated" : "User deactivated", { is_verified: !!newStatus });
});

module.exports = { listUsers, getUser, toggleUser };
