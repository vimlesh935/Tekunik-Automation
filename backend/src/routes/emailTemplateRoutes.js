const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminMiddleware");
const emailTemplateService = require("../services/emailTemplateService");
const { sendTemplatedMessage } = require("../services/mailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const SUBJECT_MAX = 500;
const BODY_MAX = 20000;
const TEMPLATE_NAME_MAX = 200;

const pickTemplate = async (key) => {
  const template = await emailTemplateService.getTemplateByKey(key);
  if (!template) {
    const error = new Error("Email template not found");
    error.statusCode = 404;
    throw error;
  }
  return template;
};

// GET /api/admin/email-templates — list every user email template (invoice excluded).
router.get("/api/admin/email-templates", requireAdmin, async (req, res, next) => {
  try {
    const templates = await emailTemplateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/email-templates/:key — single template.
router.get("/api/admin/email-templates/:key", requireAdmin, async (req, res, next) => {
  try {
    const template = await pickTemplate(req.params.key);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/email-templates/:key — save admin-edited subject/body/name/status.
router.put("/api/admin/email-templates/:key", requireAdmin, async (req, res, next) => {
  try {
    const template = await pickTemplate(req.params.key);

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const updates = {};

    if (body.template_name !== undefined) {
      updates.template_name = emailTemplateService.sanitizeTemplateContent(body.template_name, { maxLength: TEMPLATE_NAME_MAX });
      if (!updates.template_name) {
        const error = new Error("Template name cannot be empty");
        error.statusCode = 400;
        throw error;
      }
    }

    if (body.subject !== undefined) {
      updates.subject = emailTemplateService.sanitizeTemplateContent(body.subject, { maxLength: SUBJECT_MAX });
      if (!updates.subject) {
        const error = new Error("Email subject cannot be empty");
        error.statusCode = 400;
        throw error;
      }
    }

    if (body.body !== undefined) {
      updates.body = emailTemplateService.sanitizeTemplateContent(body.body, { maxLength: BODY_MAX });
      if (!updates.body) {
        const error = new Error("Email body cannot be empty");
        error.statusCode = 400;
        throw error;
      }
    }

    if (body.is_enabled !== undefined) {
      updates.is_enabled = body.is_enabled ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      const error = new Error("No template changes provided");
      error.statusCode = 400;
      throw error;
    }

    // 🔒 System-controlled variables (e.g. OTP) must never be removed.
    // Draft an admin cannot save a broken email in which the secure value
    // (OTP, generated server-side) would never reach the user.
    const nextSubject = updates.subject !== undefined ? updates.subject : template.subject;
    const nextBody = updates.body !== undefined ? updates.body : template.body;
    const protectedErrors = emailTemplateService.validateProtectedVariables(
      template,
      { subject: nextSubject, body: nextBody }
    );

    if (protectedErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: protectedErrors[0].message,
        data: { protectedVariableErrors: protectedErrors },
      });
    }

    const updated = await emailTemplateService.updateTemplate(req.params.key, updates);

    // Warn the admin, but never block saving, about unsupported placeholders.
    const unknownVariables = emailTemplateService.detectUnknownVariables(
      `${updated.subject} ${updated.body}`,
      updated.variables
    );

    res.json({
      success: true,
      message: "Template saved successfully",
      data: {
        ...updated,
        warnings: {
          unknownVariables,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/email-templates/:key/reset — restore default subject/body.
router.post("/api/admin/email-templates/:key/reset", requireAdmin, async (req, res, next) => {
  try {
    const template = await emailTemplateService.resetTemplateToDefault(req.params.key);
    if (!template) {
      const error = new Error("Email template not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ success: true, message: "Template reset to default", data: template });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/email-templates/:key/preview — render with safe sample values.
// NEVER sends a real email. Accepts optional subject/body overrides so the admin
// can preview unsaved edits.
router.post("/api/admin/email-templates/:key/preview", requireAdmin, async (req, res, next) => {
  try {
    const template = await pickTemplate(req.params.key);
    const draft = (req.body && typeof req.body === "object") ? req.body : {};
    const subjectOverride = draft.subject !== undefined
      ? emailTemplateService.sanitizeTemplateContent(draft.subject, { maxLength: SUBJECT_MAX })
      : null;
    const bodyOverride = draft.body !== undefined
      ? emailTemplateService.sanitizeTemplateContent(draft.body, { maxLength: BODY_MAX })
      : null;

    const templateToRender = {
      ...template,
      subject: subjectOverride !== null ? subjectOverride : template.subject,
      body: bodyOverride !== null ? bodyOverride : template.body,
    };

    const rendered = emailTemplateService.renderWithSamples(templateToRender);
    res.json({
      success: true,
      data: {
        subject: rendered.subject,
        body: rendered.body,
        text: rendered.text,
        unknownVariables: rendered.unknownVariables,
        variables: template.variables,
        variablesMeta: emailTemplateService.getVariableMetadata(template),
        protectedVariables: emailTemplateService.getProtectedVariables(template),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/email-templates/:key/send-test — send ONLY to the requested test
// recipient using safe sample values. Never triggers a real business event.
// Accepts optional subject/body overrides so the admin can test unsaved edits.
router.post("/api/admin/email-templates/:key/send-test", requireAdmin, async (req, res, next) => {
  try {
    const to = String((req.body && req.body.to) || "").trim();
    if (!EMAIL_REGEX.test(to)) {
      return res.status(400).json({ success: false, message: "Invalid test recipient email address" });
    }

    const template = await pickTemplate(req.params.key);
    const draft = (req.body && typeof req.body === "object") ? req.body : {};
    const subjectOverride = draft.subject !== undefined
      ? emailTemplateService.sanitizeTemplateContent(draft.subject, { maxLength: SUBJECT_MAX })
      : null;
    const bodyOverride = draft.body !== undefined
      ? emailTemplateService.sanitizeTemplateContent(draft.body, { maxLength: BODY_MAX })
      : null;

    const templateToRender = {
      ...template,
      subject: subjectOverride !== null ? subjectOverride : template.subject,
      body: bodyOverride !== null ? bodyOverride : template.body,
    };

    const rendered = emailTemplateService.renderWithSamples(templateToRender);

    const info = await sendTemplatedMessage({
      to,
      subject: rendered.subject,
      html: rendered.body,
      text: rendered.text,
    });

    res.json({
      success: true,
      message: `Test email sent to ${to}`,
      data: {
        sent: true,
        to,
        templateKey: template.template_key,
        messageId: info.messageId || null,
        unknownVariables: rendered.unknownVariables,
      },
    });
  } catch (error) {
    // Keep the API JSON-shaped like the other settings test endpoints.
    res.json({
      success: true,
      data: {
        sent: false,
        message: String(error.message || "Failed to send test email").slice(0, 300),
      },
    });
  }
});

module.exports = router;