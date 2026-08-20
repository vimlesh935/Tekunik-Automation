const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const {
  getActiveOffers,
  enrichProductsWithOffers,
} = require("../services/offerPricingService");

/** GET /api/admin/discounts */
const listDiscounts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const [totalRow] = await query("SELECT COUNT(*) AS count FROM discounts");

  const discounts = await query(
    `SELECT d.*
     FROM discounts d
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  
  if (discounts.length > 0) {
    const offerIds = discounts.map(d => d.id);
    const placeholders = offerIds.map(() => "?").join(",");
    const offerProducts = await query(`SELECT offer_id, product_id FROM offer_products WHERE offer_id IN (${placeholders})`, offerIds);
    const offerCategories = await query(`SELECT offer_id, category_id FROM offer_categories WHERE offer_id IN (${placeholders})`, offerIds);
    
    for (const d of discounts) {
      d.product_ids = offerProducts.filter(op => op.offer_id === d.id).map(op => Number(op.product_id));
      d.category_ids = offerCategories.filter(oc => oc.offer_id === d.id).map(oc => Number(oc.category_id));
    }
  }

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
    `SELECT d.*
     FROM discounts d
     WHERE d.id = ?`,
    [req.params.id]
  );
  if (!discount) throw new AppError("Discount not found", 404, "NOT_FOUND");
  
  const offerProducts = await query(`SELECT product_id FROM offer_products WHERE offer_id = ?`, [discount.id]);
  const offerCategories = await query(`SELECT category_id FROM offer_categories WHERE offer_id = ?`, [discount.id]);
  
  discount.product_ids = offerProducts.map(op => Number(op.product_id));
  discount.category_ids = offerCategories.map(oc => Number(oc.category_id));
  if (!discount) throw new AppError("Discount not found", 404, "NOT_FOUND");
  return success(res, "Discount fetched", { discount });
});

/** POST /api/admin/discounts */
const createDiscount = asyncHandler(async (req, res) => {
  const { 
    name, title, description, type, value, apply_to, product_ids, category_ids, 
    min_order_value, maximum_discount, banner_image, starts_at, expires_at, is_active 
  } = req.body;

  if (!name || !name.trim()) throw new AppError("Discount name is required", 400, "VALIDATION_ERROR");
  if (!type) throw new AppError("Discount type is required (percentage, fixed, bogo)", 400, "VALIDATION_ERROR");
  if (value === undefined || value === null) throw new AppError("Discount value is required", 400, "VALIDATION_ERROR");

  const validTypes = ["percentage", "fixed", "bogo"];
  if (!validTypes.includes(type)) {
    throw new AppError("Invalid discount type. Must be: percentage, fixed, or bogo", 400, "VALIDATION_ERROR");
  }

  const result = await query(
    `INSERT INTO discounts (name, title, description, type, value, apply_to, min_order_value, maximum_discount, banner_image, starts_at, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      title ? title.trim() : null,
      description ? description.trim() : null,
      type,
      parseFloat(value) || 0,
      apply_to || 'all',
      min_order_value ? parseFloat(min_order_value) : null,
      maximum_discount ? parseFloat(maximum_discount) : null,
      banner_image || null,
      starts_at || null,
      expires_at || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
    ]
  );

  const offerId = result.insertId;

  if (apply_to === 'selected_products' && Array.isArray(product_ids)) {
    for (const pid of product_ids) {
      await query(`INSERT INTO offer_products (offer_id, product_id) VALUES (?, ?)`, [offerId, pid]);
    }
  }

  if (apply_to === 'selected_category' && Array.isArray(category_ids)) {
    for (const cid of category_ids) {
      await query(`INSERT INTO offer_categories (offer_id, category_id) VALUES (?, ?)`, [offerId, cid]);
    }
  }

  const [created] = await query("SELECT * FROM discounts WHERE id = ?", [offerId]);
  return success(res, "Discount created", { discount: created }, 201);
});

/** PUT /api/admin/discounts/:id */
const updateDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, title, description, type, value, apply_to, product_ids, category_ids, 
    min_order_value, maximum_discount, banner_image, starts_at, expires_at, is_active 
  } = req.body;

  const existing = await query("SELECT id FROM discounts WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Discount not found", 404, "NOT_FOUND");

  if (!name || !name.trim()) throw new AppError("Discount name is required", 400, "VALIDATION_ERROR");

  const validTypes = ["percentage", "fixed", "bogo"];
  if (type && !validTypes.includes(type)) {
    throw new AppError("Invalid discount type. Must be: percentage, fixed, or bogo", 400, "VALIDATION_ERROR");
  }

  await query(
    `UPDATE discounts
     SET name = ?, title = ?, description = ?, type = ?, value = ?, apply_to = ?, min_order_value = ?,
         maximum_discount = ?, banner_image = ?, starts_at = ?, expires_at = ?, is_active = ?
     WHERE id = ?`,
    [
      name.trim(),
      title ? title.trim() : null,
      description ? description.trim() : null,
      type || "percentage",
      value !== undefined ? parseFloat(value) : 0,
      apply_to || 'all',
      min_order_value ? parseFloat(min_order_value) : null,
      maximum_discount ? parseFloat(maximum_discount) : null,
      banner_image || null,
      starts_at || null,
      expires_at || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id,
    ]
  );

  await query(`DELETE FROM offer_products WHERE offer_id = ?`, [id]);
  await query(`DELETE FROM offer_categories WHERE offer_id = ?`, [id]);

  if (apply_to === 'selected_products' && Array.isArray(product_ids)) {
    for (const pid of product_ids) {
      await query(`INSERT INTO offer_products (offer_id, product_id) VALUES (?, ?)`, [id, pid]);
    }
  }

  if (apply_to === 'selected_category' && Array.isArray(category_ids)) {
    for (const cid of category_ids) {
      await query(`INSERT INTO offer_categories (offer_id, category_id) VALUES (?, ?)`, [id, cid]);
    }
  }

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
  const offers = await getActiveOffers();
  return success(res, "Active offers fetched", {
    discounts: offers,
    offers,
  });
});

