const express = require("express");
const controller = require("../controllers/abandonedRecoveryController");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/api/admin/recovery/summary", requireAdmin, controller.getSummary);
router.get("/api/admin/recovery/settings", requireAdmin, controller.getSettings);
router.put("/api/admin/recovery/settings", requireAdmin, controller.updateSettings);
router.post("/api/admin/recovery/:id/send-reminder", requireAdmin, controller.sendReminder);
router.get("/api/admin/recovery/:id", requireAdmin, controller.detail);
router.get("/api/admin/recovery", requireAdmin, controller.list);

module.exports = router;