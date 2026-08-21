const { query } = require("../config/db");

/**
 * GET /api/wishlist
 * Get all wishlist items for authenticated user
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await query(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.price, p.sale_price, p.discount_percent,
              p.image_url, p.stock_quantity, p.low_stock_limit, p.stock_status
       FROM wishlist w
       LEFT JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    const wishlistItems = rows
      .filter((row) => row.product_id && row.name)
      .map((row) => {
        const hasSale =
          row.sale_price !== null &&
          parseFloat(row.sale_price) < parseFloat(row.price);
        return {
          id: row.id,
          product_id: row.product_id,
          name: row.name,
          price: parseFloat(row.price) || 0,
          original_price: parseFloat(row.price) || 0,
          sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
          discount_percent: parseFloat(row.discount_percent) || 0,
          final_price: hasSale
            ? parseFloat(row.sale_price)
            : parseFloat(row.price) || 0,
          image_url: row.image_url || "",
          stock_quantity: row.stock_quantity || 0,
          low_stock_limit: row.low_stock_limit,
          stock_status: row.stock_status || "in_stock",
          created_at: row.created_at,
        };
      });

    res.json({ success: true, wishlist: wishlistItems });
  } catch (error) {
    console.error("[WISHLIST] Get wishlist error:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

/**
 * POST /api/wishlist/:productId
 * Add product to wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid Product ID required" });
    }

    // Check if product exists
    const products = await query(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );

    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check if already in wishlist (prevent duplicates)
    const existing = await query(
      "SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (existing.length > 0) {
      return res.json({ success: true, alreadyInWishlist: true });
    }

    // Add to wishlist
    await query(
      "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)",
      [userId, productId]
    );

    res.json({ success: true, alreadyInWishlist: false });
  } catch (error) {
    console.error("[WISHLIST] Add to wishlist error:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid Product ID required" });
    }

    await query(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[WISHLIST] Remove from wishlist error:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};