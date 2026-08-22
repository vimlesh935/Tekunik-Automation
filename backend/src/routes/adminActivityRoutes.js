const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const controller = require("../controllers/adminActivityController");
const router = express.Router();

router.get("/api/admin/activity/recent", requireAdmin, controller.recent);
router.get("/api/admin/activity/price-drop-analytics", requireAdmin, controller.priceDropAnalytics);
router.get("/api/admin/activity/unread-count", requireAdmin, controller.count);
router.get("/api/admin/activity/dashboard-summary", requireAdmin, controller.dashboardSummary);
router.get("/api/admin/activity/needs-attention", requireAdmin, controller.needsAttention);
router.patch("/api/admin/activity/read-all", requireAdmin, controller.markAllRead);
router.get("/api/admin/activity/customer/:userId", requireAdmin, controller.customer);
router.get("/api/admin/activity/product/:productId", requireAdmin, controller.product);
router.get("/api/admin/activity", requireAdmin, controller.list);
router.patch("/api/admin/activity/:id/read", requireAdmin, controller.markRead);
router.delete("/api/admin/activity/:id", requireAdmin, controller.remove);

module.exports = router;