const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl, withNormalizedImageUrl } = require("../utils/uploadPaths");

/** GET /api/admin/products?page=1&limit=20&search=&category= */
const listProducts = asyncHandler(async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const categoryId = req.query.category || null;

    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (p.name LIKE ? OR p.description LIKE ?)";
      params.push(search, search);
    }
    if (categoryId) {
      where += " AND p.category_id = ?";
      params.push(categoryId);
    }

    const [totalRow] = await query(
      `SELECT COUNT(*) AS count FROM products p ${where}`,
      params
    );

    const products = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return success(res, "Products fetched", {
      products: products.map(withNormalizedImageUrl),
      pagination: {
        total: Number(totalRow.count),
        page,
        limit,
        pages: Math.ceil(Number(totalRow.count) / limit),
      },
    });
  } catch (error) {
    console.error("[PRODUCT LIST ERROR]", error);
    throw new AppError(error.message || "Failed to list products", 500, "DATABASE_ERROR");
  }
});

/** GET /api/admin/products/:id */
const getProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id) {
      throw new AppError("Product ID is required", 400, "VALIDATION_ERROR");
    }

    const [product] = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    return success(res, "Product fetched", { product: withNormalizedImageUrl(product) });
  } catch (error) {
    console.error("[GET PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(error.message || "Failed to fetch product", 500, "DATABASE_ERROR");
  }
});

/** POST /api/admin/products */
const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("[CREATE PRODUCT] Request body:", {
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      category_id: req.body.category_id,
      image_url: req.body.image_url ? "***present***" : "***missing***"
    });

    // Validation
    if (!req.body.name || !req.body.name.trim()) {
      throw new AppError("Product name is required", 400, "VALIDATION_ERROR");
    }

    if (req.body.price === undefined || req.body.price === null || req.body.price === '') {
      throw new AppError("Price is required", 400, "VALIDATION_ERROR");
    }

    const numPrice = parseFloat(req.body.price);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new AppError("Price must be a valid positive number", 400, "VALIDATION_ERROR");
    }

    // Prepare data with safe defaults
    const name = String(req.body.name).trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    const price = numPrice;
    const stock = Math.max(0, parseInt(req.body.stock) || 0);
    const category_id = req.body.category_id ? parseInt(req.body.category_id) || null : null;
    const image_url = normalizeImageUrl(req.body.image_url);
    const status = (req.body.status || 'active');
    const featured = req.body.featured ? 1 : 0;
    const brand = req.body.brand ? String(req.body.brand).trim() : '';
    const features = req.body.features ? String(req.body.features).trim() : null;

    // Generate unique slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + 
      "-" + Date.now().toString(36);

    console.log("[CREATE PRODUCT] Prepared data:", { name, price, stock, slug, image_url });

    // Insert into database
    console.log("[CREATE PRODUCT] Executing INSERT query...");
    const result = await query(
      `INSERT INTO products 
       (name, slug, description, price, stock, stock_quantity, category_id, image_url, status, featured, brand, features, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description, price, stock, stock, category_id, image_url, status, featured, brand, features]
    );

    console.log("[CREATE PRODUCT] Insert successful. Product ID:", result.insertId);

    // Fetch created product
    const [created] = await query("SELECT * FROM products WHERE id = ?", [result.insertId]);
    
    if (!created) {
      throw new AppError("Product created but could not be retrieved", 500, "DATABASE_ERROR");
    }

    console.log("[CREATE PRODUCT] ✅ Product created successfully:", {
      id: created.id,
      name: created.name,
      price: created.price,
      image_url: created.image_url
    });

    return success(res, "Product created successfully", { product: withNormalizedImageUrl(created) }, 201);

  } catch (error) {
    console.error("[CREATE PRODUCT ERROR]", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    if (error.statusCode) throw error;
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new AppError("Invalid category selected", 400, "VALIDATION_ERROR");
    }
    
    throw new AppError(error.message || "Failed to create product", 500, "DATABASE_ERROR");
  }
});

/** PUT /api/admin/products/:id */
const updateProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id) {
      throw new AppError("Product ID is required", 400, "VALIDATION_ERROR");
    }

    console.log("[UPDATE PRODUCT] Updating product ID:", req.params.id);

    const existing = await query("SELECT id FROM products WHERE id = ?", [req.params.id]);
    if (!existing.length) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    // Validation
    if (!req.body.name || !req.body.name.trim()) {
      throw new AppError("Product name is required", 400, "VALIDATION_ERROR");
    }

    if (req.body.price === undefined || req.body.price === null || req.body.price === '') {
      throw new AppError("Price is required", 400, "VALIDATION_ERROR");
    }

    const numPrice = parseFloat(req.body.price);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new AppError("Price must be a valid positive number", 400, "VALIDATION_ERROR");
    }

    // Prepare data with safe defaults
    const name = String(req.body.name).trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    const price = numPrice;
    const stock = Math.max(0, parseInt(req.body.stock) || 0);
    const category_id = req.body.category_id ? parseInt(req.body.category_id) || null : null;
    const image_url = normalizeImageUrl(req.body.image_url);
    const status = (req.body.status || 'active');
    const featured = req.body.featured ? 1 : 0;
    const brand = req.body.brand ? String(req.body.brand).trim() : '';
    const features = req.body.features ? String(req.body.features).trim() : null;

    console.log("[UPDATE PRODUCT] Executing UPDATE query...");

    await query(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock = ?, stock_quantity = ?, category_id = ?,
           image_url = ?, status = ?, featured = ?, brand = ?, features = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description, price, stock, stock, category_id, image_url, status, featured, brand, features, req.params.id]
    );

    console.log("[UPDATE PRODUCT] Update successful");

    const [updated] = await query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!updated) {
      throw new AppError("Product updated but could not be retrieved", 500, "DATABASE_ERROR");
    }

    console.log("[UPDATE PRODUCT] ✅ Product updated successfully");

    return success(res, "Product updated successfully", { product: withNormalizedImageUrl(updated) });

  } catch (error) {
    console.error("[UPDATE PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(error.message || "Failed to update product", 500, "DATABASE_ERROR");
  }
});

/** DELETE /api/admin/products/:id */
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id) {
      throw new AppError("Product ID is required", 400, "VALIDATION_ERROR");
    }

    console.log("[DELETE PRODUCT] Deleting product ID:", req.params.id);

    const existing = await query("SELECT id FROM products WHERE id = ?", [req.params.id]);
    if (!existing.length) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    await query("DELETE FROM products WHERE id = ?", [req.params.id]);
    console.log("[DELETE PRODUCT] ✅ Product deleted successfully");

    return success(res, "Product deleted successfully");

  } catch (error) {
    console.error("[DELETE PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(error.message || "Failed to delete product", 500, "DATABASE_ERROR");
  }
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
