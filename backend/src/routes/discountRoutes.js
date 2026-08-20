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
  getActiveOfferProducts,
  getPublicOffers,
  getPublicOffer,
} = require("../controllers/discountController");

const router = express.Router();

// Public - active discounts/offers
router.get("/api/discounts/active", getActiveDiscounts);
router.get("/api/offers/active", getActiveDiscounts);
router.get("/api/offers/products", getActiveOfferProducts);
router.get("/api/offers", getPublicOffers);
router.get("/api/offers/:id", getPublicOffer);

// Admin routes
router.get("/api/admin/discounts", requireAdmin, listDiscounts);
router.get("/api/admin/discounts/:id", requireAdmin, getDiscount);
router.post("/api/admin/discounts", requireAdmin, createDiscount);
router.put("/api/admin/discounts/:id", requireAdmin, updateDiscount);
router.delete("/api/admin/discounts/:id", requireAdmin, deleteDiscount);
router.patch("/api/admin/discounts/:id/toggle", requireAdmin, toggleDiscount);
router.get("/api/admin/offers", requireAdmin, listDiscounts);
router.get("/api/admin/offers/:id", requireAdmin, getDiscount);
router.post("/api/admin/offers", requireAdmin, createDiscount);
router.put("/api/admin/offers/:id", requireAdmin, updateDiscount);
router.delete("/api/admin/offers/:id", requireAdmin, deleteDiscount);
router.patch("/api/admin/offers/:id/toggle", requireAdmin, toggleDiscount);
router.patch("/api/admin/offers/:id/status", requireAdmin, toggleDiscount);

module.exports = router;
