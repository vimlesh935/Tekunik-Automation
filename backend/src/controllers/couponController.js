const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { query } = require("../config/db");
const {
  generateUniqueCouponCode,
  getCouponById,
  getCouponByCode,
  listCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  applyCoupon: applyCouponService,
  removeCoupon: removeCouponService,
  calculateCartTotals,
  getUserCoupons,
  listAvailableCoupons,
  validateCouponCode,
  COUPON_STATUS,
} = require("../services/couponService");

const parseIntOr = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ─── User Endpoints: apply / remove / mine / totals / available / validate ─
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode = req.body.code } = req.body || {};
  const cartItems = Array.isArray(req.body?.cartItems) ? req.body.cartItems : (Array.isArray(req.body?.items) ? req.body.items : null);
  const cartTotal = req.body?.cartTotal !== undefined ? req.body.cartTotal : (req.body?.subtotal !== undefined ? req.body.subtotal : null);
  const result = await applyCouponService({ userId: req.user.id, code: couponCode, items: cartItems, subtotal: cartTotal });
  return success(res, "Coupon applied successfully", result);
});

const removeCoupon = asyncHandler(async (req, res) => {
  const result = await removeCouponService({ userId: req.user.id });
  return success(res, "Coupon removed", result);
});

const myCoupons = asyncHandler(async (req, res) => {
  const coupons = await getUserCoupons(req.user.id);
  return success(res, "My coupons fetched", { coupons });
});

const cartTotalsWithCoupon = asyncHandler(async (req, res) => {
  const totals = await calculateCartTotals(req.user.id);
  return success(res, "Cart totals", totals);
});

/** POST /api/coupons/available — active coupons for checkout preview */
const availableCoupons = asyncHandler(async (req, res) => {
  const cartItems = Array.isArray(req.body?.cartItems) ? req.body.cartItems : (Array.isArray(req.body?.items) ? req.body.items : null);
  const subtotal = req.body?.cartTotal !== undefined ? req.body.cartTotal : (req.body?.subtotal !== undefined ? req.body.subtotal : null);
  const data = await listAvailableCoupons(req.user?.id || null, cartItems, subtotal);
  return success(res, "Available coupons fetched", data);
});

/** POST /api/coupons/validate — preview coupon validity and discount */
const validateCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body?.code || req.body?.couponCode || "").trim();
  if (!code) throw new AppError("Coupon code is required", 400, "COUPON_REQUIRED");

  const cartItems = Array.isArray(req.body?.cartItems) ? req.body.cartItems : (Array.isArray(req.body?.items) ? req.body.items : null);
  const cartTotal = req.body?.cartTotal !== undefined ? req.body.cartTotal : (req.body?.subtotal !== undefined ? req.body.subtotal : null);

  const result = await validateCouponCode({
    userId: req.user?.id || null,
    code,
    items: cartItems,
    cartTotal,
  });

  if (!result.valid && !result.success) {
    const err = new AppError(result.message, 400, result.code);
    err.couponDetails = result;
    throw err;
  }
  return success(res, result.message || "Coupon is valid", result);
});

/** GET /api/admin/coupons/stats — coupon analytics */
const couponStatsAdmin = asyncHandler(async (req, res) => {
  const [summary] = await query(
    `SELECT
       (SELECT COUNT(*) FROM coupons) AS totalCoupons,
       (SELECT COUNT(*) FROM coupons WHERE is_active = 1 AND status = 'ACTIVE') AS activeCoupons,
       (SELECT COUNT(*) FROM coupons WHERE status = 'USED') AS usedCoupons,
       (SELECT COUNT(*) FROM coupons WHERE is_active = 1 AND expires_at IS NOT NULL
          AND expires_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)) AS expiringSoon,
       (SELECT COUNT(*) FROM coupon_usage) AS totalUses,
       (SELECT COALESCE(SUM(discount_amount), 0) FROM coupon_usage) AS totalDiscountGiven`
  );
  const mostUsed = await query(
    `SELECT c.id, c.code, c.used_count, c.status, c.discount_type, c.discount_value,
            COALESCE(SUM(cu.discount_amount), 0) AS discount_given,
            COUNT(cu.id) AS orders_generated
     FROM coupons c
     LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
     GROUP BY c.id, c.code, c.used_count, c.status, c.discount_type, c.discount_value
     ORDER BY c.used_count DESC, discount_given DESC
     LIMIT 5`
  );
  return success(res, "Coupon stats fetched", { summary, mostUsed });
});

