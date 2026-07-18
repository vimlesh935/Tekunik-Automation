const bcrypt = require("bcrypt");
const { query } = require("../config/db");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { signToken } = require("../utils/jwt");

/**
 * POST /api/admin/login — validates admin credentials against the database
 * and returns a JWT token.
 *
 * Body: { email, password }
 * Response: { success, message, data: { token } }
 *
 * This controller queries the `admins` table and uses bcrypt.compare()
 * for password verification. No hardcoded credentials are used.
 */
const adminLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || req.body.secretKey || "");

  if (!email || !password) {
    throw new AppError("Email and password are required", 400, "VALIDATION_ERROR");
  }

  // Query the admins table (database-backed authentication)
  const rows = await query(
    "SELECT id, email, password, role FROM admins WHERE email = ? LIMIT 1",
    [email]
  );

  const admin = rows[0];
  if (!admin) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // Compare password using bcrypt (never compare raw strings)
  const passwordMatches = await bcrypt.compare(password, admin.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // Generate JWT token with admin id and role
  const token = signToken({ id: admin.id, email: admin.email, role: admin.role });

  return success(res, "Admin login successful", { token });
});

module.exports = {
  adminLogin,
};