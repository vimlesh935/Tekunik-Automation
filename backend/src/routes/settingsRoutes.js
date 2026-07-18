const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const settingsController = require("../controllers/SystemSettingsController");

const router = express.Router();

router.get("/api/admin/settings", requireAdmin, settingsController.index);
router.post("/api/admin/settings", requireAdmin, settingsController.store);
router.put("/api/admin/settings", requireAdmin, settingsController.update);

module.exports = router;
