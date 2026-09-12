const { query } = require("../config/db");
const AppError = require("../utils/appError");
const {
  sanitizeHtml,
  resolveRecipient,
  resolveTags,
  usedTags,
  validateDraft,
  htmlToText,
} = require("../services/customEmailService");
const { sendTemplatedMessage } = require("../services/mailService");
const { createActivity, ACTIVITY_TYPES } = require("../services/adminActivityService");

const SAMPLE_NAME = "Customer";

const genericFailure = (res, status = 200) =>
  res.status(status).json({
    success: false,
    message: "Unable to send email. Please try again.",
  });

/**
 * POST /api/admin/custom-email/resolve
 * Report whether a recipient email belongs to an existing customer so the
 * admin UI can show how [Name] will resolve. No email is sent.
 */
const resolve = async (req, res, next) => {
  try {
    const recipient = await resolveRecipient(req.body?.to);
    res.json({
      success: true,
      data: {
        email: recipient.email,
        isRegistered: recipient.isRegistered,
        name: recipient.name || SAMPLE_NAME,
      },
    });
  } catch (error) {
    next(error);
  }
};

const prepareDraft = async (req, { sample } = {}) => {
  const { recipient, subject, body } = validateDraft(req.body || {});
  const recipientInfo = sample
    ? { email: recipient, name: null, isRegistered: false }
    : await resolveRecipient(recipient);
  const name = recipientInfo.name || SAMPLE_NAME;
  const safeSubject = subject;
  const safeBody = sanitizeHtml(body);
  const renderedSubject = resolveTags(safeSubject, { name, email: recipient });
  const renderedBody = resolveTags(safeBody, { name, email: recipient });
  return { recipient, name, isRegistered: Boolean(recipientInfo.isRegistered), safeSubject, safeBody, renderedSubject, renderedBody };
};

/**
 * POST /api/admin/custom-email/preview
 * Renders the draft with sample details. NEVER sends a real email.
 */
