const { query } = require("../config/db");
const { htmlToText, sanitizeTemplateContent } = require("./emailTemplateService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const MAX_SUBJECT_LENGTH = 500;
const MAX_BODY_LENGTH = 20000;

// Tags the admin is allowed to write. Everything else is stripped so the
// resulting email can never execute scripts or inject unsafe markup.
const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span", "b", "strong", "i", "em", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "sub", "sup", "small", "big",
]);

const isUnsafeUrl = (value) =>
  /^\s*(javascript:|data:text\/html|vbscript:|file:)/i.test(String(value || "").trim());

const escapeAttr = (value) =>
  String(value)
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const ALLOWED_CSS_PREFIX = /^(text-align|font-weight|font-style|text-decoration|margin|padding|font-size)\s*:/i;

const sanitizeCss = (css) => {
  const parts = String(css || "").split(";");
  const kept = [];
  for (const part of parts) {
    const prop = part.trim();
    if (!prop) continue;
    if (ALLOWED_CSS_PREFIX.test(prop) && !/expression\s*\(|url\s*\(|javascript:/i.test(prop)) {
      kept.push(prop);
    }
  }
  return kept.join("; ");
};

const sanitizeAttributes = (rawAttrs) => {
  const kept = [];
  const attrRe = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;
  while ((match = attrRe.exec(rawAttrs || "")) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] || ""));
    if (name === "href") {
      if (isUnsafeUrl(value)) continue;
      kept.push(`href="${escapeAttr(value)}"`);
    } else if (name === "style") {
      const clean = sanitizeCss(value);
      if (clean) kept.push(`style="${escapeAttr(clean)}"`);
    } else if (name === "align" && /^(left|center|right|justify)$/i.test(value)) {
      kept.push(`align="${value.toLowerCase()}"`);
    } else if (name === "target" && /^_blank$/i.test(value)) {
      kept.push(`target="_blank" rel="noopener"`);
    }
  }
  return kept.length ? ` ${kept.join(" ")}` : "";
};

/**
 * Whitelist-based HTML sanitizer for admin-written custom email content.
 * Strips script/style/event handlers/unsafe URLs — the email can never
 * execute arbitrary code on the recipient's machine or mail client.
 */
const sanitizeHtml = (html) => {
  let out = String(html || "");
  // Remove comments and dangerous blocks outright.
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  out = out.replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "");
  out = out.replace(/<\s*iframe[\s\S]*?<\s*\/\s*iframe\s*>/gi, "");
  out = out.replace(/<\s*object[\s\S]*?<\s*\/\s*object\s*>/gi, "");
  out = out.replace(/<\s*embed[\s\S]*?\/?\s*>/gi, "");
  out = out.replace(/<(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)(\/?)>/g, (match, close, tagName, rawAttrs, selfClose) => {
    const tag = String(tagName).toLowerCase();
    if (close) return ALLOWED_TAGS.has(tag) ? `</${tag}>` : "";
    if (!ALLOWED_TAGS.has(tag)) return "";
    const cleanAttrs = sanitizeAttributes(rawAttrs);
    return selfClose ? `<${tag}${cleanAttrs} />` : `<${tag}${cleanAttrs}>`;
  });
  // Parse <!-- leftovers from partial matches are already gone; ensure no
  // stray <script etc remain.
  out = out.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*[^<>]*\/?>/g, (m) => {
    const nameMatch = m.match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/);
    const tag = nameMatch ? nameMatch[1].toLowerCase() : "";
    if (tag && !ALLOWED_TAGS.has(tag)) return "";
    return m;
  });
  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
// Friendly dynamic details ([Name] / [Email]) — resolved for existing users.
// ─────────────────────────────────────────────────────────────────────────────

/** Look up a recipient in the customer database. */
const resolveRecipient = async (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  const [user] = await query(
    `SELECT u.id, u.email, u.username,
            CONCAT_WS(' ', up.first_name, up.last_name) AS full_name
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE LOWER(u.email) = ?
     LIMIT 1`,
    [normalized],
  );
  if (!user) return { email: normalized, name: null, isRegistered: false };
  const name = String(user.full_name || user.username || "").trim() || null;
  return { email: normalized, name, isRegistered: true, userId: user.id };
};

/** Replace friendly [Name] / [Email] tags (case-insensitive, spaces tolerated). */
const resolveTags = (content, { name = null, email = "" } = {}) => {
  let out = String(content || "");
  const resolvedName = name && String(name).trim() ? String(name).trim() : "Customer";
  out = out.replace(/\[\s*name\s*\]/gi, resolvedName);
  out = out.replace(/\[\s*email\s*\]/gi, String(email || "").trim());
  return out;
};

/** Detect which friendly tags are actually used (for preview hints). */
const usedTags = (content) => {
  const used = [];
  if (/\[\s*name\s*\]/i.test(String(content || ""))) used.push("Name");
  if (/\[\s*email\s*\]/i.test(String(content || ""))) used.push("Email");
  return used;
};

const validateDraft = ({ to, subject, body }) => {
  const recipient = String(to || "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(recipient)) {
    const error = new Error("Invalid recipient email address");
    error.statusCode = 400;
    error.code = "INVALID_RECIPIENT_EMAIL";
    throw error;
  }
  const cleanSubject = sanitizeTemplateContent(subject, { maxLength: MAX_SUBJECT_LENGTH });
  if (!cleanSubject) {
    const error = new Error("Email subject cannot be empty");
    error.statusCode = 400;
    error.code = "EMPTY_SUBJECT";
    throw error;
  }
  const cleanBody = sanitizeTemplateContent(body, { maxLength: MAX_BODY_LENGTH });
  if (!cleanBody) {
    const error = new Error("Email message cannot be empty");
    error.statusCode = 400;
    error.code = "EMPTY_BODY";
    throw error;
  }
  return { recipient, subject: cleanSubject, body: cleanBody };
};

module.exports = {
  EMAIL_REGEX,
  MAX_SUBJECT_LENGTH,
  MAX_BODY_LENGTH,
  sanitizeHtml,
  resolveRecipient,
  resolveTags,
  usedTags,
  validateDraft,
  htmlToText,
};