const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { getStats, getRevenueAnalytics, getActiveProducts } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/api/admin/dashboard/stats", requireAdmin, getStats);
router.get("/api/admin/dashboard/revenue-analytics", requireAdmin, getRevenueAnalytics);
router.get("/api/admin/dashboard/active-products", requireAdmin, getActiveProducts);

module.exports = router;
