const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Registration (NO OTP) ──────────────────────────────────────────────────
router.post("/register", authController.register);
router.post("/api/auth/register", authController.register);
// Legacy API routes for backward compatibility
router.post("/api/auth/register/send-otp", authController.register);
router.post("/api/auth/register/verify-otp", authController.register);

// ── Login (Email + Password only) ───────────────────────────────────────────
router.post("/login", authController.login);
router.post("/api/auth/login", authController.login);
router.post("/api/auth/login/send-otp", authController.login);
router.post("/api/auth/login/verify-otp", authController.login);

// ── Dashboard (Protected) ──────────────────────────────────────────────────
router.get("/dashboard", requireAuth, authController.dashboard);

// ── Logout ─────────────────────────────────────────────────────────────────
router.post("/logout", authController.logout);
router.post("/api/auth/logout", authController.logout);

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — OTP ONLY HERE
// ════════════════════════════════════════════════════════════════════════════
router.post("/api/forgot/send-otp", authController.sendForgotOtp);
router.post("/api/forgot/verify-otp", authController.verifyForgotOtp);
router.post("/api/forgot/reset-password", authController.resetPassword);

module.exports = router;