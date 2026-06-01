const crypto = require("node:crypto");
const env = require("../config/env");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { signToken } = require("../utils/jwt");

/**
 * POST /api/admin/login — validates admin credentials and returns a JWT token.
 * Frontend calls this with { email, secretKey } and receives { token } on success.
 */
const adminLogin = asyncHandler(async (req, res) => {
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

  // Generate JWT token for admin session
  const token = signToken({ email, role: "admin" });

  return success(res, "Admin login successful", { token });
});

module.exports = {
  adminLogin,
};