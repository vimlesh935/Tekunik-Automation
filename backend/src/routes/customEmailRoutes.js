const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminMiddleware");
const controller = require("../controllers/customEmailController");

// Manual "Custom Email" feature — admin-only, fully separate from the
// automated email templates. All endpoints enforce admin authorization HERE
// on the backend, not only in the frontend.

router.post("/api/admin/custom-email/resolve", requireAdmin, controller.resolve);
router.post("/api/admin/custom-email/preview", requireAdmin, controller.preview);
router.post("/api/admin/custom-email/send-test", requireAdmin, controller.sendTest);
router.post("/api/admin/custom-email/send", requireAdmin, controller.send);

// Reusable custom templates (separate from automated email_templates)
router.get("/api/admin/custom-email/templates", requireAdmin, controller.listTemplates);
router.post("/api/admin/custom-email/templates", requireAdmin, controller.createTemplate);
router.get("/api/admin/custom-email/templates/:id", requireAdmin, controller.getTemplate);
router.put("/api/admin/custom-email/templates/:id", requireAdmin, controller.updateTemplate);
router.delete("/api/admin/custom-email/templates/:id", requireAdmin, controller.deleteTemplate);

// Custom email history
router.get("/api/admin/custom-email/history", requireAdmin, controller.listHistory);

module.exports = router;