// ─── Admin Endpoints: list / get / create / update / generate / status / delete ─
const listCouponsAdmin = asyncHandler(async (req, res) => {
  const page = parseIntOr(req.query.page, 1);
  const limit = parseIntOr(req.query.limit, 25);
  const search = String(req.query.search || "");
  const status = String(req.query.status || "");
  const data = await listCoupons({ page, limit, search, status });
  return success(res, "Coupons fetched", data);
});

const getCouponAdmin = asyncHandler(async (req, res) => {
  const coupon = await getCouponById(parseIntOr(req.params.id, 0));
  if (!coupon) throw new AppError("Coupon not found", 404, "NOT_FOUND");
  return success(res, "Coupon fetched", { coupon });
});

const createCouponAdmin = asyncHandler(async (req, res) => {
  const body = req.body || {};

  let code = String(body.code || body.couponCode || "").trim().toUpperCase();
  if (!code) {
    code = await generateUniqueCouponCode({
      prefix: String(body.coupon_prefix || "SAVE").trim(),
      length: 6,
    });
  }

  const isDuplicate = await getCouponByCode(code);
  if (isDuplicate) throw new AppError("Coupon code already exists", 409, "DUPLICATE_CODE");

  const discountType = String(body.discountType || body.discount_type || "percentage").toLowerCase() === "fixed" ? "fixed" : "percentage";
  const discountValue = Number(body.discountValue !== undefined ? body.discountValue : (body.discount_value !== undefined ? body.discount_value : 0));
  if (discountValue <= 0) {
    throw new AppError("Discount value must be greater than 0", 400, "INVALID_DISCOUNT_VALUE");
  }

  const minCart = Number(body.minimumCartValue !== undefined ? body.minimumCartValue : (body.minimum_cart_value !== undefined ? body.minimum_cart_value : (body.min_order_value || 0)));
  const maxDiscount = body.maximumDiscount !== undefined && body.maximumDiscount !== null && body.maximumDiscount !== ""
    ? Number(body.maximumDiscount)
    : (body.maximum_discount !== undefined && body.maximum_discount !== null && body.maximum_discount !== "" ? Number(body.maximum_discount) : null);

  const coupon = await createCoupon({
    code,
    description: body.description || null,
    discount_type: discountType,
    discount_value: discountValue,
    minimum_cart_value: minCart,
    maximum_discount: maxDiscount,
    starts_at: toDateOrNull(body.startDate || body.starts_at || body.start_date),
    expires_at: toDateOrNull(body.expiryDate || body.expires_at || body.expiry_date),
    usage_limit: body.usageLimit !== undefined && body.usageLimit !== null && body.usageLimit !== ""
      ? parseIntOr(body.usageLimit, null)
      : (body.usage_limit !== undefined && body.usage_limit !== null && body.usage_limit !== "" ? parseIntOr(body.usage_limit, null) : null),
    per_user_limit: Math.max(1, parseIntOr(body.perUserLimit ?? body.per_user_limit, 1)),
    is_active: body.isActive !== undefined ? (body.isActive ? 1 : 0) : (body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1),
    applicable_products: body.applicableProducts || body.applicable_products || null,
    applicable_categories: body.applicableCategories || body.applicable_categories || null,
    stack_with_offer: body.stackWithOffer !== undefined ? (body.stackWithOffer ? 1 : 0) : (body.stack_with_offer !== undefined ? (body.stack_with_offer ? 1 : 0) : 1),
    offer_id: parseIntOr(body.offer_id, 0) || null,
    user_id: parseIntOr(body.user_id, 0) || null,
    coupon_type: ["shared", "personal", "welcome"].includes(body.coupon_type) ? body.coupon_type : "shared",
    status: body.status || "ACTIVE",
    created_by: req.user?.id || null,
  });

  return success(res, "Coupon created successfully", { coupon }, 201);
});

const updateCouponAdmin = asyncHandler(async (req, res) => {
  const id = parseIntOr(req.params.id, 0);
  const existing = await getCouponById(id);
  if (!existing) throw new AppError("Coupon not found", 404, "NOT_FOUND");

  const body = req.body || {};
  if (body.code) {
    const newCode = String(body.code).trim().toUpperCase();
    if (newCode !== existing.code) {
      const isDuplicate = await getCouponByCode(newCode);
      if (isDuplicate && isDuplicate.id !== id) {
        throw new AppError("Coupon code already exists", 409, "DUPLICATE_CODE");
      }
    }
  }

  const updated = await updateCoupon(id, body);
  return success(res, "Coupon updated successfully", { coupon: updated });
});

