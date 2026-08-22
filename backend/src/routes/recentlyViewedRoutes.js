const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getRecentlyViewed,
  addRecentlyViewed,
  removeRecentlyViewed,
  clearRecentlyViewed,
} = require("../controllers/recentlyViewedController");

const router = express.Router();

router.get("/api/recently-viewed", requireAuth, getRecentlyViewed);
router.post("/api/recently-viewed", requireAuth, addRecentlyViewed);
router.delete("/api/recently-viewed/:productId", requireAuth, removeRecentlyViewed);
router.delete("/api/recently-viewed", requireAuth, clearRecentlyViewed);

module.exports = router;