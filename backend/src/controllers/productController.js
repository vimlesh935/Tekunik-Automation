const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const {
  imageUrlForFilename,
  normalizeImageUrl,
  withNormalizedImageUrl,
} = require("../utils/uploadPaths");

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object || {}, key);

const parseBooleanFlag = (value) => {
  if (value === true || value === 1) return 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(normalized) ? 1 : 0;
  }
  return value ? 1 : 0;
};

const parseRequiredCategoryId = (value) => {
  const normalized = String(value || "").trim();
  const categoryId = normalized ? Number(normalized) : null;
  if (!categoryId || !Number.isInteger(categoryId) || categoryId < 1) {
    throw new AppError("Product category is required", 400, "VALIDATION_ERROR");
  }
  return categoryId;
};

const buildProductListFilters = ({
  search,
  categoryId,
  statusFilter,
  featuredFilter,
}) => {
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
  if (statusFilter) {
    where += " AND p.status = ?";
    params.push(statusFilter);
  }
  if (featuredFilter !== null) {
    where += " AND p.featured = ?";
    params.push(featuredFilter);
  }

  return { where, params };
};

const assertCategoryExists = async (categoryId) => {
  const [category] = await query(
    "SELECT id, name FROM product_categories WHERE id = ?",
    [categoryId],
  );
  if (!category)
    throw new AppError("Invalid category selected", 400, "VALIDATION_ERROR");
  return category;
};

const getUploadedProductImageUrl = (req, fallback = null) => {
  if (req.file) {
    return imageUrlForFilename(req.file.filename, "product");
  }
  if (hasOwn(req.body, "image_url")) {
    return normalizeImageUrl(req.body.image_url);
  }
  return fallback;
};

// Helper to fetch product gallery, colors, sizes
const fetchProductExtras = async (productId) => {
  const images = await query(
    "SELECT id, image_url, is_main, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC",
    [productId],
  );
  const colors = await query(
    "SELECT id, color_name, color_code, stock_quantity FROM product_colors WHERE product_id = ? ORDER BY id ASC",
    [productId],
  );
  const sizes = await query(
    "SELECT id, size_name, stock_quantity FROM product_sizes WHERE product_id = ? ORDER BY id ASC",
    [productId],
  );
  return {
    images: images.map((i) => ({
      ...i,
      image_url: normalizeImageUrl(i.image_url),
    })),
    colors,
    sizes,
  };
};

// Helper to synchronize uploaded files with product_images table
const syncProductGallery = async (productId, files, bodyImageUrls) => {
  // Delete existing non-primary images that will be replaced
  // We keep any existing images if no new files/urls provided
  if (
    (!files || files.length === 0) &&
    (!bodyImageUrls || bodyImageUrls.length === 0)
  ) {
    return;
  }

  // Collect all image URLs from uploads
  const newImageUrls = [];

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const imgUrl = imageUrlForFilename(files[i].filename, "product");
      newImageUrls.push(imgUrl);
    }
  }

  // Also parse any URLs sent in body (existing uploaded URLs)
  if (bodyImageUrls && bodyImageUrls.length > 0) {
    for (const url of bodyImageUrls) {
      if (url && typeof url === "string" && url.trim()) {
        newImageUrls.push(normalizeImageUrl(url.trim()));
      }
    }
  }

  if (newImageUrls.length === 0) return;

  // Delete existing images for this product only if we're replacing with new uploads
  if (files && files.length > 0) {
    await query("DELETE FROM product_images WHERE product_id = ?", [productId]);
  }

  // Insert new images
  for (let i = 0; i < newImageUrls.length; i++) {
    const isMain = i === 0 ? 1 : 0;
    // Check if this URL already exists
    const [existing] = await query(
      "SELECT id FROM product_images WHERE product_id = ? AND image_url = ?",
      [productId, newImageUrls[i]],
    );
    if (!existing) {
      await query(
        "INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)",
        [productId, newImageUrls[i], isMain, i],
      );
    }
  }

  // Update main product image to first image
  if (newImageUrls.length > 0) {
    await query("UPDATE products SET image_url = ? WHERE id = ?", [
      newImageUrls[0],
      productId,
    ]);
  }
};

