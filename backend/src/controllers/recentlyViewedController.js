const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl } = require("../utils/uploadPaths");
const { ACTIVITY_TYPES, createActivity, detectHighProductInterest, detectProductDemand } = require("../services/adminActivityService");

const parseProductId = (value) => {
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId < 1) {
    throw new AppError("Invalid product ID", 400, "VALIDATION_ERROR");
  }
  return productId;
};

const productSelect = `
  SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.discount_percent,
         p.stock, p.stock_quantity, p.stock_status, p.image_url,
         p.category_id, pc.name AS category_name,
         COALESCE(AVG(CASE WHEN r.is_approved = 1 AND r.show_on_website = 1 THEN r.rating END), 0) AS average_rating,
         COUNT(CASE WHEN r.is_approved = 1 AND r.show_on_website = 1 THEN r.id END) AS total_reviews
  FROM recently_viewed_products rv
  INNER JOIN products p ON p.id = rv.product_id AND p.status = 'active'
  LEFT JOIN product_categories pc ON pc.id = p.category_id
  LEFT JOIN product_reviews r ON r.product_id = p.id
`;

const serializeProduct = (product) => ({
  ...product,
  image_url: normalizeImageUrl(product.image_url),
  average_rating: Number(product.average_rating) || 0,
  total_reviews: Number(product.total_reviews) || 0,
  reviews: {
    averageRating: Number(product.average_rating) || 0,
    totalReviews: Number(product.total_reviews) || 0,
  },
});

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const products = await query(
    `${productSelect}
     WHERE rv.user_id = ?
     GROUP BY rv.id, rv.viewed_at, p.id, pc.name
     ORDER BY rv.viewed_at DESC
     LIMIT 10`,
    [req.user.id],
  );
  return success(res, "Recently viewed products fetched", {
    products: products.map(serializeProduct),
  });
});

const addRecentlyViewed = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.body?.productId);
  const [product] = await query(
    "SELECT id FROM products WHERE id = ? AND status = 'active' LIMIT 1",
    [productId],
  );
  if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");

  await query(
    `INSERT INTO recently_viewed_products (user_id, product_id, viewed_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP`,
    [req.user.id, productId],
  );

  // Admin activity: product viewed (LOW priority, informational)
  try {
    const [product] = await query("SELECT id, name, price FROM products WHERE id = ?", [productId]);
    if (product) {
      await createActivity({
        userId: req.user.id,
        activityType: ACTIVITY_TYPES.PRODUCT_VIEWED,
        entityType: "product",
        entityId: productId,
        metadata: {
          productId,
          productName: product.name,
          price: product.price,
        },
      });
      // Smart detection: high product interest + demand
      await detectHighProductInterest(req.user.id, productId);
      await detectProductDemand(productId);
    }
  } catch (activityError) {
    console.warn("[ACTIVITY] Recently viewed activity failed:", activityError.message);
  }

  return success(res, "Recently viewed product recorded", { productId });
});

const removeRecentlyViewed = asyncHandler(async (req, res) => {
  const productId = parseProductId(req.params.productId);
  await query(
    "DELETE FROM recently_viewed_products WHERE user_id = ? AND product_id = ?",
    [req.user.id, productId],
  );
  return success(res, "Recently viewed product removed", { productId });
});

const clearRecentlyViewed = asyncHandler(async (req, res) => {
  await query("DELETE FROM recently_viewed_products WHERE user_id = ?", [req.user.id]);
  return success(res, "Recently viewed products cleared", { products: [] });
});

module.exports = {
  getRecentlyViewed,
  addRecentlyViewed,
  removeRecentlyViewed,
  clearRecentlyViewed,
};