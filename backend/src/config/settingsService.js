const crypto = require("node:crypto");
const env = require("./env");
const { query } = require("./db");

/**
 * Central configuration service for dynamic (database-backed) settings.
 *
 * Reuses the project's existing `system_settings` key/value table
 * (setting_key UNIQUE, setting_type enum including 'encrypted', is_encrypted
 * flag, category). No duplicate settings system is created.
 *
 * PRECEDENCE MODEL:
 *   Database value  → preferred runtime value
 *   .env            → fallback ONLY when the database value is empty/unset
 *
 * The database is the source of truth once a key has a non-empty value
 * (seeded from .env at first boot). To revert to the .env default, clear the
 * database value (or delete the row) from the Admin Panel.
 *
 * SECRETS:
 *   Values stored with setting_type 'encrypted' are encrypted at rest with
 *   AES-256-GCM using a key derived (scrypt) from the server-side JWT_SECRET.
 *   They are never returned raw by any API — only `configured` indicators.
 */

const SECRET_PREFIX = "gcm:v1:";

const deriveKey = () => {
  const secret = String(env.jwtSecret || "change-this-jwt-secret-in-env");
  return crypto.scryptSync(secret, "tekunik-settings-v1", 32);
};

const encryptSecret = (plain) => {
  const value = String(plain || "");
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SECRET_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
};

