const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminMiddleware");
const { query } = require("../config/db");
const settingsService = require("../config/settingsService");
const mailService = require("../services/mailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DURATION_REGEX = /^\d+[smhd]$/;

let smtpCheckCache = { signature: null, at: 0, state: null };
const SMTP_CHECK_TTL = 60 * 1000;
let smtpCheckInflight = null;

const effectiveSignature = async () =>
  JSON.stringify([
    await settingsService.get("smtp.host"),
    await settingsService.get("smtp.port"),
    await settingsService.getBool("smtp.secure"),
    await settingsService.getBool("smtp.tlsRejectUnauthorized"),
  ]);

// Real SMTP check (actual connection + auth attempt), cached 60s by config.
// Concurrent callers share a single in-flight verification.
const runSmtpCheck = async () => {
  const signature = await effectiveSignature();
  if (
    smtpCheckCache.state &&
    smtpCheckCache.signature === signature &&
    Date.now() - smtpCheckCache.at < SMTP_CHECK_TTL
  ) {
    return smtpCheckCache.state;
  }
  if (smtpCheckInflight) return smtpCheckInflight;
  smtpCheckInflight = (async () => {
    try {
      await mailService.verifyTransporter();
      smtpCheckCache.state = { connected: true, label: mailService.getSmtpStatus().activeTransport, message: null };
    } catch (error) {
      smtpCheckCache.state = {
        connected: false,
        label: null,
        message: String(error.message || "SMTP verification failed").slice(0, 300),
      };
    }
    smtpCheckCache.signature = signature;
    smtpCheckCache.at = Date.now();
    return smtpCheckCache.state;
  })().finally(() => {
    smtpCheckInflight = null;
  });
  return smtpCheckInflight;
};

const buildLiveStatus = async (skipSmtpVerify = false) => {
  let dbConnected = false;
  try {
    await query("SELECT 1");
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  const dbRecord = await settingsService.get("smtp.pass").catch(() => "");

  const smtpState = skipSmtpVerify
    ? smtpCheckCache.state || { connected: null, checking: true, message: null }
    : await runSmtpCheck();

  return {
    api: dbConnected ? "online" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    smtp: {
      ...smtpState,
      configured: Boolean(dbRecord),
    },
  };
};

// GET /api/admin/settings/backend — safe, masked configuration + real status.
router.get("/api/admin/settings/backend", requireAdmin, async (req, res, next) => {
  try {
    const snapshot = await settingsService.getAdminSnapshot(req.admin?.id);
    const status = await buildLiveStatus();
    res.json({ success: true, data: { ...snapshot, status } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/settings/backend — update dynamic settings (DB-persisted).
router.put("/api/admin/settings/backend", requireAdmin, async (req, res, next) => {
  try {
    const updates = req.body && typeof req.body === "object" ? req.body : {};
    const updatedBy = req.admin?.email || "admin";
    let smtpChanged = false;
    let jwtChanged = false;

    if (updates.admin && typeof updates.admin === "object") {
      const { email, password, currentPassword } = updates.admin;
      if (email !== undefined || password !== undefined) {
        const adminController = require("../controllers/adminController");
        await adminController.updateAdminAccountCore({
          adminId: req.admin?.id,
          currentPassword: String(currentPassword || ""),
          email,
          password,
        });
      }
    }

    if (updates.smtp && typeof updates.smtp === "object") {
      const smtp = updates.smtp;
      if (smtp.host !== undefined) {
        const host = String(smtp.host).trim();
        if (host.length > 255) return res.status(400).json({ success: false, message: "SMTP host is too long" });
        await settingsService.set("smtp.host", host, updatedBy);
        smtpChanged = true;
      }
      if (smtp.port !== undefined) {
        const port = Number(smtp.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          return res.status(400).json({ success: false, message: "SMTP port must be 1-65535" });
        }
        await settingsService.set("smtp.port", String(port), updatedBy);
        smtpChanged = true;
      }
      if (smtp.user !== undefined) {
        const user = String(smtp.user).trim();
        if (user.length > 255) return res.status(400).json({ success: false, message: "SMTP user is too long" });
        await settingsService.set("smtp.user", user, updatedBy);
        smtpChanged = true;
      }
      if (smtp.password !== undefined) {
        const password = String(smtp.password);
        if (password.length > 500) return res.status(400).json({ success: false, message: "SMTP password is too long" });
        await settingsService.setSecret("smtp.pass", password, updatedBy);
        smtpChanged = true;
      }
      if (smtp.from !== undefined) {
        const from = String(smtp.from).trim().toLowerCase();
        if (from && !EMAIL_REGEX.test(from)) {
          return res.status(400).json({ success: false, message: "Invalid SMTP From email format" });
        }
        await settingsService.set("smtp.from", from, updatedBy);
        smtpChanged = true;
      }
      if (smtp.secure !== undefined) {
        await settingsService.set("smtp.secure", String(Boolean(smtp.secure)), updatedBy);
        smtpChanged = true;
      }
      if (smtp.tlsRejectUnauthorized !== undefined) {
        await settingsService.set("smtp.tlsRejectUnauthorized", String(Boolean(smtp.tlsRejectUnauthorized)), updatedBy);
        smtpChanged = true;
      }
      if (smtp.allowSelfSignedFallback !== undefined) {
        await settingsService.set("smtp.allowSelfSignedFallback", String(Boolean(smtp.allowSelfSignedFallback)), updatedBy);
        smtpChanged = true;
      }
    }

    if (updates.jwt && typeof updates.jwt === "object" && updates.jwt.expiresIn !== undefined) {
      const expiresIn = String(updates.jwt.expiresIn).trim();
      if (!DURATION_REGEX.test(expiresIn)) {
        return res.status(400).json({ success: false, message: "JWT expiry must look like 30m, 12h, 1d (letters m/h/d/s only)" });
      }
      await settingsService.set("jwt.expiresIn", expiresIn, updatedBy);
      jwtChanged = true;
    }

    if (smtpChanged) {
      await mailService.resetTransporter();
      smtpCheckCache.state = null;
      smtpCheckCache.signature = null;
      smtpCheckCache.at = 0;
      runSmtpCheck().catch(() => {}); // warm the cache in the background
    }

    const snapshot = await settingsService.getAdminSnapshot(req.admin?.id);
    const status = await buildLiveStatus(smtpChanged);
    res.json({ success: true, message: "Backend settings updated", data: { ...snapshot, status } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/settings/backend/test-smtp — real connection + auth check.
router.post("/api/admin/settings/backend/test-smtp", requireAdmin, async (req, res, next) => {
  try {
    await mailService.verifyTransporter();
    const status = mailService.getSmtpStatus();
    res.json({
      success: true,
      data: { connected: true, label: status.activeTransport, message: null },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        connected: false,
        label: null,
        message: String(error.message || "SMTP verification failed").slice(0, 300),
      },
    });
  }
});

// POST /api/admin/settings/backend/test-database — real connectivity check.
router.post("/api/admin/settings/backend/test-database", requireAdmin, async (req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ success: true, data: { connected: true, message: null } });
  } catch (error) {
    res.json({
      success: true,
      data: { connected: false, message: String(error.message || "Database unreachable").slice(0, 300) },
    });
  }
});

// POST /api/admin/settings/backend/send-test-email — real email send using
// the current dynamic SMTP configuration and From address.
router.post("/api/admin/settings/backend/send-test-email", requireAdmin, async (req, res, next) => {
  try {
    const adminRows = await query("SELECT email FROM admins WHERE status = 'active' ORDER BY id LIMIT 1");
    const to = String((req.body && req.body.to) || adminRows[0]?.email || "").trim();
    if (!EMAIL_REGEX.test(to)) {
      return res.status(400).json({ success: false, message: "Invalid recipient email address" });
    }

    const transporter = await mailService.createTransporter();
    const status = mailService.getSmtpStatus();
    const info = await transporter.sendMail({
      from: status.from || status.user,
      to,
      subject: "Tekunik — Backend Settings Test Email",
      text: "This is a test email sent from the Admin Panel Backend Settings. If you received it, SMTP delivery is working with the current configuration.",
      html: `<div style="font-family:Arial,sans-serif;padding:24px;background:#f6f8fb;"><div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px;"><h2 style="color:#111827;margin:0 0 12px;">Test Email</h2><p style="color:#374151;font-size:15px;">This is a test email sent from the <b>Admin Panel → Settings → Backend</b>. If you received it, SMTP delivery is working with the current configuration.</p></div></div>`,
    });

    if (!info.accepted || !info.accepted.length) {
      return res.json({
        success: true,
        data: { sent: false, message: "SMTP did not accept the recipient" },
      });
    }
    res.json({
      success: true,
      data: { sent: true, to, from: status.from || status.user, messageId: info.messageId || null },
    });
  } catch (error) {
    res.json({
      success: true,
      data: { sent: false, message: String(error.message || "Failed to send test email").slice(0, 300) },
    });
  }
});

router.warmupSmtpCheck = () => runSmtpCheck().catch(() => {});

module.exports = router;