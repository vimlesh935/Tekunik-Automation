const bcrypt = require("bcrypt");
const env = require("../config/env");
const { query } = require("../config/db");
const { sendOtpEmail } = require("../services/mailService");
const { createOtpSession, verifyOtpSession } = require("../services/otpService");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { signToken, verifyToken } = require("../utils/jwt");
const { ACTIVITY_TYPES, createActivity } = require("../services/adminActivityService");
const { generateWelcomeCoupon } = require("../services/couponService");

const BCRYPT_ROUNDS = 12;

const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value) => String(value || "").trim();

const requirePassword = (password) => {
  if (!password || String(password).length < 8) {
    throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
  }
};

const getCookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  path: "/",
  maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
});

const selectUserFields = `
  u.id, u.email, u.role, u.is_verified, u.created_at, u.username,
  u.token_version,
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
     VALUES (?, ?, ?, 'customer', true)`,
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

  // 🎁 Automatic new-user (welcome) coupon.
  let welcomeCouponCode = null;
  try {
    const welcomeCoupon = await generateWelcomeCoupon(userId);
    if (welcomeCoupon) {
      welcomeCouponCode = welcomeCoupon.code;
      const pctOff =
        welcomeCoupon.offer_type === "percentage" && Number(welcomeCoupon.offer_value)
          ? `${Math.round(Number(welcomeCoupon.offer_value))}%`
          : null;
      const notifTitle = pctOff ? `Your ${pctOff} Welcome Offer is ready` : "Your Welcome Offer is ready";
      const notifMessage = pctOff
        ? `🎁 Your ${pctOff} Welcome Offer is ready — open My Offers & Coupons to copy your code`
        : "🎁 Your Welcome Offer is ready — open My Offers & Coupons to copy your code";
      const { createNotification } = require("../services/notificationService");
      await createNotification({
        userId,
        type: "OFFER",
        title: notifTitle,
        message: notifMessage,
        data: { couponCode: welcomeCoupon.code, couponId: welcomeCoupon.id, offerId: welcomeCoupon.offer_id },
        actionUrl: "/dashboard?tab=offers-coupons",
        eventKey: `WELCOME_COUPON:${userId}`,
        entityType: "coupon",
        entityId: welcomeCoupon.id,
      });
    }
  } catch (couponError) {
    console.warn("[COUPON] Welcome coupon generation failed:", couponError.message);
  }

  // Admin activity: new customer registered
  try {
    await createActivity({
      userId,
      activityType: ACTIVITY_TYPES.USER_REGISTERED,
      entityType: "user",
      entityId: userId,
      metadata: {
        name: `${first_name} ${last_name}`.trim(),
        email,
        phone,
        city,
      },
      eventKey: `USER_REGISTERED:${userId}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Registration activity failed:", activityError.message);
  }

  return success(res, "Registration successful! Please login.", { redirectTo: "/login", welcomeCouponCode }, 201);
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

  // 🛡️ Clear any existing cookie first to prevent stale session reuse
  res.clearCookie(env.cookieName, { path: "/" });

  const token = signToken({
    id: user.id,
    email: user.email,
    token_version: Number(user.token_version || 0),
  });
  const rememberMe = req.body.remember_me === true;
  res.cookie(env.cookieName, token, getCookieOptions(rememberMe));

  const formattedUser = formatUser(user);

  console.log("[auth] Login successful:", { userId: user.id, email });

  // Register activity: customer login (LOW priority, informational)
  try {
    await createActivity({
      userId: user.id,
      activityType: ACTIVITY_TYPES.USER_LOGIN,
      entityType: "user",
      entityId: user.id,
      metadata: {
        name: formattedUser.name,
        email: user.email,
        userAgent: req.headers["user-agent"] || null,
      },
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Login activity failed:", activityError.message);
  }

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
 * POST /logout — Clear session completely
 * Clears the auth cookie and sets proper headers to prevent caching
 */
const logout = asyncHandler(async (req, res) => {
  // 🛡️ Clear cookie with path=/ to ensure it's removed from all routes
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
  });

  // 🛡️ Also set headers to prevent caching of authenticated pages
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  console.log("[auth] User logged out successfully");
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

// ════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD — AUTHENTICATED USER ONLY (Profile / Settings)
// Two independent methods:
//   1. Current password verification
//   2. Email OTP (reuses the shared email_otps infrastructure)
// ════════════════════════════════════════════════════════════════════════════

const PASSWORD_MIN_LENGTH = 8;
const CHANGE_PASSWORD_STEP_UP_MINUTES = 10;
const CHANGE_PASSWORD_PURPOSE = "change_password";

const requireNewPassword = (password) => {
  if (!password || String(password).length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      400,
      "WEAK_PASSWORD"
    );
  }
};

const assertNewPasswordNotCurrent = async (newPassword, currentHash) => {
  if (!currentHash) return;
  const sameAsCurrent = await bcrypt.compare(newPassword, currentHash);
  if (sameAsCurrent) {
    throw new AppError(
      "New password must be different from your current password",
      400,
      "PASSWORD_REUSE"
    );
  }
};

const getPasswordFacingUser = async (userId) => {
  const rows = await query(
    `SELECT u.id, u.email, u.password, u.token_version, p.first_name
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );
  if (!rows.length) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return rows[0];
};

/**
 * Shared completion for a successful password change:
 * - Updates the hash for THIS user only
 * - Bumps token_version (invalidates every previously-issued token/cookie)
 * - Revokes outstanding OTP sessions for the account
 * - Mints a fresh token + httpOnly cookie for the current session
 * Returns the fresh JWT so the frontend can re-store it.
 */
const commitPasswordChange = async ({ user, newPasswordHash, res }) => {
  const updatedVersion = Number(user.token_version || 0) + 1;

  await query(
    `UPDATE users
     SET password = ?, token_version = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [newPasswordHash, updatedVersion, user.id]
  );

  // Revoke any outstanding OTP sessions (forgot-password / change-password).
  try {
    await query("DELETE FROM email_otps WHERE email = ?", [user.email]);
  } catch (otpError) {
    console.warn("[auth] OTP cleanup after password change failed:", otpError.message);
  }

  const nextToken = signToken({
    id: user.id,
    email: user.email,
    token_version: updatedVersion,
  });

  // 🛡️ Replace the httpOnly cookie so the current session survives the
  // revocation while every other session is invalidated above.
  res.clearCookie(env.cookieName, { path: "/" });
  res.cookie(env.cookieName, nextToken, getCookieOptions());

  return nextToken;
};

const logPasswordChangedActivity = async (user, method) => {
  try {
    await createActivity({
      userId: user.id,
      activityType: ACTIVITY_TYPES.USER_PASSWORD_CHANGED,
      entityType: "user",
      entityId: user.id,
      metadata: {
        name: user.first_name || "",
        email: user.email,
        method,
      },
      eventKey: `USER_PASSWORD_CHANGED:${user.id}:${Date.now()}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Password change activity failed:", activityError.message);
  }
};

/**
 * POST /api/user/change-password — METHOD 1 (current password)
 * Body: { currentPassword, newPassword, confirmPassword }
 * Verifies the authenticated user's current password, then updates the
 * password hash for that user only and invalidates other sessions.
 */
const changePasswordWithCurrentPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!currentPassword) {
    throw new AppError("Current password is required", 400, "VALIDATION_ERROR");
  }
  requireNewPassword(newPassword);
  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400, "PASSWORD_MISMATCH");
  }

  const user = await getPasswordFacingUser(userId);
  if (!user.password) {
    throw new AppError("Password change is unavailable for this account", 400, "VALIDATION_ERROR");
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.password);
  if (!currentMatches) {
    throw new AppError("Incorrect current password", 400, "INVALID_CURRENT_PASSWORD");
  }

  await assertNewPasswordNotCurrent(newPassword, user.password);

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const nextToken = await commitPasswordChange({ user, newPasswordHash, res });

  await logPasswordChangedActivity(user, "current_password");

  console.log("[auth] Password changed via current password:", { userId });

  return success(res, "Password changed successfully", { token: nextToken });
});
/**
 * POST /api/user/change-password/send-otp — METHOD 2 step 1
 * Sends a 6-digit OTP (hashed in DB, 5-min expiry, 60s resend cooldown,
 * rate-limited) to the authenticated user's verified email address.
 */
