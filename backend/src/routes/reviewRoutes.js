const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const {
  createReview,
  getProductReviews,
  getPublicReviews,
  getUserReviewForOrder,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewCounts,
  toggleReviewVisibility,
  showReviewOnWebsite,
  hideReviewFromWebsite,
} = require("../controllers/reviewController");

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// CUSTOMER ROUTES
// ─────────────────────────────────────────────────────────────

router.get("/api/reviews", getPublicReviews);
router.get("/api/reviews/public", getPublicReviews);
router.post("/api/reviews", requireAuth, createReview);
router.get("/api/products/:id/reviews", getProductReviews);
router.get("/api/user/orders/:orderId/products/:productId/review", requireAuth, getUserReviewForOrder);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

router.get("/api/admin/reviews", requireAdmin, getAllReviewsAdmin);
router.get("/api/admin/reviews/counts", requireAdmin, getReviewCounts);
router.put("/api/reviews/:id/approve", requireAdmin, approveReview);
router.put("/api/reviews/:id/reject", requireAdmin, rejectReview);
router.put("/api/reviews/:id/show", requireAdmin, showReviewOnWebsite);
router.put("/api/reviews/:id/hide", requireAdmin, hideReviewFromWebsite);
router.post("/api/admin/reviews/:id/approve", requireAdmin, approveReview);
router.post("/api/admin/reviews/:id/reject", requireAdmin, rejectReview);
router.patch("/api/admin/reviews/:id/visibility", requireAdmin, toggleReviewVisibility);
router.put("/api/admin/reviews/:id/show", requireAdmin, showReviewOnWebsite);
router.put("/api/admin/reviews/:id/hide", requireAdmin, hideReviewFromWebsite);
router.delete("/api/admin/reviews/:id", requireAdmin, deleteReview);

module.exports = router;
