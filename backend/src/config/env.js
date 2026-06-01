const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "..", "..", ".env");
const legacyEnvPath = path.join(__dirname, "..", "..", "..", ".env");

const loadEnv = () => {
  try {
    require("dotenv").config({
      path: fs.existsSync(envPath) ? envPath : legacyEnvPath,
    });
    return;
  } catch (error) {
    // Fallback keeps the server readable even before npm install finishes.
  }

  const fallbackPath = fs.existsSync(envPath) ? envPath : legacyEnvPath;
  if (!fs.existsSync(fallbackPath)) return;

  fs.readFileSync(fallbackPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = value;
    });
};

loadEnv();

module.exports = {
  port: Number(process.env.PORT || 8787),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change-this-jwt-secret-in-env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  cookieName: process.env.AUTH_COOKIE_NAME || "autotech_token",
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "Technique",
  },
  smtp: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.OTP_FROM || process.env.SMTP_USER || "",
    tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  },
  adminEmail: process.env.ADMIN_EMAIL || "admin@tekunik.com",
  adminSecretKey: process.env.ADMIN_SECRET_KEY || "change-this-secret-key-in-env",
};
