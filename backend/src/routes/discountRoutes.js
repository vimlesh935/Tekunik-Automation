const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  listDiscounts,
  getDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  toggleDiscount,
  getActiveDiscounts,
} = require("../controllers/discountController");

const router = express.Router();

// Public - active discounts
router.get("/api/discounts/active", getActiveDiscounts);

// Admin routes
router.get("/api/admin/discounts", requireAdmin, listDiscounts);
router.get("/api/admin/discounts/:id", requireAdmin, getDiscount);
router.post("/api/admin/discounts", requireAdmin, createDiscount);
router.put("/api/admin/discounts/:id", requireAdmin, updateDiscount);
router.delete("/api/admin/discounts/:id", requireAdmin, deleteDiscount);
router.patch("/api/admin/discounts/:id/toggle", requireAdmin, toggleDiscount);

module.exports = router;