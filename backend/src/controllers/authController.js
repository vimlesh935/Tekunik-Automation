const bcrypt = require("bcrypt");
const env = require("../config/env");
const { query } = require("../config/db");
const { sendOtpEmail } = require("../services/mailService");
const { createOtpSession, verifyOtpSession } = require("../services/otpService");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { signToken } = require("../utils/jwt");

const BCRYPT_ROUNDS = 12;

const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value) => String(value || "").trim();

const requirePassword = (password) => {
  if (!password || String(password).length < 8) {
    throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
  }
};

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  maxAge: 24 * 60 * 60 * 1000,
});

const selectUserFields = `
  u.id, u.email, u.role, u.is_verified, u.created_at, u.username,
  p.first_name, p.last_name, p.city, p.phone, p.address
`;

const formatUser = (user) => ({
  id: user.id,
  name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  email: user.email,
  city: user.city || "",
  phone: user.phone || "",
  address: user.address || "",
});

const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  const masked = visible + "*".repeat(Math.max(0, name.length - 2));
  return `${masked}@${domain}`;
};

const findUserByEmail = async (email, includePassword = false) => {
  const passwordField = includePassword ? ", u.password" : "";
  const rows = await query(
    `SELECT ${selectUserFields}${passwordField}
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const createUsername = (email) => {
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24);
  return `${base || "user"}_${Date.now().toString(36)}`;
};

/**
 * POST /register — Direct registration without OTP
 * Body: { first_name, last_name, email, password, phone, age, address, city, pincode }
 */
const register = asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");
  const first_name = cleanText(req.body.first_name);
  const last_name = cleanText(req.body.last_name);
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  const age = req.body.age;
  const address = cleanText(req.body.address);
  const city = cleanText(req.body.city);
  const pincode = cleanText(req.body.pincode);

  // Validation
  if (!email) throw new AppError("Email is required", 400, "VALIDATION_ERROR");
  if (!first_name || !last_name) throw new AppError("First and last name are required", 400, "VALIDATION_ERROR");
  requirePassword(password);
  if (!phone) throw new AppError("Phone number is required", 400, "VALIDATION_ERROR");
  if (!age || isNaN(age) || Number(age) < 18) throw new AppError("You must be at least 18 years old", 400, "VALIDATION_ERROR");
  if (!address || !city || !pincode) throw new AppError("Address, city, and pincode are required", 400, "VALIDATION_ERROR");

  // Check if email already exists
  const existing = await findUserByEmail(email, true);
  if (existing) {
    throw new AppError("Email is already registered. Please login.", 409, "EMAIL_EXISTS");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const username = createUsername(email);

  // Insert user
  const userResult = await query(
    `INSERT INTO users (email, password, username, role, is_verified)
     VALUES (?, ?, ?, 'user', true)`,
    [email, passwordHash, username]
  );
  const userId = userResult.insertId;

  // Save profile
  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, city)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, first_name, last_name, phone || null, address || null, city]
  );

  console.log("[auth] New user registered:", { id: userId, email });

  return success(res, "Registration successful! Please login.", { redirectTo: "/login" }, 201);
});

/**
 * POST /login — Email + password login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email || req.body.identifier);
  const password = String(req.body.password || "");

  if (!email) throw new AppError("Email is required", 400, "VALIDATION_ERROR");
  requirePassword(password);

  const user = await findUserByEmail(email, true);
  if (!user || !user.is_verified || !user.password) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = signToken({ id: user.id, email: user.email });
  res.cookie(env.cookieName, token, getCookieOptions());

  const formattedUser = formatUser(user);

  console.log("[auth] Login successful:", { userId: user.id, email });
  return success(res, "Login successful", {
    token,
    redirectTo: "/dashboard",
    user: formattedUser,
    welcome: `Welcome ${formattedUser.name || "User"}`,
  });
});

/**
 * GET /dashboard — Protected user dashboard
 */
const dashboard = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT ${selectUserFields}
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = ? AND u.is_verified = true
     LIMIT 1`,
    [req.user.id]
  );
  if (!rows.length) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const user = formatUser(rows[0]);
  return success(res, "Dashboard loaded", {
    welcome: `Welcome ${user.name || "User"}`,
    user,
  });
});

/**
 * POST /logout — Clear session
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
  });
  return success(res, "Logout successful");
});

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — OTP EXCLUSIVELY HERE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Step 1: POST /send-forgot-otp
 * Body: { email }
 * Checks if email is registered, sends OTP if yes
 */
const sendForgotOtp = asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  if (!email) throw new AppError("Email is required", 400, "VALIDATION_ERROR");

  // Check if email exists in database
  const user = await findUserByEmail(email, true);
  if (!user || !user.is_verified) {
    throw new AppError("No account found with this email", 404, "EMAIL_NOT_FOUND");
  }

  // Create OTP session for forgot password
  const { otp, expiresInMinutes } = await createOtpSession({
    email,
    payload: { userId: user.id },
    purpose: "forgot_password",
  });

  // Send OTP email
  await sendOtpEmail({
    to: email,
    otp,
    name: user.first_name || "User",
  });

  console.log("[auth] Forgot password OTP sent to:", { email: maskEmail(email) });

  return success(res, `OTP sent to ${maskEmail(email)}`, {
    email: maskEmail(email),
    expiresInMinutes,
  });
});

/**
 * Step 2: POST /verify-forgot-otp
 * Body: { email, otp }
 * Verifies OTP and returns a reset token
 */
const verifyForgotOtp = asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const otp = String(req.body.otp || "").replace(/\D/g, "");

  if (!email || otp.length !== 6) {
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  // Verify OTP session
  const session = await verifyOtpSession(email, otp);
  if (!session || session.purpose !== "forgot_password") {
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  // Generate temporary reset token
  const resetToken = signToken({ email, purpose: "password_reset" });

  return success(res, "OTP verified successfully", { resetToken });
});

/**
 * Step 3: POST /reset-password
 * Body: { email, resetToken, newPassword, confirmPassword }
 * Resets the password after OTP verification
 */
const resetPassword = asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const resetToken = String(req.body.resetToken || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!email || !resetToken) throw new AppError("Invalid reset request", 400, "VALIDATION_ERROR");
  if (newPassword.length < 8) throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
  if (newPassword !== confirmPassword) throw new AppError("Passwords do not match", 400, "PASSWORD_MISMATCH");

  // Verify reset token
  const { verifyToken } = require("../utils/jwt");
  let payload;
  try {
    payload = verifyToken(resetToken);
  } catch (error) {
    throw new AppError("Reset token expired or invalid. Please start again.", 401, "INVALID_RESET_TOKEN");
  }

  if (payload.email !== email || payload.purpose !== "password_reset") {
    throw new AppError("Invalid reset token", 401, "INVALID_RESET_TOKEN");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password in database
  await query("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?", [passwordHash, email]);

  console.log("[auth] Password reset successfully for:", { email: maskEmail(email) });

  return success(res, "Password reset successfully. Please login with your new password.", { redirectTo: "/login" });
});

module.exports = {
  register,
  login,
  dashboard,
  logout,
  sendForgotOtp,
  verifyForgotOtp,
  resetPassword,
};