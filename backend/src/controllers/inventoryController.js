const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { withNormalizedImageUrl } = require("../utils/uploadPaths");

const toCategorySlug = (value) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const resolvePublicCategoryFilter = async (queryParams) => {
  const rawCategoryId = String(queryParams.category_id || "").trim();
  const rawCategory = String(queryParams.category || "").trim();
  const rawCategoryName = String(queryParams.category_name || "").trim();
  const rawFilter = rawCategoryId || rawCategory || rawCategoryName;

  if (!rawFilter) {
    return { categoryId: null, categoryName: "All" };
  }

  const numericId = Number(rawFilter);
  if (Number.isInteger(numericId) && numericId > 0) {
    const [category] = await query(
      "SELECT id, name FROM product_categories WHERE id = ?",
      [numericId]
    );

    if (!category) {
      throw new AppError("Invalid category selected", 400, "VALIDATION_ERROR");
    }

    return { categoryId: category.id, categoryName: category.name };
  }

  const slug = toCategorySlug(rawFilter);
  const [category] = await query(
    "SELECT id, name FROM product_categories WHERE LOWER(name) = LOWER(?) OR slug = ?",
    [rawFilter, slug]
  );

  if (!category) {
    throw new AppError("Invalid category selected", 400, "VALIDATION_ERROR");
  }

  return { categoryId: category.id, categoryName: category.name };
};

/**
 * ✅ GET /api/admin/inventory
 * Dashboard: Total products, available, out of stock, low stock, recent updates
 */
const getInventoryDashboard = asyncHandler(async (req, res) => {
  const [totalProducts] = await query("SELECT COUNT(*) AS count FROM products WHERE status = 'active'");
  
  const [inStock] = await query(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND stock_quantity > low_stock_limit"
  );
  
  const [outOfStock] = await query(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND stock_quantity = 0"
  );
  
  const [lowStock] = await query(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'active' AND stock_quantity > 0 AND stock_quantity <= low_stock_limit"
  );

  const recentUpdates = await query(
    `SELECT p.id, p.name, p.stock_quantity, p.stock_status, il.action_type, il.created_at
     FROM inventory_logs il
     JOIN products p ON il.product_id = p.id
     ORDER BY il.created_at DESC
     LIMIT 10`
  );

  const alertProducts = await query(
    `SELECT p.id, p.name, p.stock_quantity, p.low_stock_limit, p.stock_status
     FROM products p
     WHERE status = 'active' AND (stock_quantity = 0 OR stock_quantity <= low_stock_limit)
     ORDER BY stock_quantity ASC
     LIMIT 10`
  );

  return success(res, "Inventory dashboard fetched", {
    summary: {
      totalProducts: totalProducts.count,
      inStock: inStock.count,
      outOfStock: outOfStock.count,
      lowStock: lowStock.count
    },
    recentUpdates,
    alertProducts
  });
});

/**
 * ✅ GET /api/admin/inventory?page=1&limit=20&search=&status=
 * List all products with inventory details
 */
const listInventory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const stockStatus = req.query.status || null;

  let where = "WHERE p.status = 'active'";
  const params = [];

  if (search) {
    where += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    params.push(search, search);
  }

  if (stockStatus) {
    where += " AND p.stock_status = ?";
    params.push(stockStatus);
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM products p ${where}`,
    params
  );

  const products = await query(
    `SELECT p.id, p.name, p.sku, p.price, p.stock_quantity, p.low_stock_limit, 
            p.stock_status, p.image_url, pc.name AS category_name, p.updated_at
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return success(res, "Inventory fetched", {
    products: products.map(withNormalizedImageUrl),
    pagination: {
      total: totalRow.count,
      page,
      limit,
      pages: Math.ceil(totalRow.count / limit)
    }
  });
});

/**
 * ✅ GET /api/admin/inventory/:id
 * Get single product inventory details
 */
