const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const controller = require("../controllers/notificationController");

const router = express.Router();
router.get("/api/notifications/unread-count", requireAuth, controller.unreadCount);
router.patch("/api/notifications/read-all", requireAuth, controller.markAllRead);
router.get("/api/notifications", requireAuth, controller.list);
router.patch("/api/notifications/:id/read", requireAuth, controller.markRead);
router.delete("/api/notifications/:id", requireAuth, controller.remove);
router.delete("/api/notifications", requireAuth, controller.clear);

module.exports = router;