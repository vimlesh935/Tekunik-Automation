const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { withNormalizedImageUrl } = require("../utils/uploadPaths");

/** GET /api/categories - Public endpoint for fetching all categories */
const getPublicCategories = asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT pc.*, COUNT(p.id) AS product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id
    GROUP BY pc.id
    ORDER BY pc.name ASC
  `);
  return success(res, "Categories fetched", { categories: rows.map(withNormalizedImageUrl) });
});

module.exports = { getPublicCategories };
