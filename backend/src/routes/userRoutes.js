const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/userController");

const router = express.Router();

router.get("/api/user/profile", requireAuth, getProfile);
router.put("/api/user/profile", requireAuth, updateProfile);

// NOTE:
// User order endpoints are served by orderRoutes.js to keep
// admin updates, user history, and tracking on one canonical flow.
// (Avoid duplicate route/controller paths for /api/user/orders.)

module.exports = router;