const getInventoryItem = asyncHandler(async (req, res) => {
  const [product] = await query(
    `SELECT p.*, pc.name AS category_name
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     WHERE p.id = ?`,
    [req.params.id]
  );

  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");

  const logs = await query(
    `SELECT id, old_stock, new_stock, action_type, notes, created_at
     FROM inventory_logs
     WHERE product_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.params.id]
  );

  return success(res, "Inventory item fetched", { product: withNormalizedImageUrl(product), logs });
});

/**
 * ✅ PUT /api/admin/stock/:id
 * Update stock quantity for a product
 * Body: { stock_quantity, low_stock_limit?, action_type, notes? }
 */
const updateStock = asyncHandler(async (req, res) => {
  const { stock_quantity, low_stock_limit, action_type, notes } = req.body;
  const productId = req.params.id;

  // Validation
  if (stock_quantity === undefined || stock_quantity === null) {
    throw new AppError("stock_quantity is required", 400, "VALIDATION_ERROR");
  }

  if (stock_quantity < 0) {
    throw new AppError("Stock quantity cannot be negative", 400, "VALIDATION_ERROR");
  }

  if (!action_type) {
    throw new AppError("action_type is required", 400, "VALIDATION_ERROR");
  }

  // Get current product
  const [product] = await query("SELECT * FROM products WHERE id = ?", [productId]);
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");

  const oldStock = product.stock_quantity;
  const newStock = parseInt(stock_quantity);

  // Determine stock status
  let stockStatus = "in_stock";
  if (newStock === 0) stockStatus = "out_of_stock";
  else if (newStock <= (low_stock_limit || product.low_stock_limit))
    stockStatus = "limited_stock";

  // Update product
  await query(
    `UPDATE products 
     SET stock_quantity = ?, 
         stock_status = ?, 
         stock = ?,
         low_stock_limit = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newStock, stockStatus, newStock, low_stock_limit || product.low_stock_limit, productId]
  );

  // Log the update
  await query(
    `INSERT INTO inventory_logs (product_id, old_stock, new_stock, action_type, updated_by, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [productId, oldStock, newStock, action_type, req.user?.id || null, notes || null]
  );

  // Create alert if low stock
  if (newStock === 0) {
    await query(
      `INSERT INTO inventory_alerts (product_id, alert_type, message)
       VALUES (?, 'out_of_stock', ?)`,
      [productId, `Product "${product.name}" is now OUT OF STOCK`]
    );
  } else if (newStock > 0 && newStock <= product.low_stock_limit) {
    await query(
      `INSERT INTO inventory_alerts (product_id, alert_type, message)
       VALUES (?, 'low_stock', ?)`,
      [productId, `Product "${product.name}" has LOW STOCK (${newStock} items)`]
    );
  }

  const [updated] = await query("SELECT * FROM products WHERE id = ?", [productId]);
  return success(res, "Stock updated successfully", { 
    product: updated,
    oldStock,
    newStock
  });
});

/**
 * ✅ POST /api/admin/stock/bulk
 * Bulk update stock for multiple products
 * Body: { updates: [{ product_id, stock_quantity, action_type }, ...] }
 */
const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError("updates array is required and cannot be empty", 400, "VALIDATION_ERROR");
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const { product_id, stock_quantity, action_type, notes } = update;

      if (!product_id || stock_quantity === undefined || !action_type) {
        errors.push({ product_id, error: "Missing required fields" });
        continue;
      }

      if (stock_quantity < 0) {
        errors.push({ product_id, error: "Negative stock not allowed" });
        continue;
      }

      const [product] = await query("SELECT * FROM products WHERE id = ?", [product_id]);
      if (!product) {
        errors.push({ product_id, error: "Product not found" });
        continue;
      }

      const oldStock = product.stock_quantity;
      const newStock = parseInt(stock_quantity);

      let stockStatus = "in_stock";
      if (newStock === 0) stockStatus = "out_of_stock";
      else if (newStock <= product.low_stock_limit) stockStatus = "limited_stock";

      await query(
        `UPDATE products 
         SET stock_quantity = ?, stock_status = ?, stock = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newStock, stockStatus, newStock, product_id]
      );

      await query(
        `INSERT INTO inventory_logs (product_id, old_stock, new_stock, action_type, updated_by, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product_id, oldStock, newStock, action_type, req.user?.id || null, notes || null]
      );

      results.push({ product_id, oldStock, newStock, status: "updated" });
    } catch (error) {
      errors.push({ product_id: update.product_id, error: error.message });
    }
  }

  return success(res, "Bulk update completed", { results, errors, successCount: results.length }, 200);
});

/**
 * ✅ GET /api/admin/inventory/logs?page=1&limit=50
 * View inventory logs
 */
const getInventoryLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const [totalRow] = await query("SELECT COUNT(*) AS count FROM inventory_logs");

  const logs = await query(
    `SELECT il.*, p.name AS product_name, p.sku
     FROM inventory_logs il
     JOIN products p ON il.product_id = p.id
     ORDER BY il.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return success(res, "Inventory logs fetched", {
    logs,
    pagination: {
      total: totalRow.count,
      page,
      limit,
      pages: Math.ceil(totalRow.count / limit)
    }
  });
});

