const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

/** GET /api/admin/discounts */
const listDiscounts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const [totalRow] = await query("SELECT COUNT(*) AS count FROM discounts");

  const discounts = await query(
    `SELECT d.*, p.name AS product_name
     FROM discounts d
     LEFT JOIN products p ON d.product_id = p.id
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return success(res, "Discounts fetched", {
    discounts,
    pagination: {
      total: totalRow.count,
      page,
      limit,
      pages: Math.ceil(totalRow.count / limit),
    },
  });
});

/** GET /api/admin/discounts/:id */
const getDiscount = asyncHandler(async (req, res) => {
  const [discount] = await query(
    `SELECT d.*, p.name AS product_name
     FROM discounts d
     LEFT JOIN products p ON d.product_id = p.id
     WHERE d.id = ?`,
    [req.params.id]
  );
  if (!discount) throw new AppError("Discount not found", 404, "NOT_FOUND");
  return success(res, "Discount fetched", { discount });
});

/** POST /api/admin/discounts */
const createDiscount = asyncHandler(async (req, res) => {
  const { name, type, value, product_id, min_order_value, starts_at, expires_at, is_active } = req.body;

  if (!name || !name.trim()) throw new AppError("Discount name is required", 400, "VALIDATION_ERROR");
  if (!type) throw new AppError("Discount type is required (percentage, fixed, bogo)", 400, "VALIDATION_ERROR");
  if (value === undefined || value === null) throw new AppError("Discount value is required", 400, "VALIDATION_ERROR");

  const validTypes = ["percentage", "fixed", "bogo"];
  if (!validTypes.includes(type)) {
    throw new AppError("Invalid discount type. Must be: percentage, fixed, or bogo", 400, "VALIDATION_ERROR");
  }

  const result = await query(
    `INSERT INTO discounts (name, type, value, product_id, min_order_value, starts_at, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      type,
      parseFloat(value) || 0,
      product_id || null,
      min_order_value ? parseFloat(min_order_value) : null,
      starts_at || null,
      expires_at || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
    ]
  );

  const [created] = await query("SELECT * FROM discounts WHERE id = ?", [result.insertId]);
  return success(res, "Discount created", { discount: created }, 201);
});

/** PUT /api/admin/discounts/:id */
const updateDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, value, product_id, min_order_value, starts_at, expires_at, is_active } = req.body;

  const existing = await query("SELECT id FROM discounts WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Discount not found", 404, "NOT_FOUND");

  if (!name || !name.trim()) throw new AppError("Discount name is required", 400, "VALIDATION_ERROR");

  const validTypes = ["percentage", "fixed", "bogo"];
  if (type && !validTypes.includes(type)) {
    throw new AppError("Invalid discount type. Must be: percentage, fixed, or bogo", 400, "VALIDATION_ERROR");
  }

  await query(
    `UPDATE discounts
     SET name = ?, type = ?, value = ?, product_id = ?, min_order_value = ?,
         starts_at = ?, expires_at = ?, is_active = ?
     WHERE id = ?`,
    [
      name.trim(),
      type || "percentage",
      value !== undefined ? parseFloat(value) : 0,
      product_id || null,
      min_order_value ? parseFloat(min_order_value) : null,
      starts_at || null,
      expires_at || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id,
    ]
  );

  const [updated] = await query("SELECT * FROM discounts WHERE id = ?", [id]);
  return success(res, "Discount updated", { discount: updated });
});

/** DELETE /api/admin/discounts/:id */
const deleteDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query("SELECT id FROM discounts WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Discount not found", 404, "NOT_FOUND");
  await query("DELETE FROM discounts WHERE id = ?", [id]);
  return success(res, "Discount deleted");
});

/** PATCH /api/admin/discounts/:id/toggle - Toggle active status */
const toggleDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [discount] = await query("SELECT id, is_active FROM discounts WHERE id = ?", [id]);
  if (!discount) throw new AppError("Discount not found", 404, "NOT_FOUND");

  const newStatus = discount.is_active ? 0 : 1;
  await query("UPDATE discounts SET is_active = ? WHERE id = ?", [newStatus, id]);

  const [updated] = await query("SELECT * FROM discounts WHERE id = ?", [id]);
  return success(res, `Discount ${newStatus ? 'activated' : 'deactivated'}`, { discount: updated });
});

/** GET /api/discounts/active - Public: Get active discounts */
const getActiveDiscounts = asyncHandler(async (req, res) => {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const discounts = await query(
    `SELECT d.*, p.name AS product_name
     FROM discounts d
     LEFT JOIN products p ON d.product_id = p.id
     WHERE d.is_active = 1
       AND (d.starts_at IS NULL OR d.starts_at <= ?)
       AND (d.expires_at IS NULL OR d.expires_at >= ?)
     ORDER BY d.created_at DESC`,
    [now, now]
  );
  return success(res, "Active discounts fetched", { discounts });
});

module.exports = {
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
  getActiveDiscounts,
};