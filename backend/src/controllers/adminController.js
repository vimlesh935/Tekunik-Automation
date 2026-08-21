const bcrypt = require("bcrypt");
const { query } = require("../config/db");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { signToken } = require("../utils/jwt");

const BCRYPT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

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

/**
 * Shared core for updating an admin's login identity. Used by both the
 * dedicated account endpoint and the Backend Settings API.
 * Returns { email, passwordChanged }.
 */
const updateAdminAccountCore = async ({ adminId, currentPassword, email, password }) => {
  const newEmail = email !== undefined ? String(email).trim().toLowerCase() : null;
  const newPassword = password !== undefined ? String(password) : null;

  if (!currentPassword) {
    throw new AppError("Current password is required to update the admin account", 400, "VALIDATION_ERROR");
  }
  if (newEmail === "") {
    throw new AppError("Admin email cannot be empty", 400, "VALIDATION_ERROR");
  }
  if (newEmail && !EMAIL_REGEX.test(newEmail)) {
    throw new AppError("Invalid admin email format", 400, "VALIDATION_ERROR");
  }
  if (newPassword !== null) {
    if (newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters", 400, "VALIDATION_ERROR");
    }
    if (newPassword.length > 100) {
      throw new AppError("New password is too long", 400, "VALIDATION_ERROR");
    }
  }
  if (!newEmail && newPassword === null) {
    throw new AppError("Nothing to update", 400, "VALIDATION_ERROR");
  }

  const rows = await query("SELECT id, email, password, role FROM admins WHERE id = ? LIMIT 1", [adminId]);
  const admin = rows[0];
  if (!admin) {
    throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, admin.password);
  if (!passwordMatches) {
    throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
  }

  if (newEmail && newEmail !== admin.email) {
    const conflict = await query("SELECT id FROM admins WHERE email = ? AND id <> ? LIMIT 1", [newEmail, adminId]);
    if (conflict.length) {
      throw new AppError("That email is already in use by another admin", 409, "EMAIL_TAKEN");
    }
  }

  let newPasswordHash = null;
  if (newPassword) {
    newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  }

  if (newEmail && newPasswordHash) {
    await query("UPDATE admins SET email = ?, password = ? WHERE id = ?", [newEmail, newPasswordHash, adminId]);
  } else if (newEmail) {
    await query("UPDATE admins SET email = ? WHERE id = ?", [newEmail, adminId]);
  } else if (newPasswordHash) {
    await query("UPDATE admins SET password = ? WHERE id = ?", [newPasswordHash, adminId]);
  }

  return { email: newEmail || admin.email, passwordChanged: Boolean(newPasswordHash) };
};

/**
 * PUT /api/admin/account — updates the current admin's login identity.
 * Body: { currentPassword, email?, password? }
 * Requires the current password to be verified before any change is applied.
 * Passwords are bcrypt-hashed; the password is never stored or returned raw.
 */
const updateAdminAccount = asyncHandler(async (req, res) => {
  const adminId = req.admin?.id;
  if (!adminId) {
    throw new AppError("Admin session missing", 401, "ADMIN_AUTH_REQUIRED");
  }

  const result = await updateAdminAccountCore({
    adminId,
    currentPassword: String(req.body.currentPassword || ""),
    email: req.body.email,
    password: req.body.password,
  });

  return success(res, "Admin account updated", result);
});

module.exports = {
  adminLogin,
  updateAdminAccount,
  updateAdminAccountCore,
};