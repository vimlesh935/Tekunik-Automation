/**
 * COUPON SERVICE
 *
 * Provides a comprehensive, production-ready coupon engine:
 * 1. Supports standalone coupons (direct percentage/fixed discount rules,
 *    minimum cart value, max discount cap, validity window, usage limits,
 *    product & category restrictions, stackWithOffer rule).
 * 2. Backwards-compatible with offer-linked and welcome coupons.
 * 3. Authoritative server-side validation & discount calculation.
 * 4. Cart snapshot persistence & safe order re-validation.
 */

const crypto = require("node:crypto");
const { query } = require("../config/db");

// ─── Constants ────────────────────────────────────────────────────────
const COUPON_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  USED: "USED",
  EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",
});

const COUPON_TYPES = Object.freeze({
  SHARED: "shared",
  PERSONAL: "personal",
  WELCOME: "welcome",
});

const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Global usage limit semantics: NULL, undefined and 0 all mean "unlimited"
// (0 is the historical DB default for an unbounded coupon).
const usageLimitValue = (limit) => {
  const n = Number(limit);
  return limit !== null && limit !== undefined && n > 0 ? n : Infinity;
};

const normalizeCouponCode = (code) =>
  String(code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

const parseJsonSafe = (val, fallback = null) => {
  if (!val) return fallback;
  if (Array.isArray(val) || typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

// ─── Secure coupon code generation ────────────────────────────────────
const randomChars = (length, charset) => {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += charset[bytes[i] % charset.length];
  return out;
};

const codeExists = async (code) => {
  const rows = await query("SELECT id FROM coupons WHERE code = ? LIMIT 1", [code]);
  return rows.length > 0;
};

const generateUniqueCouponCode = async ({ prefix = "", length = 8 } = {}) => {
  const cleanPrefix = String(prefix || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const bodyLen = Math.max(4, Math.min(24, parseInt(length, 10) || 8));
  const dash = cleanPrefix ? "-" : "";
  for (let i = 0; i < 30; i += 1) {
    const code = `${cleanPrefix}${dash}${randomChars(bodyLen, CODE_CHARSET)}`;
    const exists = await codeExists(code);
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique coupon code. Please retry.");
};

// ─── Data Access & Normalization ──────────────────────────────────────
const OFFER_FIELDS =
  "d.id AS offer_id, d.name AS offer_name, d.title AS offer_title, d.description AS offer_description, " +
  "d.type AS offer_type, d.value AS offer_value, d.maximum_discount AS offer_max_discount, " +
  "d.min_order_value AS offer_min_order, d.apply_to AS offer_apply_to, d.starts_at AS offer_starts_at, " +
  "d.expires_at AS offer_expires_at, d.is_active AS offer_is_active, d.audience AS offer_audience, " +
  "d.new_user_only AS offer_new_user_only, d.coupon_generation AS offer_coupon_generation, " +
  "d.coupon_prefix AS offer_coupon_prefix, d.coupon_validity_days AS offer_coupon_validity_days, " +
  "d.usage_limit AS offer_usage_limit, d.used_count AS offer_used_count";

const normalizeCouponRow = (row) => {
  if (!row) return null;

  // Resolve discount type & value (direct fields take precedence; fallback to linked offer)
  const discountType = (
    row.discount_type ||
    row.offer_type ||
    "percentage"
  ).toLowerCase();

  // Use the coupon's own discount value when it defines one (> 0); otherwise inherit
  // from the linked offer (offer-linked coupons store 0 in `discount_value` and carry
  // their real value on the discounts row).
  const directDiscountValue = Number(row.discount_value);
  const discountValue = Number(
    !Number.isNaN(directDiscountValue) && directDiscountValue > 0
      ? row.discount_value
      : (Number(row.offer_value) > 0 ? row.offer_value : 0)
  );

  // Same inheritance rule for the minimum cart value.
  const directMinCart = Number(row.minimum_cart_value);
  const directLegacyMinCart = Number(row.minimum_order_value);
  const minCartValue = Number(
    !Number.isNaN(directMinCart) && directMinCart > 0
      ? row.minimum_cart_value
      : (directLegacyMinCart > 0
          ? row.minimum_order_value
          : (Number(row.offer_min_order) > 0 ? row.offer_min_order : 0))
  );

  // Inherit the max-discount cap from the linked offer when the coupon has none.
  const maxDiscount =
    row.maximum_discount !== null && row.maximum_discount !== undefined && Number(row.maximum_discount) > 0
      ? Number(row.maximum_discount)
      : (row.max_discount !== null && row.max_discount !== undefined && Number(row.max_discount) > 0
          ? Number(row.max_discount)
          : (row.offer_max_discount !== null && row.offer_max_discount !== undefined && Number(row.offer_max_discount) > 0
              ? Number(row.offer_max_discount)
              : null));

  const startsAt = row.starts_at || row.start_date || row.offer_starts_at || null;
  const expiresAt = row.expires_at || row.expiry_date || row.offer_expires_at || null;

  const applicableProducts = parseJsonSafe(row.applicable_products, []);
  const applicableCategories = parseJsonSafe(row.applicable_categories, []);
  const stackWithOffer = row.stack_with_offer !== undefined ? Boolean(Number(row.stack_with_offer)) : true;
  const isActive = row.is_active !== undefined ? Boolean(Number(row.is_active)) : row.status === "ACTIVE";

  return {
    ...row,
    id: Number(row.id),
    code: String(row.code || "").toUpperCase(),
    description: row.description || row.offer_description || "",
    discount_type: discountType,
    discountType: discountType.toUpperCase(),
    discount_value: discountValue,
    discountValue: discountValue,
    minimum_cart_value: minCartValue,
    minimumCartValue: minCartValue,
    min_order_value: minCartValue,
    maximum_discount: maxDiscount,
    maximumDiscount: maxDiscount,
    starts_at: startsAt,
    startDate: startsAt,
    expires_at: expiresAt,
    expiryDate: expiresAt,
    usage_limit: row.usage_limit === null || row.usage_limit === undefined ? null : Number(row.usage_limit),
    usageLimit: row.usage_limit === null || row.usage_limit === undefined ? null : Number(row.usage_limit),
    used_count: Number(row.used_count || 0),
    usedCount: Number(row.used_count || 0),
    per_user_limit: Number(row.per_user_limit ?? 1),
    perUserLimit: Number(row.per_user_limit ?? 1),
    is_active: isActive,
    isActive: isActive,
    status: row.status || (isActive ? "ACTIVE" : "DISABLED"),
    applicable_products: applicableProducts,
    applicableProducts: applicableProducts,
    applicable_categories: applicableCategories,
    applicableCategories: applicableCategories,
    stack_with_offer: stackWithOffer,
    stackWithOffer: stackWithOffer,
    offer_id: row.offer_id ? Number(row.offer_id) : null,
    user_id: row.user_id ? Number(row.user_id) : null,
    created_order_id: row.created_order_id ? Number(row.created_order_id) : null,
  };
};

const getCouponById = async (id) => {
  const [row] = await query(
    `SELECT c.*, ${OFFER_FIELDS}
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  return normalizeCouponRow(row);
};

const getCouponByCode = async (code) => {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const [row] = await query(
    `SELECT c.*, ${OFFER_FIELDS}
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     WHERE c.code = ? LIMIT 1`,
    [normalized]
  );
  return normalizeCouponRow(row);
};

const listCoupons = async ({ page = 1, limit = 25, search = "", status = "" } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const offset = (safePage - 1) * safeLimit;
  const where = [];
  const params = [];

  if (search) {
    where.push("(c.code LIKE ? OR c.description LIKE ?)");
    const s = `%${String(search).trim().toUpperCase()}%`;
    params.push(s, s);
  }
  if (status) {
    where.push("c.status = ?");
    params.push(String(status).trim().toUpperCase());
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [countRow] = await query(`SELECT COUNT(*) AS count FROM coupons c ${whereSql}`, params);

  const rows = await query(
    `SELECT c.*, ${OFFER_FIELDS},
            TRIM(CONCAT(COALESCE(up.first_name,''), ' ', COALESCE(up.last_name,''))) AS assigned_user
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     ${whereSql}
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  return {
    coupons: rows.map(normalizeCouponRow),
    pagination: {
      total: Number(countRow?.count || 0),
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(Number(countRow?.count || 0) / safeLimit) || 1,
    },
  };
};

const countCouponUsage = async (couponId) => {
  const [row] = await query("SELECT COUNT(*) AS count FROM coupon_usage WHERE coupon_id = ?", [couponId]);
  return Number(row?.count || 0);
};

const countCouponUsageForUser = async (couponId, userId) => {
  if (!userId) return 0;
  const [row] = await query(
    "SELECT COUNT(*) AS count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?",
    [couponId, userId]
  );
  return Number(row?.count || 0);
};

// ─── Admin CRUD ───────────────────────────────────────────────────────
const createCoupon = async ({
  code,
  description = null,
  discount_type = "percentage",
  discount_value = 0,
  minimum_cart_value = 0,
  maximum_discount = null,
  starts_at = null,
  expires_at = null,
  usage_limit = null,
  per_user_limit = 1,
  is_active = 1,
  applicable_products = null,
  applicable_categories = null,
  stack_with_offer = 1,
  offer_id = null,
  user_id = null,
  coupon_type = COUPON_TYPES.SHARED,
  status = COUPON_STATUS.ACTIVE,
  created_by = null,
}) => {
  const normalizedCode = normalizeCouponCode(code);
  const normalizedType = String(discount_type || "percentage").toLowerCase() === "fixed" ? "fixed" : "percentage";
  const numValue = Math.max(0, Number(discount_value) || 0);
  const numMinCart = Math.max(0, Number(minimum_cart_value) || 0);
  const numMaxDiscount = maximum_discount !== null && maximum_discount !== undefined && maximum_discount !== ""
    ? Math.max(0, Number(maximum_discount) || 0)
    : null;
  const numUsageLimit = usage_limit !== null && usage_limit !== undefined && usage_limit !== ""
    ? Math.max(0, parseInt(usage_limit, 10) || 0)
    : null;
  const numPerUser = Math.max(1, parseInt(per_user_limit, 10) || 1);
  const activeFlag = is_active ? 1 : 0;
  const computedStatus = activeFlag ? status || "ACTIVE" : "DISABLED";

  const appProductsJson = applicable_products && Array.isArray(applicable_products) && applicable_products.length
    ? JSON.stringify(applicable_products.map((id) => Number(id)).filter(Boolean))
    : null;
  const appCategoriesJson = applicable_categories && Array.isArray(applicable_categories) && applicable_categories.length
    ? JSON.stringify(applicable_categories.map((id) => Number(id)).filter(Boolean))
    : null;

  const result = await query(
    `INSERT INTO coupons (
      code, description, discount_type, discount_value, minimum_cart_value, maximum_discount,
      starts_at, expires_at, usage_limit, per_user_limit, is_active,
      applicable_products, applicable_categories, stack_with_offer,
      offer_id, user_id, coupon_type, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedCode,
      description || null,
      normalizedType,
      numValue,
      numMinCart,
      numMaxDiscount,
      starts_at || null,
      expires_at || null,
      numUsageLimit,
      numPerUser,
      activeFlag,
      appProductsJson,
      appCategoriesJson,
      stack_with_offer ? 1 : 0,
      offer_id || null,
      user_id || null,
      coupon_type || "shared",
      computedStatus,
      created_by || null,
    ]
  );
  return getCouponById(result.insertId);
};

const updateCoupon = async (id, data) => {
  const existing = await getCouponById(id);
  if (!existing) return null;

  const updates = [];
  const params = [];

  if (data.code !== undefined) {
    updates.push("code = ?");
    params.push(normalizeCouponCode(data.code));
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description || null);
  }
  if (data.discount_type !== undefined || data.discountType !== undefined) {
    const dt = String(data.discount_type || data.discountType || "percentage").toLowerCase() === "fixed" ? "fixed" : "percentage";
    updates.push("discount_type = ?");
    params.push(dt);
  }
  if (data.discount_value !== undefined || data.discountValue !== undefined) {
    const val = Math.max(0, Number(data.discount_value ?? data.discountValue ?? 0));
    updates.push("discount_value = ?");
    params.push(val);
  }
  if (data.minimum_cart_value !== undefined || data.minimumCartValue !== undefined || data.min_order_value !== undefined) {
    const minVal = Math.max(0, Number(data.minimum_cart_value ?? data.minimumCartValue ?? data.min_order_value ?? 0));
    updates.push("minimum_cart_value = ?");
    params.push(minVal);
  }
  if (data.maximum_discount !== undefined || data.maximumDiscount !== undefined || data.max_discount !== undefined) {
    const maxVal = data.maximum_discount !== null && data.maximum_discount !== undefined && data.maximum_discount !== ""
      ? Math.max(0, Number(data.maximum_discount ?? data.maximumDiscount ?? data.max_discount))
      : null;
    updates.push("maximum_discount = ?");
    params.push(maxVal);
  }
  if (data.starts_at !== undefined || data.startDate !== undefined) {
    updates.push("starts_at = ?");
    params.push(data.starts_at || data.startDate || null);
  }
  if (data.expires_at !== undefined || data.expiryDate !== undefined) {
    updates.push("expires_at = ?");
    params.push(data.expires_at || data.expiryDate || null);
  }
  if (data.usage_limit !== undefined || data.usageLimit !== undefined) {
    const ul = data.usage_limit !== null && data.usage_limit !== undefined && data.usage_limit !== ""
      ? Math.max(0, parseInt(data.usage_limit ?? data.usageLimit, 10) || 0)
      : null;
    updates.push("usage_limit = ?");
    params.push(ul);
  }
  if (data.per_user_limit !== undefined || data.perUserLimit !== undefined) {
    const pul = Math.max(1, parseInt(data.per_user_limit ?? data.perUserLimit, 10) || 1);
    updates.push("per_user_limit = ?");
    params.push(pul);
  }
  if (data.is_active !== undefined || data.isActive !== undefined) {
    const active = data.is_active ?? data.isActive ? 1 : 0;
    updates.push("is_active = ?");
    params.push(active);
    updates.push("status = ?");
    params.push(active ? "ACTIVE" : "DISABLED");
  } else if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
    updates.push("is_active = ?");
    params.push(data.status === "ACTIVE" ? 1 : 0);
  }
  if (data.applicable_products !== undefined || data.applicableProducts !== undefined) {
    const prods = data.applicable_products ?? data.applicableProducts;
    const json = Array.isArray(prods) && prods.length ? JSON.stringify(prods.map(Number).filter(Boolean)) : null;
    updates.push("applicable_products = ?");
    params.push(json);
  }
  if (data.applicable_categories !== undefined || data.applicableCategories !== undefined) {
    const cats = data.applicable_categories ?? data.applicableCategories;
    const json = Array.isArray(cats) && cats.length ? JSON.stringify(cats.map(Number).filter(Boolean)) : null;
    updates.push("applicable_categories = ?");
    params.push(json);
  }
  if (data.stack_with_offer !== undefined || data.stackWithOffer !== undefined) {
    const stack = (data.stack_with_offer ?? data.stackWithOffer) ? 1 : 0;
    updates.push("stack_with_offer = ?");
    params.push(stack);
  }

  if (!updates.length) return existing;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  await query(`UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`, params);
  return getCouponById(id);
};

const updateCouponStatus = async (id, status) => {
  const existing = await getCouponById(id);
  if (!existing) return null;
  const target = String(status || "").toUpperCase();
  if (!Object.values(COUPON_STATUS).includes(target)) return existing;
  const isActive = target === "ACTIVE" ? 1 : 0;
  await query("UPDATE coupons SET status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [target, isActive, id]);
  return getCouponById(id);
};

const deleteCoupon = async (id) => {
  const result = await query("DELETE FROM coupons WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

// ─── Scope & Eligibility ──────────────────────────────────────────────
const getOfferScope = async (offerId) => {
  if (!offerId) return null;
  const [offer] = await query(
    "SELECT id, name, title, type, value, maximum_discount, min_order_value, apply_to, is_active, starts_at, expires_at, new_user_only FROM discounts WHERE id = ?",
    [offerId]
  );
  if (!offer) return null;
  const products = await query("SELECT product_id FROM offer_products WHERE offer_id = ?", [offerId]);
  const categories = await query("SELECT category_id FROM offer_categories WHERE offer_id = ?", [offerId]);
  return {
    ...offer,
    id: Number(offer.id),
    value: Number(offer.value) || 0,
    maximum_discount: offer.maximum_discount !== null && offer.maximum_discount !== undefined ? Number(offer.maximum_discount) : null,
    min_order_value: offer.min_order_value !== null && offer.min_order_value !== undefined ? Number(offer.min_order_value) : null,
    product_ids: products.map((p) => Number(p.product_id)),
    category_ids: categories.map((c) => Number(c.category_id)),
  };
};

const isItemEligible = (coupon, offer, item) => {
  const productId = Number(item.product_id || item.id);
  const categoryId = Number(item.category_id);

  // 1. Coupon-level direct restrictions
  if (coupon.applicable_products && coupon.applicable_products.length > 0) {
    if (!coupon.applicable_products.includes(productId)) return false;
  }
  if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
    if (!coupon.applicable_categories.includes(categoryId)) return false;
  }

  // 2. Linked offer restrictions
  if (offer) {
    if (offer.apply_to === "selected_products" && !offer.product_ids?.includes(productId)) return false;
    if (offer.apply_to === "selected_category" && !offer.category_ids?.includes(categoryId)) return false;
    if (offer.apply_to === "selected_product" && offer.product_id && Number(offer.product_id) !== productId) return false;
  }

  return true;
};

// Pure discount calculation from coupon rules
const calculateDiscountAmount = ({ coupon, eligibleSubtotal }) => {
  const subtotal = toMoney(eligibleSubtotal);
  if (subtotal <= 0) return 0;

  const value = Number(coupon.discount_value || 0);
  const type = String(coupon.discount_type || "percentage").toLowerCase();

  let discount = 0;
  if (type === "percentage" || type === "percent") {
    discount = subtotal * (value / 100);
    if (coupon.maximum_discount !== null && coupon.maximum_discount !== undefined && coupon.maximum_discount > 0) {
      discount = Math.min(discount, Number(coupon.maximum_discount));
    }
  } else {
    // Fixed amount
    discount = Math.min(value, subtotal);
  }

  return toMoney(Math.max(0, Math.min(discount, subtotal)));
};

// ─── Cart Lines Loading ───────────────────────────────────────────────
const findOrCreateCart = async (userId) => {
  const [existing] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (existing) return existing;
  const r = await query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
  const [cart] = await query("SELECT * FROM carts WHERE id = ?", [r.insertId]);
  return cart;
};

const loadCartLines = async (userId) => {
  // No authenticated user → no DB cart to load (guest cart lives in the frontend only)
  if (!userId) {
    return { cart: null, items: [], subtotal: 0 };
  }
  const cart = await findOrCreateCart(userId);
  const items = await query(
    `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.category_id,
            p.name, p.price, p.sale_price, p.discount_percent, p.status AS product_status, p.stock_quantity
     FROM cart_items ci
     LEFT JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );
  let subtotal = 0;
  for (const it of items) {
    // Use sale_price when available (effective/discounted price); fall back to MRP
    const itemPrice = Number(it.sale_price || it.price) || 0;
    subtotal += itemPrice * Number(it.quantity || 0);
  }
  return { cart, items, subtotal: toMoney(subtotal) };
};


// ─── Authoritative Validation Engine ──────────────────────────────────
const REASON = {
  COUPON_REQUIRED: "Coupon code is required.",
  COUPON_NOT_FOUND: "Invalid coupon code.",
  COUPON_DISABLED: "Coupon is not active.",
  COUPON_USED: "Coupon has already been used.",
  COUPON_EXPIRED: "Coupon has expired.",
  COUPON_NOT_STARTED: "Coupon is not active yet.",
  COUPON_LIMIT: "Coupon usage limit reached.",
  PER_USER_LIMIT: "You have already used this coupon.",
  COUPON_NOT_ASSIGNED: "This coupon is assigned to another account.",
  OFFER_MISSING: "The linked offer is no longer available.",
  OFFER_INACTIVE: "Coupon offer is not active.",
  OFFER_EXPIRED: "Coupon has expired.",
  OFFER_NOT_STARTED: "This coupon is not active yet.",
  MIN_CART_NOT_REACHED: "Minimum cart value not reached.",
  CART_EMPTY: "Your cart is empty.",
  OFFER_NOT_APPLICABLE: "Coupon is not applicable to these products.",
  OFFER_STACK_DISALLOWED: "This coupon cannot be combined with the current offer.",
  NEW_USER_FAILED: "This coupon is for new customers only.",
};

const validateCoupon = async ({ userId, code, items = [], subtotal = 0 }) => {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { ok: false, code: "COUPON_REQUIRED", message: REASON.COUPON_REQUIRED };

  const coupon = await getCouponByCode(normalized);
  if (!coupon) return { ok: false, code: "COUPON_NOT_FOUND", message: REASON.COUPON_NOT_FOUND };

  // 1. Status & Active check
  if (!coupon.is_active || coupon.status === COUPON_STATUS.DISABLED) {
    return { ok: false, code: "COUPON_DISABLED", message: REASON.COUPON_DISABLED };
  }
  if (coupon.status === COUPON_STATUS.USED) {
    return { ok: false, code: "COUPON_USED", message: REASON.COUPON_USED };
  }
  if (coupon.status === COUPON_STATUS.EXPIRED) {
    return { ok: false, code: "COUPON_EXPIRED", message: REASON.COUPON_EXPIRED };
  }

  const now = new Date();

  // 2. Start & Expiry dates
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { ok: false, code: "COUPON_NOT_STARTED", message: REASON.COUPON_NOT_STARTED };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { ok: false, code: "COUPON_EXPIRED", message: REASON.COUPON_EXPIRED };
  }

  // 3. Global usage limit
  const globalUsage = await countCouponUsage(coupon.id);
  const effectiveUsageCount = Math.max(globalUsage, coupon.used_count || 0);
  if (effectiveUsageCount >= usageLimitValue(coupon.usage_limit)) {
    return { ok: false, code: "COUPON_LIMIT", message: REASON.COUPON_LIMIT };
  }

  // 4. Per-user usage limit
  if (userId) {
    const userUsage = await countCouponUsageForUser(coupon.id, userId);
    if (userUsage >= Number(coupon.per_user_limit || 1)) {
      return { ok: false, code: "COUPON_USER_LIMIT", message: REASON.PER_USER_LIMIT };
    }
  }

  // 5. User assignment
  if (coupon.user_id && Number(coupon.user_id) !== Number(userId)) {
    return { ok: false, code: "COUPON_NOT_ASSIGNED", message: REASON.COUPON_NOT_ASSIGNED };
  }

  // 6. Linked offer checks (if offer_id is attached)
  let linkedOffer = null;
  if (coupon.offer_id) {
    linkedOffer = await getOfferScope(coupon.offer_id);
    if (!linkedOffer) return { ok: false, code: "OFFER_MISSING", message: REASON.OFFER_MISSING };
    if (!Number(linkedOffer.is_active)) return { ok: false, code: "OFFER_INACTIVE", message: REASON.OFFER_INACTIVE };
    if (linkedOffer.starts_at && new Date(linkedOffer.starts_at) > now) {
      return { ok: false, code: "OFFER_NOT_STARTED", message: REASON.OFFER_NOT_STARTED };
    }
    if (linkedOffer.expires_at && new Date(linkedOffer.expires_at) < now) {
      return { ok: false, code: "OFFER_EXPIRED", message: REASON.OFFER_EXPIRED };
    }
    if (Number(linkedOffer.new_user_only) && userId) {
      const [orders] = await query("SELECT COUNT(*) AS count FROM orders WHERE user_id = ?", [userId]);
      if (Number(orders?.count || 0) > 0) {
        return { ok: false, code: "NEW_USER_FAILED", message: REASON.NEW_USER_FAILED };
      }
    }
  }

  // 7. Cart empty check
  if (!items || items.length === 0) {
    return { ok: false, code: "CART_EMPTY", message: REASON.CART_EMPTY };
  }

  // 8. Minimum cart value check
  const minCart = Number(coupon.minimum_cart_value || 0);
  if (minCart > 0 && Number(subtotal) < minCart) {
    const shortfall = toMoney(minCart - subtotal);
    return {
      ok: false,
      code: "MIN_CART_NOT_REACHED",
      message: `Minimum cart value of ₹${minCart} is required (add ₹${shortfall} more).`,
      minCart,
      shortfall,
    };
  }

  // 9. Existing Offer Stacking Rule
  // Check if any cart item has an active product offer/discount applied
  const hasExistingOfferDiscount = items.some((item) => {
    const orig = Number(item.original_price ?? item.price ?? 0);
    const finalP = Number(item.final_price ?? item.sale_price ?? item.price ?? 0);
    return orig > finalP || Number(item.discount_percent || 0) > 0 || Number(item.discount_amount || 0) > 0 || Boolean(item.offer_id);
  });

  if (!coupon.stack_with_offer && hasExistingOfferDiscount) {
    return {
      ok: false,
      code: "OFFER_STACK_DISALLOWED",
      message: REASON.OFFER_STACK_DISALLOWED,
    };
  }

  // 10. Applicable products / categories discount computation
  let eligibleSubtotal = 0;
  for (const item of items) {
    if (isItemEligible(coupon, linkedOffer, item)) {
      const itemPrice = Number(item.final_price ?? item.price ?? 0);
      const qty = Number(item.quantity !== undefined && item.quantity !== null ? item.quantity : 1);
      eligibleSubtotal += itemPrice * (qty > 0 ? qty : 1);
    }
  }

  if (eligibleSubtotal <= 0) {
    return { ok: false, code: "OFFER_NOT_APPLICABLE", message: REASON.OFFER_NOT_APPLICABLE };
  }

  const discountAmount = calculateDiscountAmount({ coupon, eligibleSubtotal });

  return {
    ok: true,
    code: "COUPON_OK",
    message: "Coupon applied successfully",
    coupon,
    offer: linkedOffer || { id: coupon.id, name: coupon.code, title: coupon.code },
    eligibleSubtotal: toMoney(eligibleSubtotal),
    discount: toMoney(discountAmount),
    discountAmount: toMoney(discountAmount),
    discountType: (coupon.discount_type || "PERCENTAGE").toUpperCase(),
  };
};

// ─── Authoritative Cart Totals ────────────────────────────────────────
const formatTotals = ({ subtotal, discount = 0, couponCode = null, couponOfferName = null, shipping = 0, tax = 0 }) => ({
  subtotal: toMoney(subtotal),
  discount: toMoney(discount),
  couponCode,
  couponOfferName,
  shipping: toMoney(shipping),
  tax: toMoney(tax),
  grandTotal: toMoney(Math.max(0, subtotal - discount + shipping + tax)),
  totalSavings: toMoney(discount),
});

const calculateCartTotals = async (userId) => {
  const { cart, items, subtotal } = await loadCartLines(userId);
  if (!cart.applied_coupon_code) return { ...formatTotals({ subtotal }), cartId: cart.id };

  const verdict = await validateCoupon({ userId, code: cart.applied_coupon_code, items, subtotal });
  if (!verdict.ok) {
    await clearCartCoupon(cart.id);
    return { ...formatTotals({ subtotal }), cartId: cart.id, invalidatedReason: verdict };
  }
  return {
    ...formatTotals({
      subtotal,
      discount: verdict.discount,
      couponCode: verdict.coupon.code,
      couponOfferName: verdict.coupon.description || verdict.coupon.code,
    }),
    cartId: cart.id,
  };
};

// ─── Apply & Remove Actions ───────────────────────────────────────────
const setCartCoupon = async (cartId, { couponId, code, discount }) => {
  await query(
    "UPDATE carts SET applied_coupon_id = ?, applied_coupon_code = ?, applied_coupon_discount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [couponId || null, code || null, discount || 0, cartId]
  );
};

const clearCartCoupon = async (cartId) => {
  await query(
    "UPDATE carts SET applied_coupon_id = NULL, applied_coupon_code = NULL, applied_coupon_discount = 0.00, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [cartId]
  );
};

const applyCoupon = async ({ userId, code, items: clientItems = null, subtotal: clientSubtotal = null }) => {
  const AppError = require("../utils/appError");
  let items = null;
  let subtotal = null;
  let cart = null;
  if (Array.isArray(clientItems) && clientItems.length) {
    // Validate against the cart the user actually sees (client-provided items,
    // e.g. a carryover guest cart) — NOT an empty DB cart.  Fixes
    // "Your cart is empty." when an authenticated checkout shows items but
    // the server cart has not been synced (or is otherwise stale).
    items = clientItems;
    subtotal = clientSubtotal !== null && clientSubtotal !== undefined ? Number(clientSubtotal) : items.reduce((s, i) => s + Number(i.final_price ?? i.price ?? 0) * Number(i.quantity ?? 1), 0);
    const loaded = await loadCartLines(userId);  // pers
    cart = loaded.cart;
  } else {
    const loaded = await loadCartLines(userId);
    cart = loaded.cart;
    items = loaded.items;
    subtotal = loaded.subtotal;
  }
  const verdict = await validateCoupon({ userId, code, items, subtotal });
  if (!verdict.ok) {
    const err = new AppError(verdict.message, 400, verdict.code);
    err.couponDetails = verdict;
    throw err;
  }
  await setCartCoupon(cart.id, { couponId: verdict.coupon.id, code: verdict.coupon.code, discount: verdict.discount });
  return {
    ...formatTotals({ subtotal, discount: verdict.discount, couponCode: verdict.coupon.code, couponOfferName: verdict.coupon.description || verdict.coupon.code }),
    cartId: cart.id,
    coupon: {
      id: verdict.coupon.id,
      code: verdict.coupon.code,
      offerName: verdict.coupon.description || verdict.coupon.code,
      discount: verdict.discount,
      discountType: verdict.discountType,
    },
  };
};

const removeCoupon = async ({ userId }) => {
  const { cart, subtotal } = await loadCartLines(userId);
  await clearCartCoupon(cart.id);
  return { ...formatTotals({ subtotal }), cartId: cart.id };
};

const getUserCoupons = async (userId) => {
  const rows = await query(
    `SELECT c.*, ${OFFER_FIELDS}
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     WHERE c.user_id = ? AND c.is_active = 1 AND (c.expires_at IS NULL OR c.expires_at >= NOW())
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows.map((row) => {
    const c = normalizeCouponRow(row);
    return {
      id: c.id,
      code: c.code,
      couponType: c.coupon_type,
      status: c.status,
      expiresAt: c.expires_at,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      maxDiscount: c.maximum_discount,
      minOrder: c.minimum_cart_value,
      description: c.description,
    };
  });
};

const listAvailableCoupons = async (userId, clientItems = null, clientSubtotal = null) => {
  const { items: dbItems, subtotal: dbSubtotal } = await loadCartLines(userId);
  const rows = await query(
    `SELECT c.*, ${OFFER_FIELDS}
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     WHERE c.is_active = 1
       AND (c.expires_at IS NULL OR c.expires_at >= NOW())
       AND (c.starts_at IS NULL OR c.starts_at <= NOW())
       AND (c.user_id IS NULL OR c.user_id = ?)
       AND (c.usage_limit IS NULL OR c.usage_limit <= 0 OR c.used_count < c.usage_limit)
     ORDER BY c.created_at DESC
     LIMIT 30`,
    [userId || null]
  );

  /**
   * Preview-mode validation — used when the DB cart is empty.
   *
   * The DB cart can be empty even though the user's frontend cart has items,
   * because the frontend (CartContext / localStorage) and the DB cart are only
   * synchronised when items are added through the authenticated API.  If we fall
   * through to the full validateCoupon() in this state it returns CART_EMPTY for
   * every coupon and locks them all — which is the bug we're fixing.
   *
   * Preview-mode checks only the coupon's own properties (status, dates, usage)
   * that are independent of cart contents.  Min-cart coupons are shown as locked
   * with a helpful message.  Full validation (including cart contents) still runs
   * at apply-time — no security is bypassed.
   */
  const previewValidateCoupon = async (coupon, userIdArg) => {
    const now = new Date();

    // 1. Active + status
    if (!coupon.is_active || coupon.status === COUPON_STATUS.DISABLED) {
      return { ok: false, code: "COUPON_DISABLED", message: REASON.COUPON_DISABLED };
    }
    if (coupon.status === COUPON_STATUS.USED) {
      return { ok: false, code: "COUPON_USED", message: REASON.COUPON_USED };
    }
    if (coupon.status === COUPON_STATUS.EXPIRED) {
      return { ok: false, code: "COUPON_EXPIRED", message: REASON.COUPON_EXPIRED };
    }

    // 2. Date window
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { ok: false, code: "COUPON_NOT_STARTED", message: REASON.COUPON_NOT_STARTED };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { ok: false, code: "COUPON_EXPIRED", message: REASON.COUPON_EXPIRED };
    }

    // 3. Global usage limit
    const globalUsage = await countCouponUsage(coupon.id);
    const effectiveUsageCount = Math.max(globalUsage, coupon.used_count || 0);
    if (effectiveUsageCount >= usageLimitValue(coupon.usage_limit)) {
      return { ok: false, code: "COUPON_LIMIT", message: REASON.COUPON_LIMIT };
    }

    // 4. Per-user usage limit
    if (userIdArg) {
      const userUsage = await countCouponUsageForUser(coupon.id, userIdArg);
      if (userUsage >= Number(coupon.per_user_limit || 1)) {
        return { ok: false, code: "COUPON_USER_LIMIT", message: REASON.PER_USER_LIMIT };
      }
    }

    // 5. User assignment
    if (coupon.user_id && Number(coupon.user_id) !== Number(userIdArg)) {
      return { ok: false, code: "COUPON_NOT_ASSIGNED", message: REASON.COUPON_NOT_ASSIGNED };
    }

    // 6. Linked offer checks (status + dates only — no cart needed)
    if (coupon.offer_id) {
      const linkedOffer = await getOfferScope(coupon.offer_id);
      if (!linkedOffer) {
        return { ok: false, code: "OFFER_MISSING", message: REASON.OFFER_MISSING };
      }
      if (!Number(linkedOffer.is_active)) {
        return { ok: false, code: "OFFER_INACTIVE", message: REASON.OFFER_INACTIVE };
      }
      if (linkedOffer.starts_at && new Date(linkedOffer.starts_at) > now) {
        return { ok: false, code: "OFFER_NOT_STARTED", message: REASON.OFFER_NOT_STARTED };
      }
      if (linkedOffer.expires_at && new Date(linkedOffer.expires_at) < now) {
        return { ok: false, code: "OFFER_EXPIRED", message: REASON.OFFER_EXPIRED };
      }
    }

    // 7. Minimum cart value — in preview mode we can only check this statically.
    //    If the coupon has no minimum, it is eligible (cart contents are irrelevant).
    //    If it has a minimum, mark it locked with a clear reason so the user knows
    //    what they need to add.  The actual cart amount will be validated at apply-time.
    const minCart = Number(coupon.minimum_cart_value || 0);
    if (minCart > 0) {
      return {
        ok: false,
        code: "MIN_CART_NOT_REACHED",
        message: `Minimum cart value of ₹${minCart} is required.`,
        minCart,
        shortfall: minCart, // Conservative: we have no cart data, assume full shortfall
      };
    }

    // All checks passed — coupon is eligible (no cart restrictions to verify)
    return { ok: true, code: "COUPON_OK", message: "You can use this coupon on this order.", discount: 0 };
  };

  // Use the client-provided cart (the user's REAL cart from the frontend) when
  // available.  It is passed from Checkout and reflects the true cart contents
  // even if the persisted DB cart is empty/out-of-sync — so min-cart, product,
  // category and stacking conditions are evaluated against real values instead
  // of force-locking every min-cart coupon.
  const hasClientCart = Array.isArray(clientItems) && clientItems.length > 0;
  let effectiveItems = hasClientCart ? clientItems : dbItems;
  const effectiveSubtotal = hasClientCart ? toMoney(clientSubtotal) : dbSubtotal;

  // Client-supplied cart items may not carry category_id (frontend cart context
  // omits it).  Enrich them from the products table so product/category-scoped
  // coupons are evaluated correctly instead of being locked for a missing field.
  if (hasClientCart && effectiveItems.some((it) => it.category_id === undefined || it.category_id === null)) {
    const productIds = [...new Set(effectiveItems.map((it) => Number(it.product_id)).filter((n) => n > 0))];
    if (productIds.length) {
      const ph = productIds.map(() => "?").join(",");
      try {
        const catRows = await query(`SELECT id, category_id FROM products WHERE id IN (${ph})`, productIds).catch(() => []);
        const catMap = new Map((catRows || []).map((p) => [Number(p.id), Number(p.category_id)]));
        effectiveItems = effectiveItems.map((it) =>
          it.category_id === undefined || it.category_id === null
            ? { ...it, category_id: catMap.get(Number(it.product_id)) ?? null }
            : it
        );
      } catch {
        // ignore enrichment failures — pair with any missing category data gracefully
      }
    }
  }

  // Choose full validation (any real cart present) or preview validation
  const cartIsEmpty = !effectiveItems || effectiveItems.length === 0;

  const coupons = [];
  for (const row of rows || []) {
    const c = normalizeCouponRow(row);
    if (userId) {
      const usedByUser = await countCouponUsageForUser(c.id, userId);
      if (usedByUser >= Number(c.per_user_limit || 1)) continue;
    }

    let verdict;
    if (cartIsEmpty) {
      // No cart data at all — use preview-mode so CART_EMPTY doesn't lock everything
      verdict = await previewValidateCoupon(c, userId);
    } else {
      // Real cart present — run the full authoritative validation
      verdict = await validateCoupon({ userId, code: c.code, items: effectiveItems, subtotal: effectiveSubtotal });
    }

    const minOrder = Number(c.minimum_cart_value || 0);

    coupons.push({
      id: c.id,
      code: c.code,
      couponType: c.coupon_type,
      title: c.description || c.code,
      description: c.description || "",
      discountType: c.discount_type,
      discountValue: c.discount_value,
      maxDiscount: c.maximum_discount,
      minOrder,
      expiresAt: c.expires_at,
      stackWithOffer: c.stack_with_offer,
      eligible: verdict.ok,
      locked: !verdict.ok,
      reasonCode: verdict.ok ? null : verdict.code,
      lockMessage: verdict.ok ? null : verdict.message,
      message: verdict.ok ? "You can use this coupon on this order." : verdict.message,
      shortfall: verdict.ok ? 0 : toMoney(verdict.shortfall || 0),
      estimatedDiscount: verdict.ok ? (verdict.discount || 0) : 0,
    });
  }

  coupons.sort(
    (a, b) =>
      Number(b.eligible) - Number(a.eligible) ||
      b.estimatedDiscount - a.estimatedDiscount ||
      a.minOrder - b.minOrder
  );

  return { coupons, subtotal: cartIsEmpty ? toMoney(dbSubtotal) : toMoney(effectiveSubtotal) };
};


const validateCouponCode = async ({ userId, code, items: clientItems, cartTotal }) => {
  let items = clientItems;
  let subtotal = cartTotal;

  if (!items || !items.length) {
    if (userId) {
      const loaded = await loadCartLines(userId);
      items = loaded.items;
      subtotal = loaded.subtotal;
    } else {
      items = [];
      subtotal = Number(cartTotal || 0);
    }
  }

  const verdict = await validateCoupon({ userId, code, items, subtotal });
  if (!verdict.ok) {
    return {
      valid: false,
      success: false,
      code: verdict.code,
      message: verdict.message,
      minCart: verdict.minCart ?? null,
      shortfall: verdict.shortfall ?? null,
    };
  }

  return {
    valid: true,
    success: true,
    code: "COUPON_OK",
    couponCode: verdict.coupon.code,
    discountType: (verdict.coupon.discount_type || "PERCENTAGE").toUpperCase(),
    discountAmount: verdict.discount,
    message: "Coupon applied successfully",
    coupon: {
      id: verdict.coupon.id,
      code: verdict.coupon.code,
      discountType: verdict.coupon.discount_type,
      discountValue: verdict.coupon.discount_value,
      description: verdict.coupon.description || verdict.coupon.code,
    },
    totals: formatTotals({
      subtotal,
      discount: verdict.discount,
      couponCode: verdict.coupon.code,
      couponOfferName: verdict.coupon.description || verdict.coupon.code,
    }),
  };
};

// ─── Welcome Coupons ──────────────────────────────────────────────────
const generateWelcomeCoupon = async (userId) => {
  if (!userId) return null;
  const existing = await query(
    "SELECT id FROM coupons WHERE user_id = ? AND coupon_type = 'welcome' AND is_active = 1 LIMIT 1",
    [userId]
  );
  if (existing[0]) return getCouponById(existing[0].id);

  const code = await generateUniqueCouponCode({ prefix: "WELCOME", length: 6 });
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  return createCoupon({
    code,
    description: "Welcome gift: 10% off your first order",
    discount_type: "percentage",
    discount_value: 10,
    minimum_cart_value: 500,
    maximum_discount: 200,
    user_id: userId,
    coupon_type: COUPON_TYPES.WELCOME,
    per_user_limit: 1,
    is_active: 1,
    status: COUPON_STATUS.ACTIVE,
    expires_at: expiresAt,
  });
};

const notifyCouponsNearExpiry = async ({ windowHours = 48 } = {}) => {
  const safeWindow = Math.max(1, Math.min(240, parseInt(windowHours, 10) || 48));
  const rows = await query(
    `SELECT c.id, c.code, c.user_id, c.expires_at, c.discount_type, c.discount_value
     FROM coupons c
     WHERE c.is_active = 1
       AND c.user_id IS NOT NULL
       AND c.expires_at IS NOT NULL
       AND c.expires_at > NOW()
       AND c.expires_at <= DATE_ADD(NOW(), INTERVAL ? HOUR)`,
    [safeWindow]
  );

  let created = 0;
  for (const row of rows || []) {
    try {
      const { createNotification } = require("./notificationService");
      const label = row.discount_type === "percentage" ? `${Math.round(Number(row.discount_value))}% off ` : `₹${row.discount_value} off `;
      await createNotification({
        userId: row.user_id,
        type: "OFFER",
        title: "Your coupon expires soon",
        message: `⏰ Your coupon ${row.code} (${label}) expires soon`,
        data: { couponCode: row.code, couponId: row.id },
        actionUrl: "/dashboard?tab=offers-coupons",
        eventKey: `COUPON_EXPIRY:${row.id}`,
        entityType: "coupon",
        entityId: row.id,
      });
      created += 1;
    } catch (error) {
      console.warn("[COUPON] Expiry reminder failed:", error.message);
    }
  }
  return created;
};

module.exports = {
  COUPON_STATUS,
  COUPON_TYPES,
  normalizeCouponCode,
  generateUniqueCouponCode,
  REASON,
  getCouponById,
  getCouponByCode,
  listCoupons,
  countCouponUsage,
  countCouponUsageForUser,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  validateCoupon,
  calculateDiscountAmount,
  getOfferScope,
  calculateCartTotals,
  applyCoupon,
  removeCoupon,
  getUserCoupons,
  listAvailableCoupons,
  validateCouponCode,
  generateWelcomeCoupon,
  notifyCouponsNearExpiry,
  findOrCreateCart,
  loadCartLines,
  clearCartCoupon,
  setCartCoupon,
};