const decryptSecret = (stored) => {
  const value = String(stored || "");
  if (!value.startsWith(SECRET_PREFIX)) return "";
  try {
    const parts = value.slice(SECRET_PREFIX.length).split(":");
    if (parts.length !== 3) return "";
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    const ct = Buffer.from(parts[2], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
};

// .env fallbacks — DB value wins, env fills gaps.
const ENV_FALLBACK = {
  "smtp.host": () => String(env.smtp.host || "smtp.gmail.com").trim(),
  "smtp.port": () => String(Number(env.smtp.port || 0) || 465),
  "smtp.user": () => String(env.smtp.user || "").trim(),
  "smtp.pass": () => String(env.smtp.pass || ""),
  "smtp.from": () => String(env.smtp.from || "").trim(),
  "smtp.secure": () =>
    typeof env.smtp.secure === "boolean"
      ? String(env.smtp.secure)
      : String(Number(env.smtp.port || 465) === 465),
  "smtp.tlsRejectUnauthorized": () => String(env.smtp.tlsRejectUnauthorized !== false),
  "smtp.allowSelfSignedFallback": () => String(Boolean(env.smtp.allowSelfSignedFallback)),
  "jwt.expiresIn": () => String(env.jwtExpiresIn || "1d").trim(),
  "payment.razorpayKeyId": () => String(env.razorpay.keyId || "").trim(),
  "payment.razorpayKeySecret": () => String(env.razorpay.keySecret || ""),
  "emailValidation.abstractApiKey": () => String(process.env.ABSTRACT_EMAIL_API_KEY || ""),
};

// Keys (by convention) whose DB rows are stored encrypted.
const SECRET_KEYS = new Set([
  "smtp.pass",
  "payment.razorpayKeySecret",
  "emailValidation.abstractApiKey",
]);

// category assigned to each managed key (existing table convention).
const KEY_CATEGORY = {
  "smtp.host": "email",
  "smtp.port": "email",
  "smtp.user": "email",
  "smtp.pass": "email",
  "smtp.from": "email",
  "smtp.secure": "email",
  "smtp.tlsRejectUnauthorized": "email",
  "smtp.allowSelfSignedFallback": "email",
  "jwt.expiresIn": "security",
  "payment.razorpayKeyId": "payment",
  "payment.razorpayKeySecret": "payment",
  "emailValidation.abstractApiKey": "emailvalidation",
};

const cache = { rows: null };

const loadRows = async () => {
  const rows = await query(
    "SELECT setting_key, setting_value, setting_type, category, is_encrypted FROM system_settings"
  );
  cache.rows = rows.map((row) => ({
    key: row.setting_key,
    value: row.setting_value == null ? "" : String(row.setting_value),
    type: row.setting_type || "string",
    category: row.category || "",
    encrypted: Number(row.is_encrypted) === 1 || String(row.setting_type) === "encrypted",
  }));
  return cache.rows;
};

const ensureLoaded = async () => {
  if (!cache.rows) {
    try {
      await loadRows();
    } catch {
      cache.rows = [];
    }
  }
};

const invalidateCache = async () => {
  cache.rows = null;
  try {
    await ensureLoaded();
  } catch {
    // DB unavailable — callers fall back to ENV_FALLBACK values.
  }
};

const findRow = (key) => (cache.rows || []).find((r) => r.key === key);

const isSecretKey = (key, row) =>
  SECRET_KEYS.has(key) ||
  Boolean(row?.encrypted) ||
  String(row?.type) === "encrypted";

/**
 * Synchronous read used by services that cannot await (JWT signing etc.).
 * Falls back to .env until the cache is loaded or when the DB value is empty.
 */
const getCached = (key) => {
  const row = findRow(key);
  if (row && row.value) {
    if (isSecretKey(key, row)) return decryptSecret(row.value);
    return row.value;
  }
  const fallback = ENV_FALLBACK[key];
  return fallback ? fallback() : "";
};

/** Async read; preferred for services that can await. */
const get = async (key) => {
  await ensureLoaded();
  return getCached(key);
};

const getBool = async (key) => {
  const value = String((await get(key)) || "").trim().toLowerCase();
  return value === "true" || value === "1";
};

const getNumber = async (key) => Number(await get(key)) || 0;

/** Upsert a single setting (non-secret). Empty value clears -> env fallback. */
const set = async (key, value, updatedBy = "") => {
  const stored = value == null ? "" : String(value);
  const category = KEY_CATEGORY[key] || "general";
  await query(
    `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, is_encrypted)
     VALUES (?, ?, 'string', ?, 0)
     ON DUPLICATE KEY UPDATE setting_value = ?, category = ?`,
    [key, stored, category, stored, category]
  );
  await invalidateCache();
};

/** Upsert a secret: plaintext is encrypted before storage. */
const setSecret = async (key, plain, updatedBy = "") => {
  const stored = encryptSecret(plain);
  const category = KEY_CATEGORY[key] || "general";
  await query(
    `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, is_encrypted)
     VALUES (?, ?, 'encrypted', ?, 1)
     ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = 'encrypted', is_encrypted = 1, category = ?`,
    [key, stored, category, stored, category]
  );
  await invalidateCache();
};

/** Mask a single character for display. */
const mask = (value) => {
  const text = String(value || "");
  if (!text) return "";
  if (text.length <= 4) return "*".repeat(text.length);
  return `${text.slice(0, 2)}${"*".repeat(Math.min(8, text.length - 4))}${text.slice(-2)}`;
};

/**
 * Safe snapshot for the Admin UI.
 * adminId = the currently authenticated admin (their own email is editable).
 * NEVER contains raw secret values — only configured indicators.
 */
const getAdminSnapshot = async (adminId) => {
  await ensureLoaded();

  let adminEmail = "";
  try {
    const rows = adminId
      ? await query("SELECT email FROM admins WHERE id = ? AND status = 'active' LIMIT 1", [adminId])
      : await query("SELECT email FROM admins WHERE status = 'active' ORDER BY id LIMIT 1");
    adminEmail = rows[0]?.email || "";
  } catch {
    // fall back to the seeding default if the admins table is unreachable
  }
  if (!adminEmail) adminEmail = String(env.adminEmail || "");

  const smtpPass = await get("smtp.pass");
  const razorpaySecret = await get("payment.razorpayKeySecret");
  const abstractKey = await get("emailValidation.abstractApiKey");

  return {
    admin: { email: adminEmail },
    smtp: {
      host: await get("smtp.host"),
      port: await getNumber("smtp.port"),
      user: await get("smtp.user"),
      from: await get("smtp.from"),
      secure: await getBool("smtp.secure"),
      tlsRejectUnauthorized: await getBool("smtp.tlsRejectUnauthorized"),
      allowSelfSignedFallback: await getBool("smtp.allowSelfSignedFallback"),
      passwordConfigured: Boolean(smtpPass),
    },
    payments: {
      razorpayKeyId: await get("payment.razorpayKeyId"),
      razorpayKeySecretConfigured: Boolean(razorpaySecret),
    },
    emailValidation: {
      abstractApiKeyConfigured: Boolean(abstractKey),
    },
    jwt: {
      expiresIn: await get("jwt.expiresIn"),
    },
  };
};

module.exports = {
  encryptSecret,
  decryptSecret,
  mask,
  get,
  getCached,
  getBool,
  getNumber,
  set,
  setSecret,
  invalidateCache,
  getAdminSnapshot,
  SECRET_KEYS,
  ENV_FALLBACK,
};