const preview = async (req, res, next) => {
  try {
    const draft = await prepareDraft(req, { sample: false });
    res.json({
      success: true,
      data: {
        recipient: draft.recipient,
        isRegistered: draft.isRegistered,
        name: draft.name,
        subject: draft.renderedSubject,
        body: draft.renderedBody,
        text: htmlToText(draft.renderedBody),
        tags: usedTags(`${req.body?.subject} ${req.body?.body}`),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/custom-email/send-test
 * Sends the current draft ONLY to the requested test address using sample
 * values. Never modifies user data and never triggers a business event.
 */
const sendTest = async (req, res, next) => {
  try {
    const to = String((req.body && req.body.to) || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(to)) {
      return res.status(400).json({ success: false, message: "Invalid test recipient email address" });
    }
    const draft = await prepareDraft(req, { sample: true });
    try {
      await sendTemplatedMessage({
        to,
        subject: draft.renderedSubject,
        html: draft.renderedBody,
        text: htmlToText(draft.renderedBody),
      });
      console.log("✅ [CUSTOM EMAIL] Test sent to", to, "| sample name:", draft.name);
      res.json({ success: true, data: { sent: true, to }, message: `Test email sent to ${to}` });
    } catch (error) {
      console.error("[CUSTOM EMAIL] sendTest failed:", error.message);
      res.json({ success: true, data: { sent: false, to }, message: "Unable to send email. Please try again." });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/custom-email/send
 * Sends the manual custom email to ANY valid address. Existing users get
 * their real name/email resolved; unknown addresses get "Customer" so the
 * email is never broken. Records one history entry per attempt.
 */
const send = async (req, res, next) => {
  let draft;
  try {
    draft = await prepareDraft(req, { sample: false });
  } catch (error) {
    return next(error);
  }

  const adminId = req.admin?.id ?? null;
  const adminEmail = req.admin?.email || "";
  const saveHistory = (status, errorMessage = null) => {
    try {
      return query(
        `INSERT INTO custom_email_history
           (recipient_email, subject, body, recipient_name, sent_by_admin, sent_by_email, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [draft.recipient, draft.safeSubject, draft.safeBody, draft.name, adminId, adminEmail, status, errorMessage ? String(errorMessage).slice(0, 500) : null],
      );
    } catch (historyError) {
      console.warn("[CUSTOM EMAIL] Failed to record history:", historyError.message);
      return null;
    }
  };

  try {
    const info = await sendTemplatedMessage({
      to: draft.recipient,
      subject: draft.renderedSubject,
      html: draft.renderedBody,
      text: htmlToText(draft.renderedBody),
    });
    await saveHistory("sent");
    createActivity({
      activityType: ACTIVITY_TYPES.CUSTOM_EMAIL_SENT,
      entityType: "custom_email",
      metadata: { recipient: draft.recipient, subject: draft.safeSubject, messageId: info?.messageId || null },
      priority: "LOW",
      isActionable: false,
    }).catch(() => {});
    console.log("✅ [CUSTOM EMAIL] Sent to", draft.recipient, "| to name:", draft.name);
    res.json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("❌ [CUSTOM EMAIL] Send failed:", error.message);
    await saveHistory("failed", error.message);
    genericFailure(res);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable custom templates (admin-authored, separate from automated templates)
// ─────────────────────────────────────────────────────────────────────────────

const listTemplates = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT c.id, c.template_name, c.subject, c.body, c.created_by, c.created_at, c.updated_at,
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), a.email) AS created_by_name
       FROM custom_email_templates c
       LEFT JOIN admins a ON a.id = c.created_by
       LEFT JOIN user_profiles up ON up.user_id = c.created_by
       ORDER BY c.updated_at DESC, c.id DESC
       LIMIT 200`,
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const templateName = String((req.body && req.body.template_name) || "").trim();
    if (!templateName) return res.status(400).json({ success: false, message: "Template name cannot be empty" });
    const { subject, body } = validateDraft({ to: "admin@test.local", subject: req.body?.subject, body: req.body?.body });
    const safeBody = sanitizeHtml(body);
    const result = await query(
      `INSERT INTO custom_email_templates (template_name, subject, body, created_by)
       VALUES (?, ?, ?, ?)`,
      [templateName, subject, safeBody, req.admin?.id || null],
    );
    res.json({ success: true, message: "Custom template saved", data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

const pickTemplate = async (id) => {
  const row = await query("SELECT * FROM custom_email_templates WHERE id = ? LIMIT 1", [Number(id) || 0]);
  if (!row.length) {
    const error = new AppError("Custom template not found", 404, "TEMPLATE_NOT_FOUND");
    throw error;
  }
  return row[0];
};

const getTemplate = async (req, res, next) => {
  try {
    res.json({ success: true, data: await pickTemplate(req.params.id) });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const existing = await pickTemplate(req.params.id);
    const updates = {};
    const { subject, body } = req.body || {};
    if (req.body?.template_name !== undefined) {
      const name = String(req.body.template_name).trim();
      if (!name) return res.status(400).json({ success: false, message: "Template name cannot be empty" });
      updates.template_name = name;
    }
    if (subject !== undefined || body !== undefined) {
      // Validate against existing content so partial updates always have the
      // other field available (subject OR body alone may be edited).
      const draft = validateDraft({
        to: "admin@test.local",
        subject: subject !== undefined ? subject : existing.subject,
        body: body !== undefined ? body : existing.body,
      });
      if (subject !== undefined) updates.subject = draft.subject;
      if (body !== undefined) updates.body = sanitizeHtml(draft.body);
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No changes provided" });
    }
    const fields = Object.keys(updates);
    const values = [...fields.map((f) => updates[f]), Number(req.params.id) || 0];
    await query(
      `UPDATE custom_email_templates SET ${fields.map((f) => `${f} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
    );
    res.json({ success: true, message: "Custom template updated", data: await pickTemplate(req.params.id) });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await pickTemplate(req.params.id);
    await query("DELETE FROM custom_email_templates WHERE id = ?", [Number(req.params.id) || 0]);
    res.json({ success: true, message: "Custom template deleted" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom email history
// ─────────────────────────────────────────────────────────────────────────────

const listHistory = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const rows = await query(
      `SELECT h.id, h.recipient_email, h.subject, h.recipient_name, h.sent_by_admin, h.sent_by_email,
              h.status, h.error_message, h.created_at
       FROM custom_email_history h
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT ?`,
      [limit],
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  resolve,
  preview,
  sendTest,
  send,
  listTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  listHistory,
};