const { query } = require("../config/db");

/**
 * Get all settings from system_settings table
 * Returns grouped by category and flat key-value
 */
const getAllSettings = async () => {
  const rows = await query("SELECT * FROM system_settings ORDER BY category, setting_key");

  const grouped = {};
  const flat = {};

  for (const row of rows) {
    const category = row.category || "general";
    if (!grouped[category]) {
      grouped[category] = {};
    }

    let value = row.setting_value;
    if (row.setting_type === "boolean") {
      value = value === "true" || value === "1" || value === true;
    } else if (row.setting_type === "number") {
      value = value !== null ? Number(value) : null;
    } else if (row.setting_type === "json") {
      try {
        value = value ? JSON.parse(value) : null;
      } catch {
        value = value;
      }
    }

    grouped[category][row.setting_key] = value;
    flat[row.setting_key] = value;
  }

  return { grouped, flat };
};

/**
 * Validate settings before saving
 */
const validateSettings = (settings) => {
  const errors = {};
  if (settings.website_name && typeof settings.website_name !== "string") {
    errors.website_name = "Website name must be a string";
  }
  if (settings.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.support_email)) {
    errors.support_email = "Invalid email format";
  }
  if (settings.smtp_port && Number(settings.smtp_port) < 1) {
    errors.smtp_port = "Port must be a positive number";
  }
  return errors;
};

/**
 * Upsert settings - update if exists, create if not
 */
const upsertSettings = async (settings) => {
  const errors = validateSettings(settings);
  if (Object.keys(errors).length > 0) {
    const err = new Error("Validation failed");
    err.errors = errors;
    err.statusCode = 400;
    throw err;
  }

  const results = {};
  
  for (const [key, value] of Object.entries(settings)) {
    let settingType = "string";
    let finalValue = String(value ?? "");
    let isEncrypted = 0;

    if (key === "smtp_password" || key.includes("password") || key.includes("secret")) {
      settingType = "encrypted";
      isEncrypted = 1;
      if (!value) finalValue = "";
    } else if (typeof value === "boolean") {
      settingType = "boolean";
      finalValue = value ? "true" : "false";
    } else if (typeof value === "number") {
      settingType = "number";
      finalValue = String(value);
    } else if (typeof value === "object" && value !== null) {
      settingType = "json";
      finalValue = JSON.stringify(value);
    }

    let category = "general";
    if (key.startsWith("smtp_")) category = "email";
    else if (key.startsWith("otp_") || key.startsWith("max_") || key.startsWith("session_") || key.startsWith("enable_")) category = "security";
    else if (key.startsWith("admin_")) category = "admin";

    const existing = await query("SELECT id FROM system_settings WHERE setting_key = ?", [key]);
    if (existing.length) {
      await query(
        "UPDATE system_settings SET setting_value = ?, setting_type = ?, category = ?, is_encrypted = ?, updated_at = NOW() WHERE setting_key = ?",
        [finalValue, settingType, category, isEncrypted, key]
      );
    } else {
      await query(
        "INSERT INTO system_settings (setting_key, setting_value, setting_type, category, is_encrypted) VALUES (?, ?, ?, ?, ?)",
        [key, finalValue, settingType, category, isEncrypted]
      );
    }
    results[key] = value;
  }

  const allSettings = await getAllSettings();
  return allSettings;
};

module.exports = {
  getAllSettings,
  validateSettings,
  upsertSettings,
};