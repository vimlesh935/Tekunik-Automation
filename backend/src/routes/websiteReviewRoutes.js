const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const {
  createWebsiteReview,
  getMyWebsiteReview,
  getApprovedWebsiteReviews,
  getAllWebsiteReviewsAdmin,
  approveWebsiteReview,
  rejectWebsiteReview,
  deleteWebsiteReview,
} = require("../controllers/websiteReviewController");

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// CUSTOMER ROUTES
// ─────────────────────────────────────────────────────────────

router.post("/api/website-reviews", requireAuth, createWebsiteReview);
router.get("/api/website-reviews/my", requireAuth, getMyWebsiteReview);
router.get("/api/website-reviews", getApprovedWebsiteReviews);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

router.get("/api/admin/website-reviews", requireAdmin, getAllWebsiteReviewsAdmin);
router.post("/api/admin/website-reviews/:id/approve", requireAdmin, approveWebsiteReview);
router.post("/api/admin/website-reviews/:id/reject", requireAdmin, rejectWebsiteReview);
router.delete("/api/admin/website-reviews/:id", requireAdmin, deleteWebsiteReview);

module.exports = router;