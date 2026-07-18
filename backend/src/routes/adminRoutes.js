const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

/**
 * POST /api/admin/login — validates credentials against the `admins` table
 * in MySQL and returns a JWT for admin API access.
 *
 * Body: { email, password }
 * The password is verified using bcrypt.compare() against the stored hash.
 */
router.post("/api/admin/login", adminController.adminLogin);

module.exports = router;