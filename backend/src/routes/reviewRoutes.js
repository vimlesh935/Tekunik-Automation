const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const {
  createReview,
  getProductReviews,
  getUserReviewForOrder,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewCounts,
  toggleReviewVisibility,
} = require("../controllers/reviewController");

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// CUSTOMER ROUTES
// ─────────────────────────────────────────────────────────────

router.post("/api/reviews", requireAuth, createReview);
router.get("/api/products/:id/reviews", getProductReviews);
router.get("/api/user/orders/:orderId/products/:productId/review", requireAuth, getUserReviewForOrder);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

router.get("/api/admin/reviews", requireAdmin, getAllReviewsAdmin);
router.get("/api/admin/reviews/counts", requireAdmin, getReviewCounts);
router.post("/api/admin/reviews/:id/approve", requireAdmin, approveReview);
router.post("/api/admin/reviews/:id/reject", requireAdmin, rejectReview);
router.patch("/api/admin/reviews/:id/visibility", requireAdmin, toggleReviewVisibility);
router.delete("/api/admin/reviews/:id", requireAdmin, deleteReview);

module.exports = router;