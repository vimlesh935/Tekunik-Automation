const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/api/cart", requireAuth, getCart);
router.post("/api/cart/add", requireAuth, addToCart);
router.put("/api/cart/item/:item_id", requireAuth, updateCartItem);
router.delete("/api/cart/item/:item_id", requireAuth, removeCartItem);
router.delete("/api/cart/clear", requireAuth, clearCart);

module.exports = router;