/** GET /api/admin/products?page=1&limit=20&search=&category_id= */
const listProducts = asyncHandler(async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const rawCategoryId = req.query.category_id || req.query.category || "";
    const normalizedCategoryId = String(rawCategoryId).trim();
    const categoryId = normalizedCategoryId
      ? Number(normalizedCategoryId)
      : null;

    if (
      normalizedCategoryId &&
      (!Number.isInteger(categoryId) || categoryId < 1)
    ) {
      throw new AppError("Invalid category_id", 400, "VALIDATION_ERROR");
    }

    const statusFilter = req.query.status || null;
    const hasFeaturedParam = Object.prototype.hasOwnProperty.call(
      req.query || {},
      "featured",
    );
    const featuredFilter = hasFeaturedParam
      ? parseBooleanFlag(req.query.featured)
      : null;

    const shouldFallbackToActiveWhenNoFeatured =
      featuredFilter === 1 &&
      String(req.query.featured_fallback || req.query.featuredFallback || "")
        .trim()
        .toLowerCase() === "true";

    let effectiveFeaturedFilter = featuredFilter;
    let { where, params } = buildProductListFilters({
      search,
      categoryId,
      statusFilter,
      featuredFilter: effectiveFeaturedFilter,
    });

    let [totalRow] = await query(
      `SELECT COUNT(*) AS count FROM products p ${where}`,
      params,
    );

    if (shouldFallbackToActiveWhenNoFeatured && Number(totalRow.count) === 0) {
      effectiveFeaturedFilter = null;
      ({ where, params } = buildProductListFilters({
        search,
        categoryId,
        statusFilter,
        featuredFilter: effectiveFeaturedFilter,
      }));
      [totalRow] = await query(
        `SELECT COUNT(*) AS count FROM products p ${where}`,
        params,
      );
    }

    const products = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    // Fetch review stats for all products in one query
    const productIds = products.map((p) => p.id);
    let reviewStatsMap = {};
    if (productIds.length > 0) {
      // Use individual placeholders for IN clause to avoid mysql2 parameter issues
      const placeholders = productIds.map(() => '?').join(',');
      const statsRows = await query(
        `SELECT product_id,
          AVG(rating) AS avg_rating,
          COUNT(*) AS total_reviews
        FROM product_reviews
        WHERE product_id IN (${placeholders}) AND is_approved = 1 AND show_on_website = 1
        GROUP BY product_id`,
        productIds
      );
      statsRows.forEach((row) => {
        reviewStatsMap[row.product_id] = {
          averageRating: parseFloat(row.avg_rating) || 0,
          totalReviews: Number(row.total_reviews) || 0,
        };
      });
    }

    // Fetch images for each product and merge review stats
    const result = [];
    for (const product of products) {
      const extras = await fetchProductExtras(product.id);
      const reviews = reviewStatsMap[product.id] || { averageRating: 0, totalReviews: 0 };
      result.push({
        ...withNormalizedImageUrl(product),
        ...extras,
        reviews,
      });
    }

    return success(res, "Products fetched", {
      products: result,
      pagination: {
        total: Number(totalRow.count),
        page,
        limit,
        pages: Math.ceil(Number(totalRow.count) / limit),
      },
    });
  } catch (error) {
    console.error("[PRODUCT LIST ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to list products",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** GET /api/products/:slug - Public product detail */
const getProduct = asyncHandler(async (req, res) => {
  try {
    const identifier = req.params.id || req.params.slug;
    const bySlug = !req.params.id && req.params.slug;

    let product;
    if (bySlug) {
      [product] = await query(
        `SELECT p.*, pc.name AS category_name, pc.slug AS category_slug
         FROM products p
         LEFT JOIN product_categories pc ON p.category_id = pc.id
         WHERE p.slug = ?`,
        [identifier],
      );
    } else {
      [product] = await query(
        `SELECT p.*, pc.name AS category_name, pc.slug AS category_slug
         FROM products p
         LEFT JOIN product_categories pc ON p.category_id = pc.id
         WHERE p.id = ?`,
        [identifier],
      );
    }

    if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");

    const extras = await fetchProductExtras(product.id);

    return success(res, "Product fetched", {
      product: { ...withNormalizedImageUrl(product), ...extras },
    });
  } catch (error) {
    console.error("[GET PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to fetch product",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** POST /api/admin/products */
const createProduct = asyncHandler(async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.name.trim()) {
      throw new AppError("Product name is required", 400, "VALIDATION_ERROR");
    }
    if (
      req.body.price === undefined ||
      req.body.price === null ||
      req.body.price === ""
    ) {
      throw new AppError("Price is required", 400, "VALIDATION_ERROR");
    }
    const numPrice = parseFloat(req.body.price);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new AppError(
        "Price must be a valid positive number",
        400,
        "VALIDATION_ERROR",
      );
    }

    const name = String(req.body.name).trim();
    const description = req.body.description
      ? String(req.body.description).trim()
      : null;
    const short_description = req.body.short_description
      ? String(req.body.short_description).trim()
      : null;
    const price = numPrice;
    const sale_price = req.body.sale_price
      ? parseFloat(req.body.sale_price)
      : null;
    const discount_percent = req.body.discount_percent
      ? parseFloat(req.body.discount_percent)
      : null;
    const stock = Math.max(0, parseInt(req.body.stock) || 0);
    const category_id = parseRequiredCategoryId(req.body.category_id);
    const subcategory_id = req.body.subcategory_id
      ? parseInt(req.body.subcategory_id)
      : null;
    const category = await assertCategoryExists(category_id);
    const sku = req.body.sku ? String(req.body.sku).trim() : null;
    const brand = req.body.brand ? String(req.body.brand).trim() : "";
    const status = req.body.status || "active";
    const featured = parseBooleanFlag(req.body.featured);

    // Generate slug
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now().toString(36);

    // Parse applications
    let applications = [];
    if (req.body.applications) {
      try {
        applications =
          typeof req.body.applications === "string"
            ? JSON.parse(req.body.applications)
            : req.body.applications;
        if (!Array.isArray(applications)) applications = [];
      } catch (e) {
        applications = [];
      }
    }

    // Main image from uploaded file or body
    let image_url = null;
    const files = req.files || [];
    if (req.body.image_url) {
      image_url = normalizeImageUrl(req.body.image_url);
    }

    const result = await query(
      `INSERT INTO products
       (name, slug, description, short_description, price, sale_price, discount_percent,
        stock, stock_quantity, category_id, subcategory_id, image_url, sku, status, featured, brand, features, applications, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        slug,
        description,
        short_description,
        price,
        sale_price,
        discount_percent,
        stock,
        stock,
        category_id,
        subcategory_id,
        image_url,
        sku,
        status,
        featured,
        brand,
        req.body.features || null,
        JSON.stringify(applications),
      ],
    );

    const productId = result.insertId;

    // Handle gallery images from upload
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const imgUrl = imageUrlForFilename(files[i].filename, "product");
        const isMain = i === 0 ? 1 : 0;
        await query(
          "INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)",
          [productId, imgUrl, isMain, i],
        );
        if (i === 0) {
          // Set first uploaded image as main product image
          await query("UPDATE products SET image_url = ? WHERE id = ?", [
            imgUrl,
            productId,
          ]);
        }
      }
    }

    // Handle colors
    if (req.body.colors) {
      try {
        const colors =
          typeof req.body.colors === "string"
            ? JSON.parse(req.body.colors)
            : req.body.colors;
        if (Array.isArray(colors)) {
          for (const color of colors) {
            await query(
              "INSERT INTO product_colors (product_id, color_name, color_code, stock_quantity) VALUES (?, ?, ?, ?)",
              [
                productId,
                color.name || color.color_name,
                color.code || color.color_code,
                color.stock || 0,
              ],
            );
          }
        }
      } catch (e) {
        console.warn("[PRODUCT] Failed to parse colors:", e.message);
      }
    }

    // Handle sizes
    if (req.body.sizes) {
      try {
        const sizes =
          typeof req.body.sizes === "string"
            ? JSON.parse(req.body.sizes)
            : req.body.sizes;
        if (Array.isArray(sizes)) {
          for (const size of sizes) {
            await query(
              "INSERT INTO product_sizes (product_id, size_name, stock_quantity) VALUES (?, ?, ?)",
              [productId, size.name || size.size_name, size.stock || 0],
            );
          }
        }
      } catch (e) {
        console.warn("[PRODUCT] Failed to parse sizes:", e.message);
      }
    }

    const [created] = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = ?`,
      [productId],
    );

    const extras = await fetchProductExtras(productId);

    return success(
      res,
      "Product created successfully",
      {
        product: { ...withNormalizedImageUrl(created), ...extras },
      },
      201,
    );
  } catch (error) {
    console.error("[CREATE PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      throw new AppError("Invalid category selected", 400, "VALIDATION_ERROR");
    }
    throw new AppError(
      error.message || "Failed to create product",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** PUT /api/admin/products/:id */
const updateProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id)
      throw new AppError("Product ID is required", 400, "VALIDATION_ERROR");

    const existing = await query(
      "SELECT id, image_url FROM products WHERE id = ?",
      [req.params.id],
    );
    if (!existing.length)
      throw new AppError("Product not found", 404, "NOT_FOUND");

    if (!req.body.name || !req.body.name.trim())
      throw new AppError("Product name is required", 400, "VALIDATION_ERROR");
    if (
      req.body.price === undefined ||
      req.body.price === null ||
      req.body.price === ""
    ) {
      throw new AppError("Price is required", 400, "VALIDATION_ERROR");
    }
    const numPrice = parseFloat(req.body.price);
    if (isNaN(numPrice) || numPrice < 0)
      throw new AppError(
        "Price must be a valid positive number",
        400,
        "VALIDATION_ERROR",
      );

    const name = String(req.body.name).trim();
    const description = req.body.description
      ? String(req.body.description).trim()
      : null;
    const short_description = req.body.short_description
      ? String(req.body.short_description).trim()
      : null;
    const price = numPrice;
    const sale_price = req.body.sale_price
      ? parseFloat(req.body.sale_price)
      : null;
    const discount_percent = req.body.discount_percent
      ? parseFloat(req.body.discount_percent)
      : null;
    const stock = Math.max(0, parseInt(req.body.stock) || 0);
    const category_id = parseRequiredCategoryId(req.body.category_id);
    const subcategory_id = req.body.subcategory_id
      ? parseInt(req.body.subcategory_id)
      : null;
    const category = await assertCategoryExists(category_id);
    const sku = req.body.sku ? String(req.body.sku).trim() : null;
    const brand = req.body.brand ? String(req.body.brand).trim() : "";
    const status = req.body.status || "active";
    const featured = parseBooleanFlag(req.body.featured);
    const image_url = getUploadedProductImageUrl(
      req,
      normalizeImageUrl(existing[0].image_url),
    );

    // Parse applications
    let applications = [];
    if (req.body.applications) {
      try {
        applications =
          typeof req.body.applications === "string"
            ? JSON.parse(req.body.applications)
            : req.body.applications;
        if (!Array.isArray(applications)) applications = [];
      } catch (e) {
        applications = [];
      }
    }

    await query(
      `UPDATE products
       SET name = ?, description = ?, short_description = ?, price = ?, sale_price = ?,
           discount_percent = ?, stock = ?, stock_quantity = ?, category_id = ?,
           subcategory_id = ?, image_url = ?, sku = ?, status = ?, featured = ?,
           brand = ?, features = ?, applications = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        description,
        short_description,
        price,
        sale_price,
        discount_percent,
        stock,
        stock,
        category_id,
        subcategory_id,
        image_url,
        sku,
        status,
        featured,
        brand,
        req.body.features || null,
        JSON.stringify(applications),
        req.params.id,
      ],
    );

    // Handle gallery images from upload
    const files = req.files || [];
    if (files && files.length > 0) {
      // Delete existing gallery and re-insert
      await query("DELETE FROM product_images WHERE product_id = ?", [
        req.params.id,
      ]);

      for (let i = 0; i < files.length; i++) {
        const imgUrl = imageUrlForFilename(files[i].filename, "product");
        const isMain = i === 0 ? 1 : 0;
        await query(
          "INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)",
          [req.params.id, imgUrl, isMain, i],
        );
        if (i === 0) {
          await query("UPDATE products SET image_url = ? WHERE id = ?", [
            imgUrl,
            req.params.id,
          ]);
        }
      }
    }

    // Handle colors - delete existing and re-insert
    if (req.body.colors) {
      try {
        const colors =
          typeof req.body.colors === "string"
            ? JSON.parse(req.body.colors)
            : req.body.colors;
        if (Array.isArray(colors)) {
          await query("DELETE FROM product_colors WHERE product_id = ?", [
            req.params.id,
          ]);
          for (const color of colors) {
            await query(
              "INSERT INTO product_colors (product_id, color_name, color_code, stock_quantity) VALUES (?, ?, ?, ?)",
              [
                req.params.id,
                color.name || color.color_name,
                color.code || color.color_code,
                color.stock || 0,
              ],
            );
          }
        }
      } catch (e) {
        console.warn("[PRODUCT] Failed to parse colors:", e.message);
      }
    }

    // Handle sizes
    if (req.body.sizes) {
      try {
        const sizes =
          typeof req.body.sizes === "string"
            ? JSON.parse(req.body.sizes)
            : req.body.sizes;
        if (Array.isArray(sizes)) {
          await query("DELETE FROM product_sizes WHERE product_id = ?", [
            req.params.id,
          ]);
          for (const size of sizes) {
            await query(
              "INSERT INTO product_sizes (product_id, size_name, stock_quantity) VALUES (?, ?, ?)",
              [req.params.id, size.name || size.size_name, size.stock || 0],
            );
          }
        }
      } catch (e) {
        console.warn("[PRODUCT] Failed to parse sizes:", e.message);
      }
    }

    const [updated] = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.id = ?`,
      [req.params.id],
    );

    const extras = await fetchProductExtras(req.params.id);

    return success(res, "Product updated successfully", {
      product: { ...withNormalizedImageUrl(updated), ...extras },
    });
  } catch (error) {
    console.error("[UPDATE PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to update product",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** DELETE /api/admin/products/:id */
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    if (!req.params.id)
      throw new AppError("Product ID is required", 400, "VALIDATION_ERROR");
    const existing = await query("SELECT id FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (!existing.length)
      throw new AppError("Product not found", 404, "NOT_FOUND");

    await query("DELETE FROM product_images WHERE product_id = ?", [
      req.params.id,
    ]);
    await query("DELETE FROM product_colors WHERE product_id = ?", [
      req.params.id,
    ]);
    await query("DELETE FROM product_sizes WHERE product_id = ?", [
      req.params.id,
    ]);
    await query("DELETE FROM products WHERE id = ?", [req.params.id]);
    return success(res, "Product deleted successfully");
  } catch (error) {
    console.error("[DELETE PRODUCT ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to delete product",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** POST /api/admin/products/:id/gallery */
const uploadGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query("SELECT id FROM products WHERE id = ?", [id]);
  if (!existing.length)
    throw new AppError("Product not found", 404, "NOT_FOUND");

  if (!req.file)
    throw new AppError("Image file is required", 400, "VALIDATION_ERROR");

  const imageUrl = imageUrlForFilename(req.file.filename, "product");

  // Get next sort order
  const [maxOrder] = await query(
    "SELECT MAX(sort_order) AS max_order FROM product_images WHERE product_id = ?",
    [id],
  );
  const sortOrder = (maxOrder?.max_order || -1) + 1;
  const isMain = sortOrder === 0 ? 1 : 0;

  await query(
    "INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)",
    [id, imageUrl, isMain, sortOrder],
  );

  // If first image, set as main
  if (isMain) {
    await query("UPDATE products SET image_url = ? WHERE id = ?", [
      imageUrl,
      id,
    ]);
  }

  return success(
    res,
    "Gallery image uploaded",
    { image_url: imageUrl, sort_order: sortOrder },
    201,
  );
});

/** DELETE /api/admin/products/:id/gallery/:imageId */
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  await query("DELETE FROM product_images WHERE id = ? AND product_id = ?", [
    imageId,
    id,
  ]);
  return success(res, "Gallery image deleted");
});

/** PUT /api/admin/products/:id/gallery/:imageId/primary */
const setPrimaryImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const [image] = await query(
    "SELECT image_url FROM product_images WHERE id = ? AND product_id = ?",
    [imageId, id],
  );
  if (!image) throw new AppError("Image not found", 404, "NOT_FOUND");

  // Unset all as main
  await query("UPDATE product_images SET is_main = 0 WHERE product_id = ?", [
    id,
  ]);
  // Set this one as main
  await query("UPDATE product_images SET is_main = 1 WHERE id = ?", [imageId]);
  // Update product main image
  await query("UPDATE products SET image_url = ? WHERE id = ?", [
    image.image_url,
    id,
  ]);

  return success(res, "Primary image updated");
});

/** PUT /api/admin/products/:id/gallery/reorder */
const reorderGalleryImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { order } = req.body; // array of image IDs in desired order

  if (!Array.isArray(order) || order.length === 0) {
    throw new AppError(
      "Image order array is required",
      400,
      "VALIDATION_ERROR",
    );
  }

  for (let i = 0; i < order.length; i++) {
    await query(
      "UPDATE product_images SET sort_order = ? WHERE id = ? AND product_id = ?",
      [i, order[i], id],
    );
  }

  return success(res, "Gallery reordered");
});

