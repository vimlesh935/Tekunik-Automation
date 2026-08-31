const express = require("express");
const { requireAuth, requireAdmin, optionalAuth } = require("../middleware/authMiddleware");
const {
  applyCoupon,
  removeCoupon,
  myCoupons,
  cartTotalsWithCoupon,
  availableCoupons,
  validateCoupon,
  listCouponsAdmin,
  getCouponAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  generateCouponAdmin,
  toggleCouponAdmin,
  removeCouponAdmin,
  couponStatsAdmin,
} = require("../controllers/couponController");

const router = express.Router();

// ── User coupon endpoints ─────────────────────────────────────────────
router.post("/api/coupons/apply", requireAuth, applyCoupon);
router.post("/api/coupons/remove", requireAuth, removeCoupon);
router.get("/api/coupons/my", requireAuth, myCoupons);
router.get("/api/coupons/totals", requireAuth, cartTotalsWithCoupon);
router.post("/api/coupons/available", optionalAuth, availableCoupons);
router.post("/api/coupons/validate", optionalAuth, validateCoupon);

// ── Admin coupon management (authenticated admin) ─────────────────────
router.get("/api/admin/coupons", requireAdmin, listCouponsAdmin);
router.get("/api/admin/coupons/stats", requireAdmin, couponStatsAdmin);
router.get("/api/admin/coupons/:id", requireAdmin, getCouponAdmin);
router.post("/api/admin/coupons", requireAdmin, createCouponAdmin);
router.put("/api/admin/coupons/:id", requireAdmin, updateCouponAdmin);
router.post("/api/admin/coupons/generate", requireAdmin, generateCouponAdmin);
router.patch("/api/admin/coupons/:id/status", requireAdmin, toggleCouponAdmin);
router.delete("/api/admin/coupons/:id", requireAdmin, removeCouponAdmin);

module.exports = router;