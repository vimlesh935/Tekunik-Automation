const { query } = require("../config/db");

const CACHE_KEY = "email_templates";
let templateCache = null;

const invalidateCache = () => {
  templateCache = null;
};

const parseJsonArray = (value, fallback) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const loadTemplates = async () => {
  if (templateCache) return templateCache;
  
  const rows = await query(`
    SELECT id, template_key, template_name, trigger_event, subject, body, default_subject, default_body,
           variables, variables_meta, protected_variables, category, is_enabled, created_at, updated_at
    FROM email_templates
    ORDER BY category, template_name
  `);
  
  templateCache = rows.map(({ trigger_event, ...row }) => ({
    ...row,
    trigger: String(trigger_event || ""),
    variables: parseJsonArray(row.variables, []),
    variables_meta: parseJsonArray(row.variables_meta, []),
    protected_variables: parseJsonArray(row.protected_variables, []),
    is_enabled: Boolean(row.is_enabled),
  }));
  
  return templateCache;
};

const getTemplateByKey = async (templateKey) => {
  await loadTemplates();
  return templateCache.find(t => t.template_key === templateKey) || null;
};

const getEnabledTemplateByKey = async (templateKey) => {
  const template = await getTemplateByKey(templateKey);
  if (!template || !template.is_enabled) return null;
  return template;
};

const renderTemplate = (template, variables = {}) => {
  if (!template) return { subject: "", body: "" };
  
  let subject = template.subject || template.default_subject || "";
  let body = template.body || template.default_body || "";
  
  const allVariables = { ...variables };
  
  for (const [key, value] of Object.entries(allVariables)) {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : "";
    subject = subject.split(placeholder).join(replacement);
    body = body.split(placeholder).join(replacement);
  }
  
  return { subject, body };
};

const getAllTemplates = async () => {
  return loadTemplates();
};

const getTemplatesByCategory = async (category) => {
  await loadTemplates();
  return templateCache.filter(t => t.category === category);
};

