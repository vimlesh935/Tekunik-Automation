const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

/**
 * POST /api/admin/login — validates credentials against the `admins` table
 * in MySQL and returns a JWT for admin API access.
 *
 * Body: { email, password }
 * The password is verified using bcrypt.compare() against the stored hash.
 */
router.post("/api/admin/login", adminController.adminLogin);

// Update current admin login identity (email / password)
router.put("/api/admin/account", requireAdmin, adminController.updateAdminAccount);

module.exports = router;