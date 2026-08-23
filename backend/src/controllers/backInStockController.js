const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const {
  subscribeAlert,
  cancelAlert,
  getAlertStatus,
  getMyAlerts,
  getWaitingCustomers,
  getWaitingCounts,
  getProductRestockAnalytics,
} = require("../services/backInStockService");

/**
 * POST /api/back-in-stock/:productId
 * Customer subscribes to a back-in-stock alert (requires login).
 */
const subscribe = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!productId || isNaN(productId)) {
    throw new AppError("Valid product ID is required", 400, "VALIDATION_ERROR");
  }

  const result = await subscribeAlert({
    userId: req.user.id,
    productId,
    variantId: req.body?.variant_id ? parseInt(req.body.variant_id, 10) : null,
  });

  if (!result.success) {
    if (result.reason === "product_not_found") {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    if (result.reason === "already_in_stock") {
      return success(res, "Product is already in stock", { ...result, subscribed: false });
    }
    throw new AppError("Unable to register notification", 400, "VALIDATION_ERROR");
  }

  return success(res, result.alreadyActive
    ? "Notification already active"
    : "We'll notify you when this product is back in stock", {
    ...result,
    subscribed: true,
  });
});

/**
 * DELETE /api/back-in-stock/:productId
 * Customer cancels their own alert.
 */
const cancel = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!productId || isNaN(productId)) {
    throw new AppError("Valid product ID is required", 400, "VALIDATION_ERROR");
  }
  const result = await cancelAlert({ userId: req.user.id, productId });
  return success(res, result.cancelled ? "Notification cancelled" : "No active notification", result);
});

/**
 * GET /api/back-in-stock/status/:productId
 * Current user's alert state for a product.
 */
const status = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!productId || isNaN(productId)) {
    throw new AppError("Valid product ID is required", 400, "VALIDATION_ERROR");
  }
  const alert = await getAlertStatus({ userId: req.user.id, productId });
  return success(res, "Alert status fetched", {
    active: !!alert && alert.status === "ACTIVE",
    status: alert ? alert.status : null,
    createdAt: alert ? alert.created_at : null,
    notifiedAt: alert ? alert.notified_at : null,
  });
});

/**
 * GET /api/back-in-stock/my
 * All of the current user's alerts.
 */
const myAlerts = asyncHandler(async (req, res) => {
  const alerts = await getMyAlerts(req.user.id);
  return success(res, "Your notifications fetched", { alerts });
});

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────

/**
 * GET /api/admin/back-in-stock/product/:productId/waiting
 * Admin: list customers waiting for a product.
 */
const adminWaitingCustomers = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!productId || isNaN(productId)) {
    throw new AppError("Valid product ID is required", 400, "VALIDATION_ERROR");
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const data = await getWaitingCustomers(productId, { page, limit });
  return success(res, "Waiting customers fetched", data);
});

/**
 * GET /api/admin/back-in-stock/waiting-counts?ids=1,2,3
 * Admin: waiting counts per product (for product cards).
 */
const adminWaitingCounts = asyncHandler(async (req, res) => {
  const idsParam = String(req.query.ids || "").trim();
  let ids = [];
  if (idsParam) {
    ids = idsParam.split(",").map((v) => parseInt(v, 10)).filter(Boolean);
  } else {
    // No ids provided → counts for all out-of-stock products
    const rows = await require("../config/db").query(
      `SELECT bas.product_id, COUNT(*) AS count
       FROM back_in_stock_alerts bas
       JOIN products p ON p.id = bas.product_id
       WHERE bas.status = 'ACTIVE' AND p.stock_quantity <= 0
       GROUP BY bas.product_id`,
    );
    const map = {};
    for (const row of rows) map[Number(row.product_id)] = Number(row.count);
    return success(res, "Waiting counts fetched", { counts: map });
  }
  const counts = await getWaitingCounts(ids);
  return success(res, "Waiting counts fetched", { counts });
});

/**
 * GET /api/admin/back-in-stock/product/:productId/analytics
 * Admin: restock demand analytics for one product.
 */
const adminRestockAnalytics = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!productId || isNaN(productId)) {
    throw new AppError("Valid product ID is required", 400, "VALIDATION_ERROR");
  }
  const analytics = await getProductRestockAnalytics(productId);
  if (!analytics) throw new AppError("Product not found", 404, "NOT_FOUND");
  return success(res, "Restock analytics fetched", analytics);
});

module.exports = {
  subscribe,
  cancel,
  status,
  myAlerts,
  adminWaitingCustomers,
  adminWaitingCounts,
  adminRestockAnalytics,
};