const createTemplate = async (data) => {
  const { template_key, template_name, subject, body, default_subject, default_body, variables, category, is_enabled = 1 } = data;
  
  const result = await query(
    `INSERT INTO email_templates (template_key, template_name, subject, body, default_subject, default_body, variables, category, is_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [template_key, template_name, subject, body, default_subject, default_body, JSON.stringify(variables || []), category || "general", is_enabled]
  );
  
  invalidateCache();
  return getTemplateByKey(template_key);
};

const updateTemplate = async (templateKey, data) => {
  const allowedFields = ["template_name", "subject", "body", "variables", "category", "is_enabled", "trigger_event", "variables_meta", "protected_variables"];
  const updates = [];
  const values = [];
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      if (["variables", "variables_meta", "protected_variables"].includes(field) && Array.isArray(data[field])) {
        values.push(JSON.stringify(data[field]));
      } else {
        values.push(data[field]);
      }
    }
  }
  
  if (!updates.length) return getTemplateByKey(templateKey);
  
  values.push(templateKey);
  await query(
    `UPDATE email_templates SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE template_key = ?`,
    values
  );
  
  invalidateCache();
  return getTemplateByKey(templateKey);
};

const deleteTemplate = async (templateKey) => {
  await query("DELETE FROM email_templates WHERE template_key = ?", [templateKey]);
  invalidateCache();
  return true;
};

const resetTemplateToDefault = async (templateKey) => {
  const template = await getTemplateByKey(templateKey);
  if (!template) return null;
  
  await query(
    `UPDATE email_templates SET subject = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE template_key = ?`,
    [template.default_subject, template.default_body, templateKey]
  );
  
  invalidateCache();
  return getTemplateByKey(templateKey);
};

const getSampleVariables = (templateKey) => {
  const samples = {
    forgot_password_otp: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      otp: "583214",
    },
    change_password_otp: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      otp: "583214",
    },
    welcome: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
    },
    order_placed: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      order_id: "ORD123456",
      order_total: "₹12,499",
      date: "10 Sep 2026",
    },
    return_request: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      order_id: "ORD123456",
      date: "10 Sep 2026",
    },
    refund: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      order_id: "ORD123456",
      refund_amount: "₹12,499",
      date: "10 Sep 2026",
    },
    abandoned_cart: {
      user_name: "Rahul Sharma",
      user_email: "rahul.sharma@example.com",
      cart_link: "https://tekunikautomation.com/cart",
      date: "10 Sep 2026",
    },
  };
  return samples[templateKey] || {};
};

/**
 * Friendly metadata for every supported variable of a template.
 * The admin never sees raw {{keys}} — only these labels/descriptions.
 */
const getVariableMetadata = (template) => {
  if (!template) return [];
  const metaByKey = new Map(
    (template.variables_meta || []).map((m) => [String(m.key), m])
  );
  return (template.variables || []).map((key) => ({
    key: String(key),
    label: metaByKey.get(String(key))?.label || String(key),
    description: metaByKey.get(String(key))?.description || "",
    sample: metaByKey.get(String(key))?.sample || "",
    protected: Boolean(
      (template.protected_variables || []).some(
        (p) => String(p) === String(key)
      )
    ),
  }));
};

const getProtectedVariables = (template) =>
  Array.isArray(template?.protected_variables) ? template.protected_variables.map(String) : [];

/**
 * Validate that a template draft keeps every protected/system-controlled
 * variable (e.g. the OTP) in its body. Returns a list of human-readable
 * errors. An empty array means the draft is safe to save.
 */
const validateProtectedVariables = (template, { subject, body }) => {
  const errors = [];
  if (!template) return errors;

  const protectedVars = getProtectedVariables(template);
  if (protectedVars.length === 0) return errors;

  const combined = `${subject || ""} ${body || ""}`;
  for (const key of protectedVars) {
    const placeholder = `{{${key}}}`;
    if (!combined.includes(placeholder)) {
      const meta = (template.variables_meta || []).find((m) => String(m.key) === String(key));
      const label = meta?.label || key;
      errors.push({
        key,
        label,
        message: `This template requires the "${label}" variable. Its value is always generated securely by the system, so it must stay in the template.`,
      });
    }
  }
  return errors;
};

/**
 * Lightweight sanitization for admin-edited template content.
 * Guards against control/null bytes, trims whitespace and enforces
 * sane length limits so a broken template can never crash the app.
 */
const sanitizeTemplateContent = (value, { maxLength = 20000 } = {}) => {
  let clean = String(value || "");
  // Strip null bytes and ASCII control characters (keep newlines/tabs)
  clean = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return clean.trim().slice(0, maxLength);
};

/** Extract every {{placeholder}} used in a template subject/body. */
const extractVariables = (content) => {
  const matches = String(content || "").match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[{} ]/g, "")))];
};

/**
 * Returns the list of {{placeholder}} values present in `content` that are
 * NOT part of the template's supported variables. Used to warn the admin
 * instead of silently broadcasting an unresolved placeholder.
 */
const detectUnknownVariables = (content, supportedVariables = []) => {
  const supported = new Set((supportedVariables || []).map(String));
  return extractVariables(content).filter((name) => !supported.has(name));
};

/** Render with the sample/demo values for a template; warns about unknown placeholders. */
const renderWithSamples = (template) => {
  if (!template) return { subject: "", body: "", text: "", unknownVariables: [] };
  const samples = getSampleVariables(template.template_key);
  const rendered = renderTemplate(template, samples);
  const unknownVariables = detectUnknownVariables(
    `${template.subject} ${template.body}`,
    template.variables
  );
  return {
    subject: rendered.subject,
    body: rendered.body,
    text: htmlToText(rendered.body),
    unknownVariables,
  };
};

/** Minimal HTML → plain text conversion for email clients that reject HTML. */
const htmlToText = (html) =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/h[1-6]>|<\/tr>|<\/td>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

module.exports = {
  loadTemplates,
  getTemplateByKey,
  getEnabledTemplateByKey,
  renderTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  resetTemplateToDefault,
  getSampleVariables,
  getVariableMetadata,
  getProtectedVariables,
  validateProtectedVariables,
  sanitizeTemplateContent,
  extractVariables,
  detectUnknownVariables,
  renderWithSamples,
  htmlToText,
  invalidateCache,
};