/** GET /api/offers/products - Public: Get products with active offer pricing */
const getActiveOfferProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 24));
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * limit;
  const offers = await getActiveOffers();

  if (!offers.length) {
    return success(res, "Offer products fetched", {
      products: [],
      offers: [],
      pagination: { total: 0, page, limit, pages: 0 },
    });
  }

  const productIds = offers
    .filter((offer) => offer.product_id)
    .map((offer) => Number(offer.product_id));
  const hasStorewideOffer = offers.some((offer) => offer.apply_to === 'all' && offer.min_order_value === null && !offer.product_id);

  let where = "WHERE p.status = 'active'";
  const params = [];
  
  if (!hasStorewideOffer) {
    const productSpecificIds = offers
      .filter(o => o.apply_to === 'selected_products')
      .flatMap(o => o.product_ids || []);
      
    const categorySpecificIds = offers
      .filter(o => o.apply_to === 'selected_category')
      .flatMap(o => o.category_ids || []);
      
    let offerConditions = [];
    if (productSpecificIds.length > 0) {
      offerConditions.push(`p.id IN (${productSpecificIds.map(() => "?").join(",")})`);
      params.push(...productSpecificIds);
    }
    if (categorySpecificIds.length > 0) {
      offerConditions.push(`p.category_id IN (${categorySpecificIds.map(() => "?").join(",")})`);
      params.push(...categorySpecificIds);
    }
    
    // Also include old product_id for backward compatibility
    const oldProductIds = offers.filter(o => o.apply_to === 'all' && o.product_id).map(o => o.product_id);
    if (oldProductIds.length > 0) {
      offerConditions.push(`p.id IN (${oldProductIds.map(() => "?").join(",")})`);
      params.push(...oldProductIds);
    }
    
    if (offerConditions.length > 0) {
      where += ` AND (${offerConditions.join(' OR ')})`;
    } else {
      return success(res, "Offer products fetched", {
        products: [],
        offers,
        pagination: { total: 0, page, limit, pages: 0 },
      });
    }
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count
     FROM products p
     ${where}`,
    params,
  );

  const products = await query(
    `SELECT p.*, pc.name AS category_name
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     ${where}
     ORDER BY p.featured DESC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const enrichedProducts = enrichProductsWithOffers(products, offers)
    .filter((product) => Number(product.discount_amount) > 0);

  return success(res, "Offer products fetched", {
    products: enrichedProducts,
    offers,
    pagination: {
      total: Number(totalRow?.count || enrichedProducts.length),
      page,
      limit,
      pages: Math.ceil(Number(totalRow?.count || 0) / limit),
    },
  });
});

/** GET /api/offers - Public: list all currently active offers with computed status */
const getPublicOffers = asyncHandler(async (req, res) => {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const offers = await query(
    `SELECT * FROM discounts
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (expires_at IS NULL OR expires_at >= ?)
     ORDER BY created_at DESC`,
    [now, now]
  );

  const offerIds = offers.map((o) => o.id);
  if (offerIds.length > 0) {
    const placeholders = offerIds.map(() => "?").join(",");
    const offerProducts = await query(`SELECT offer_id, product_id FROM offer_products WHERE offer_id IN (${placeholders})`, offerIds);
    const offerCategories = await query(`SELECT offer_id, category_id FROM offer_categories WHERE offer_id IN (${placeholders})`, offerIds);
    for (const o of offers) {
      o.product_ids = offerProducts.filter((op) => op.offer_id === o.id).map((op) => Number(op.product_id));
      o.category_ids = offerCategories.filter((oc) => oc.offer_id === o.id).map((oc) => Number(oc.category_id));
    }
  }

  return success(res, "Offers fetched", { offers });
});

/** GET /api/offers/:id - Public: single active offer */
const getPublicOffer = asyncHandler(async (req, res) => {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const [offer] = await query(
    `SELECT * FROM discounts WHERE id = ? AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (expires_at IS NULL OR expires_at >= ?)`,
    [req.params.id, now, now]
  );
  if (!offer) throw new AppError("Offer not found or not active", 404, "NOT_FOUND");

  const offerProducts = await query(`SELECT product_id FROM offer_products WHERE offer_id = ?`, [offer.id]);
  const offerCategories = await query(`SELECT category_id FROM offer_categories WHERE offer_id = ?`, [offer.id]);
  offer.product_ids = offerProducts.map((op) => Number(op.product_id));
  offer.category_ids = offerCategories.map((oc) => Number(oc.category_id));

  return success(res, "Offer fetched", { offer });
});

module.exports = {
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
  getActiveDiscounts,
  getActiveOfferProducts,
  getPublicOffers,
  getPublicOffer,
};
