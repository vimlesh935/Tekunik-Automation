const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Registration (NO OTP) ──────────────────────────────────────────────────
router.post("/api/auth/register", authController.register);

// ── Login (Email + Password only) ───────────────────────────────────────────
router.post("/api/auth/login", authController.login);

// ── Logout ─────────────────────────────────────────────────────────────────
router.post("/api/auth/logout", authController.logout);

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — OTP ONLY HERE
// ════════════════════════════════════════════════════════════════════════════
router.post("/api/forgot/send-otp", authController.sendForgotOtp);
router.post("/api/forgot/verify-otp", authController.verifyForgotOtp);
router.post("/api/forgot/reset-password", authController.resetPassword);

// ── Dashboard (Protected) ──────────────────────────────────────────────────
router.get("/api/dashboard", requireAuth, authController.dashboard);

module.exports = router;