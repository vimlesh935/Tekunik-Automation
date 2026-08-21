const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

// GET /api/wishlist - Get all wishlist items for authenticated user
router.get("/api/wishlist", requireAuth, getWishlist);

// POST /api/wishlist/:productId - Add product to wishlist
router.post("/api/wishlist/:productId", requireAuth, addToWishlist);

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete("/api/wishlist/:productId", requireAuth, removeFromWishlist);

module.exports = router;