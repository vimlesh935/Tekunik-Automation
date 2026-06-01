const express = require("express");
const env = require("../config/env");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const { success } = require("../utils/response");
const adminController = require("../controllers/adminController");

const router = express.Router();

/**
 * POST /api/admin/login — validates credentials and returns a JWT for admin API access.
 * This is called by the frontend after client-side credential check passes.
 */
router.post("/api/admin/login", adminController.adminLogin);

/**
 * POST /api/admin/token — issues an admin JWT after verifying email + secretKey.
 * This is a legacy endpoint kept for backward compatibility.
 * Frontend should use /api/admin/login instead.
 */
router.post(
  "/api/admin/token",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const secretKey = String(req.body.secretKey || "");

    if (!email || !secretKey) {
      throw new AppError("Email and secret key are required", 400, "VALIDATION_ERROR");
    }

    if (email !== env.adminEmail.toLowerCase()) {
      throw new AppError("Invalid admin credentials", 401, "ADMIN_FORBIDDEN");
    }
    if (secretKey !== env.adminSecretKey) {
      throw new AppError("Invalid admin credentials", 401, "ADMIN_FORBIDDEN");
    }

    const token = signToken({ email, role: "admin" });
    return success(res, "Admin token issued", { token });
  })
);

module.exports = router;
