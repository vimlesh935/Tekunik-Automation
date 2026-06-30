const express = require("express");
const validationController = require("../controllers/validationController");

const router = express.Router();

// POST /api/validation/email - Full email validation with API
router.post("/api/validation/email", validationController.validateEmail);

// GET /api/validation/email/format - Quick format check only (no API call)
router.get("/api/validation/email/format", validationController.validateEmailFormat);

// POST /api/validation/email/batch - Batch validation (max 10)
router.post("/api/validation/email/batch", validationController.validateEmailsBatch);

module.exports = router;