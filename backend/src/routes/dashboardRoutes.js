const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { getStats, getRevenueAnalytics, getActiveProducts, getOrderAnalytics, getUnifiedAnalytics } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/api/admin/dashboard/stats", requireAdmin, getStats);
router.get("/api/admin/dashboard/revenue-analytics", requireAdmin, getRevenueAnalytics);
router.get("/api/admin/dashboard/active-products", requireAdmin, getActiveProducts);
router.get("/api/admin/dashboard/order-analytics", requireAdmin, getOrderAnalytics);
router.get("/api/admin/dashboard/analytics", requireAdmin, getUnifiedAnalytics);
module.exports = router;