const sendChangePasswordOtp = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await getPasswordFacingUser(userId);
  if (!user.email) {
    throw new AppError("This account has no email address on file", 400, "VALIDATION_ERROR");
  }

  const { otp, expiresInMinutes } = await createOtpSession({
    email: user.email,
    payload: { userId: user.id },
    purpose: CHANGE_PASSWORD_PURPOSE,
  });

  await sendOtpEmail({
    to: user.email,
    otp,
    name: user.first_name || "User",
  });

  console.log("[auth] Change-password OTP sent to:", { email: maskEmail(user.email) });

  return success(res, `OTP sent to ${maskEmail(user.email)}`, {
    email: maskEmail(user.email),
    expiresInMinutes,
    resendAfterSeconds: 60,
  });
});

/**
 * POST /api/user/change-password/verify-otp — METHOD 2 step 2
 * Body: { otp }
 * Verifies the OTP server-side and returns a short-lived, user-bound
 * step-up token. The frontend can NOT mark itself "verified" on its own.
 */
const verifyChangePasswordOtp = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const otp = String(req.body.otp || "").replace(/\D/g, "");

  if (otp.length !== 6) {
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  const user = await getPasswordFacingUser(userId);

  const session = await verifyOtpSession(user.email, otp);
  if (
    !session ||
    session.purpose !== CHANGE_PASSWORD_PURPOSE ||
    Number(session.payload?.userId) !== Number(user.id)
  ) {
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  const stepUpToken = signToken(
    { id: user.id, email: user.email, purpose: "change_password_reset" },
    { expiresIn: CHANGE_PASSWORD_STEP_UP_MINUTES * 60 }
  );

  console.log("[auth] Change-password OTP verified:", { userId });

  return success(res, "OTP verified successfully", {
    stepUpToken,
    expiresInMinutes: CHANGE_PASSWORD_STEP_UP_MINUTES,
  });
});