/**
 * ✅ GET /api/admin/inventory/alerts
 * Get low stock and out of stock alerts
 */
const getInventoryAlerts = asyncHandler(async (req, res) => {
  const alerts = await query(
    `SELECT ia.*, p.name AS product_name, p.sku, p.stock_quantity
     FROM inventory_alerts ia
     JOIN products p ON ia.product_id = p.id
     WHERE ia.is_read = FALSE
     ORDER BY ia.created_at DESC
     LIMIT 20`
  );

  const [unreadCount] = await query(
    "SELECT COUNT(*) AS count FROM inventory_alerts WHERE is_read = FALSE"
  );

  return success(res, "Alerts fetched", { alerts, unreadCount: unreadCount.count });
});

/**
 * ✅ PATCH /api/admin/inventory/alerts/:id/read
 * Mark alert as read
 */
const markAlertAsRead = asyncHandler(async (req, res) => {
  const [alert] = await query("SELECT * FROM inventory_alerts WHERE id = ?", [req.params.id]);
  if (!alert) throw new AppError("Alert not found", 404, "NOT_FOUND");

  await query("UPDATE inventory_alerts SET is_read = TRUE WHERE id = ?", [req.params.id]);

  return success(res, "Alert marked as read");
});

/**
 * ✅ GET /api/products (Public - User side)
 * Get all products with stock status for users
 */
const getPublicProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const { categoryId, categoryName: selectedCategoryName } = await resolvePublicCategoryFilter(req.query);

  let where = "WHERE p.status = 'active'";
  const params = [];

  if (search) {
    where += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push(search, search);
  }

  if (categoryId) {
    where += " AND p.category_id = ?";
    params.push(categoryId);
  }

  console.log("[PRODUCT FILTER] Selected Category ID:", categoryId || "ALL");
  console.log("[PRODUCT FILTER] Selected Category Name:", selectedCategoryName);
  console.log("[PRODUCT FILTER] API URL:", req.originalUrl);

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM products p ${where}`,
    params
  );

  const products = await query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock_quantity, 
            p.stock_status, p.image_url, p.featured, p.category_id, pc.name AS category_name
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     ${where}
     ORDER BY p.featured DESC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  console.log("[PRODUCT FILTER] Returned Products Count:", products.length);
  products.forEach((product) => {
    console.log("[PRODUCT FILTER] Product:", product.name, "Category ID:", product.category_id);
  });

  return success(res, "Products fetched", {
    products: products.map(p => ({
      ...withNormalizedImageUrl(p),
      isAvailable: p.stock_quantity > 0,
      stockStatus: p.stock_status
    })),
    pagination: {
      total: totalRow.count,
      page,
      limit,
      pages: Math.ceil(totalRow.count / limit)
    }
  });
});

/** ✅ GET /api/products/:id (Public product detail) */
const getPublicProductById = asyncHandler(async (req, res) => {
  const [product] = await query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.stock_quantity,
            p.stock_status, p.image_url, p.featured, p.status, p.category_id, pc.name AS category_name
     FROM products p
     LEFT JOIN product_categories pc ON p.category_id = pc.id
     WHERE p.id = ? AND p.status = 'active'`,
    [req.params.id]
  );

  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  return success(res, "Product details fetched", {
    product: {
      ...withNormalizedImageUrl(product),
      isAvailable: product.stock_quantity > 0,
    },
  });
});

module.exports = {
  getInventoryDashboard,
  listInventory,
  getInventoryItem,
  updateStock,
  bulkUpdateStock,
  getInventoryLogs,
  getInventoryAlerts,
  markAlertAsRead,
  getPublicProducts,
  getPublicProductById,
};
