const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl, withNormalizedImageUrl } = require("../utils/uploadPaths");

/** GET /api/admin/categories */
const listCategories = asyncHandler(async (req, res) => {
  const rows = await query(`
    SELECT pc.*, COUNT(p.id) AS product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id
    GROUP BY pc.id
    ORDER BY pc.name ASC
  `);
  return success(res, "Categories fetched", { categories: rows.map(withNormalizedImageUrl) });
});

/** POST /api/admin/categories */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const image_url = normalizeImageUrl(req.body.image_url);
  if (!name || !name.trim()) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Check duplicate slug
  const existing = await query("SELECT id FROM product_categories WHERE slug = ?", [slug]);
  if (existing.length) throw new AppError("A category with this name already exists", 409, "DUPLICATE_SLUG");

  const result = await query(
    "INSERT INTO product_categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)",
    [name.trim(), slug, description || null, image_url]
  );

  const [created] = await query("SELECT * FROM product_categories WHERE id = ?", [result.insertId]);
  return success(res, "Category created", { category: withNormalizedImageUrl(created) }, 201);
});

/** PUT /api/admin/categories/:id */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const image_url = normalizeImageUrl(req.body.image_url);
  if (!name || !name.trim()) throw new AppError("Category name is required", 400, "VALIDATION_ERROR");

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = await query("SELECT id FROM product_categories WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Category not found", 404, "NOT_FOUND");

  await query(
    "UPDATE product_categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?",
    [name.trim(), slug, description || null, image_url, id]
  );

  const [updated] = await query("SELECT * FROM product_categories WHERE id = ?", [id]);
  return success(res, "Category updated", { category: withNormalizedImageUrl(updated) });
});

/** DELETE /api/admin/categories/:id */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query("SELECT id FROM product_categories WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Category not found", 404, "NOT_FOUND");

  // Unlink products before deleting
  await query("UPDATE products SET category_id = NULL WHERE category_id = ?", [id]);
  await query("DELETE FROM product_categories WHERE id = ?", [id]);
  return success(res, "Category deleted");
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