/**
 * POST /api/user/change-password/reset — METHOD 2 step 3
 * Body: { stepUpToken, newPassword, confirmPassword }
 * Completes the change with the user-bound step-up token obtained after
 * a successful OTP verification.
 */
const resetPasswordAfterOtp = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const stepUpToken = String(req.body.stepUpToken || "");
  const newPassword = String(req.body.newPassword || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!stepUpToken) {
    throw new AppError("Verification is required to change the password", 400, "VALIDATION_ERROR");
  }
  requireNewPassword(newPassword);
  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400, "PASSWORD_MISMATCH");
  }

  // The step-up token is short-lived and bound to this user's id.
  let payload;
  try {
    payload = verifyToken(stepUpToken);
  } catch (error) {
    throw new AppError(
      "Verification expired or invalid. Please request a new OTP.",
      401,
      "INVALID_VERIFICATION_TOKEN"
    );
  }

  if (
    !payload ||
    payload.purpose !== "change_password_reset" ||
    Number(payload.id) !== Number(userId)
  ) {
    throw new AppError(
      "Verification expired or invalid. Please request a new OTP.",
      401,
      "INVALID_VERIFICATION_TOKEN"
    );
  }

  const user = await getPasswordFacingUser(userId);
  await assertNewPasswordNotCurrent(newPassword, user.password);

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const nextToken = await commitPasswordChange({ user, newPasswordHash, res });

  await logPasswordChangedActivity(user, "email_otp");

  console.log("[auth] Password changed via email OTP:", { userId });

  return success(res, "Password changed successfully", { token: nextToken });
});
module.exports = {
  register,
  login,
  dashboard,
  logout,
  sendForgotOtp,
  verifyForgotOtp,
  resetPassword,
  changePasswordWithCurrentPassword,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
  resetPasswordAfterOtp,
};