const generateCouponAdmin = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const quantity = Math.max(1, Math.min(50, parseIntOr(body.quantity, 1)));
  const couponType = ["shared", "personal", "welcome"].includes(body.coupon_type)
    ? body.coupon_type
    : "shared";
  const userId = parseIntOr(body.user_id, 0) || null;
  if (couponType !== "shared" && !userId) {
    throw new AppError("A user_id is required for personalized coupons", 400, "USER_REQUIRED");
  }

  let expiresAt = toDateOrNull(body.expires_at || body.expiryDate);
  if (!expiresAt && body.expires_days) {
    const days = Math.max(1, Math.min(3650, parseIntOr(body.expires_days, 7)));
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const discountType = String(body.discountType || body.discount_type || "percentage").toLowerCase() === "fixed" ? "fixed" : "percentage";
  const discountValue = Number(body.discountValue !== undefined ? body.discountValue : (body.discount_value !== undefined ? body.discount_value : 10));
  const minCart = Number(body.minimumCartValue !== undefined ? body.minimumCartValue : (body.minimum_cart_value || 0));
  const maxDiscount = body.maximumDiscount !== undefined && body.maximumDiscount !== null && body.maximumDiscount !== ""
    ? Number(body.maximumDiscount)
    : (body.maximum_discount ? Number(body.maximum_discount) : null);

  const coupons = [];
  for (let i = 0; i < quantity; i += 1) {
    const code = await generateUniqueCouponCode({
      prefix: String(body.coupon_prefix || "SAVE").trim(),
      length: Math.max(6, Math.min(16, parseIntOr(body.length, 6))),
    });

    const coupon = await createCoupon({
      code,
      description: body.description || null,
      discount_type: discountType,
      discount_value: discountValue,
      minimum_cart_value: minCart,
      maximum_discount: maxDiscount,
      starts_at: toDateOrNull(body.starts_at || body.startDate) || new Date(),
      expires_at: expiresAt,
      usage_limit: body.usage_limit === undefined || body.usage_limit === null || body.usage_limit === ""
        ? null
        : Math.max(0, parseIntOr(body.usage_limit, 0)),
      per_user_limit: Math.max(1, parseIntOr(body.per_user_limit, 1)),
      applicable_products: body.applicable_products || null,
      applicable_categories: body.applicable_categories || null,
      stack_with_offer: body.stack_with_offer !== undefined ? (body.stack_with_offer ? 1 : 0) : 1,
      offer_id: parseIntOr(body.offer_id, 0) || null,
      user_id: userId,
      coupon_type: couponType,
      status: "ACTIVE",
      is_active: 1,
      created_by: req.user?.id || null,
    });
    coupons.push(coupon);
  }

  return success(
    res,
    coupons.length === 1 ? "Coupon generated successfully" : `${coupons.length} coupons generated successfully`,
    { coupons },
    201,
  );
});

const toggleCouponAdmin = asyncHandler(async (req, res) => {
  const id = parseIntOr(req.params.id, 0);
  const target = String(req.body?.status || "").toUpperCase();
  const allowed = ["ACTIVE", "DISABLED"];
  if (!allowed.includes(target)) throw new AppError("Invalid coupon status", 400, "VALIDATION_ERROR");

  const current = await getCouponById(id);
  if (!current) throw new AppError("Coupon not found", 404, "NOT_FOUND");
  if (current.status === COUPON_STATUS.USED && target === "ACTIVE") {
    throw new AppError("A used coupon cannot be reactivated.", 409, "COUPON_USED_LOCKED");
  }

  const coupon = await updateCouponStatus(id, target);
  return success(res, `Coupon ${target === "ACTIVE" ? "activated" : "deactivated"} successfully`, { coupon });
});

const removeCouponAdmin = asyncHandler(async (req, res) => {
  const id = parseIntOr(req.params.id, 0);
  const deleted = await deleteCoupon(id);
  if (!deleted) throw new AppError("Coupon not found", 404, "NOT_FOUND");
  return success(res, "Coupon deleted successfully");
});

module.exports = {
  applyCoupon,
  removeCoupon,
  myCoupons,
  cartTotalsWithCoupon,
  availableCoupons,
  validateCoupon,
  listCouponsAdmin,
  getCouponAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  generateCouponAdmin,
  toggleCouponAdmin,
  removeCouponAdmin,
  couponStatsAdmin,
};