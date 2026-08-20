const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminMiddleware");
const { getFrontendSettings, updateFrontendSettings } = require("../controllers/frontendSettingsController");

router.get("/api/frontend-information", getFrontendSettings);
router.put("/api/admin/frontend-information", requireAdmin, updateFrontendSettings);

module.exports = router;
