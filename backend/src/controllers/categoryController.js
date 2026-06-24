const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl, withNormalizedImageUrl } = require("../utils/uploadPaths");

/** GET /api/admin/categories (with subcategories) */
const listCategories = asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT pc.*, COUNT(p.id) AS product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id
    GROUP BY pc.id
    ORDER BY pc.name ASC
  `);

  // Fetch subcategories for each category
  const result = [];
  for (const cat of rows) {
    const subcategories = await query(
      "SELECT id, name, slug FROM subcategories WHERE category_id = ? ORDER BY name ASC",
      [cat.id]
    );
    result.push({ ...withNormalizedImageUrl(cat), subcategories });
  }

  return success(res, "Categories fetched", { categories: result });
});

/** GET /api/admin/categories/:id - Single category with subcategories */
const getCategory = asyncHandler(async (req, res) => {
  const [category] = await query("SELECT * FROM product_categories WHERE id = ?", [req.params.id]);
  if (!category) throw new AppError("Category not found", 404, "NOT_FOUND");

  const subcategories = await query(
    "SELECT id, name, slug FROM subcategories WHERE category_id = ? ORDER BY name ASC",
    [req.params.id]
  );

  return success(res, "Category fetched", {
    category: { ...withNormalizedImageUrl(category), subcategories }
  });
});

/** POST /api/admin/categories */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const image_url = normalizeImageUrl(req.body.image_url);
  const thumbnail_image = normalizeImageUrl(req.body.thumbnail_image);
  const banner_image = normalizeImageUrl(req.body.banner_image);
  const icon_image = normalizeImageUrl(req.body.icon_image);

  if (!name || !name.trim()) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = await query("SELECT id FROM product_categories WHERE slug = ?", [slug]);
  if (existing.length) throw new AppError("A category with this name already exists", 409, "DUPLICATE_SLUG");

  const result = await query(
    `INSERT INTO product_categories (name, slug, description, image_url, thumbnail_image, banner_image, icon_image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name.trim(), slug, description || null, image_url, thumbnail_image, banner_image, icon_image]
  );

  const [created] = await query("SELECT * FROM product_categories WHERE id = ?", [result.insertId]);
  return success(res, "Category created", { category: withNormalizedImageUrl(created) }, 201);
});

/** PUT /api/admin/categories/:id */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const image_url = normalizeImageUrl(req.body.image_url);
  const thumbnail_image = normalizeImageUrl(req.body.thumbnail_image);
  const banner_image = normalizeImageUrl(req.body.banner_image);
  const icon_image = normalizeImageUrl(req.body.icon_image);

  if (!name || !name.trim()) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

  const existing = await query("SELECT id FROM product_categories WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Category not found", 404, "NOT_FOUND");

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await query(
    `UPDATE product_categories
     SET name = ?, slug = ?, description = ?, image_url = ?,
         thumbnail_image = ?, banner_image = ?, icon_image = ?
     WHERE id = ?`,
    [name.trim(), slug, description || null, image_url, thumbnail_image, banner_image, icon_image, id]
  );

  const [updated] = await query("SELECT * FROM product_categories WHERE id = ?", [id]);
  return success(res, "Category updated", { category: withNormalizedImageUrl(updated) });
});

/** DELETE /api/admin/categories/:id */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query("SELECT id FROM product_categories WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Category not found", 404, "NOT_FOUND");

  await query("UPDATE products SET category_id = NULL WHERE category_id = ?", [id]);
  await query("DELETE FROM subcategories WHERE category_id = ?", [id]);
  await query("DELETE FROM product_categories WHERE id = ?", [id]);
  return success(res, "Category deleted");
});

/** POST /api/admin/categories/:id/subcategories - Create subcategory */
const createSubcategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new AppError("Subcategory name is required", 400, "VALIDATION_ERROR");

  const catExists = await query("SELECT id FROM product_categories WHERE id = ?", [req.params.id]);
  if (!catExists.length) throw new AppError("Category not found", 404, "NOT_FOUND");

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await query(
    "INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)",
    [req.params.id, name.trim(), slug]
  );

  return success(res, "Subcategory created", null, 201);
});

/** DELETE /api/admin/subcategories/:id */
const deleteSubcategory = asyncHandler(async (req, res) => {
  await query("DELETE FROM subcategories WHERE id = ?", [req.params.id]);
  return success(res, "Subcategory deleted");
});

module.exports = {
  listCategories, getCategory, createCategory, updateCategory, deleteCategory,
  createSubcategory, deleteSubcategory
};