/** POST /api/admin/products/:id/colors */
const createProductColor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { color_name, color_code, stock_quantity } = req.body;
  if (!color_name || !color_code)
    throw new AppError(
      "Color name and code are required",
      400,
      "VALIDATION_ERROR",
    );
  await query(
    "INSERT INTO product_colors (product_id, color_name, color_code, stock_quantity) VALUES (?, ?, ?, ?)",
    [id, color_name, color_code, stock_quantity || 0],
  );
  return success(res, "Color added", null, 201);
});

/** DELETE /api/admin/products/:id/colors/:colorId */
const deleteProductColor = asyncHandler(async (req, res) => {
  await query("DELETE FROM product_colors WHERE id = ? AND product_id = ?", [
    req.params.colorId,
    req.params.id,
  ]);
  return success(res, "Color deleted");
});

/** POST /api/admin/products/:id/sizes */
const createProductSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { size_name, stock_quantity } = req.body;
  if (!size_name)
    throw new AppError("Size name is required", 400, "VALIDATION_ERROR");
  await query(
    "INSERT INTO product_sizes (product_id, size_name, stock_quantity) VALUES (?, ?, ?)",
    [id, size_name, stock_quantity || 0],
  );
  return success(res, "Size added", null, 201);
});

/** DELETE /api/admin/products/:id/sizes/:sizeId */
const deleteProductSize = asyncHandler(async (req, res) => {
  await query("DELETE FROM product_sizes WHERE id = ? AND product_id = ?", [
    req.params.sizeId,
    req.params.id,
  ]);
  return success(res, "Size deleted");
});

/** GET /api/products/application/:application - Public: get products by application tag */
const getProductsByApplication = asyncHandler(async (req, res) => {
  try {
    const application = req.params.application;
    if (!application) {
      throw new AppError("Application name is required", 400, "VALIDATION_ERROR");
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    // Count total
    const [totalRow] = await query(
      `SELECT COUNT(*) AS count FROM products p
       WHERE p.status = 'active' AND JSON_CONTAINS(p.applications, ?)`,
      [JSON.stringify(application)],
    );

    const products = await query(
      `SELECT p.*, pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.status = 'active' AND JSON_CONTAINS(p.applications, ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [JSON.stringify(application), limit, offset],
    );

    const productIds = products.map((p) => p.id);
    let reviewStatsMap = {};
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const statsRows = await query(
        `SELECT product_id,
          AVG(rating) AS avg_rating,
          COUNT(*) AS total_reviews
        FROM product_reviews
        WHERE product_id IN (${placeholders}) AND is_approved = 1 AND show_on_website = 1
        GROUP BY product_id`,
        productIds
      );
      statsRows.forEach((row) => {
        reviewStatsMap[row.product_id] = {
          averageRating: parseFloat(row.avg_rating) || 0,
          totalReviews: Number(row.total_reviews) || 0,
        };
      });
    }

    const result = [];
    for (const product of products) {
      const extras = await fetchProductExtras(product.id);
      const reviews = reviewStatsMap[product.id] || { averageRating: 0, totalReviews: 0 };
      result.push({
        ...withNormalizedImageUrl(product),
        ...extras,
        reviews,
      });
    }

    return success(res, "Products fetched by application", {
      products: result,
      pagination: {
        total: Number(totalRow.count),
        page,
        limit,
        pages: Math.ceil(Number(totalRow.count) / limit),
      },
    });
  } catch (error) {
    console.error("[PRODUCTS BY APPLICATION ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to fetch products by application",
      500,
      "DATABASE_ERROR",
    );
  }
});

/** GET /api/products/applications/counts - Public: get product counts per application */
const getApplicationCounts = asyncHandler(async (req, res) => {
  try {
    const applications = [
      "Smart Home",
      "Office Automation",
      "Hotel Solutions",
      "Hospital Automation",
      "School & College Solutions",
      "Industrial Automation",
    ];

    const counts = {};
    for (const app of applications) {
      const [row] = await query(
        `SELECT COUNT(*) AS count FROM products p
         WHERE p.status = 'active' AND JSON_CONTAINS(p.applications, ?)`,
        [JSON.stringify(app)],
      );
      counts[app] = Number(row.count);
    }

    return success(res, "Application counts fetched", { counts });
  } catch (error) {
    console.error("[APPLICATION COUNTS ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to fetch application counts",
      500,
      "DATABASE_ERROR",
    );
  }
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductColor,
  deleteProductColor,
  createProductSize,
  deleteProductSize,
  uploadGalleryImage,
  deleteGalleryImage,
  setPrimaryImage,
  reorderGalleryImages,
  getProductsByApplication,
  getApplicationCounts,
};
