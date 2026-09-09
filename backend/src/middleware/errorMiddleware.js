const fs = require("node:fs");
const path = require("node:path");
const { failure } = require("../utils/response");

const logFilePath = path.join(__dirname, "..", "..", "logs", "backend-error.log");

const notFound = (req, res, next) => {
  if (req.path.startsWith("/api") || ["/send-otp", "/verify-otp", "/resend-otp", "/register", "/login", "/dashboard", "/logout"].includes(req.path)) {
    return failure(res, "Route not found", 404, "ROUTE_NOT_FOUND");
  }
  next();
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  // Show actual error message in all cases for debugging
  const message = error.message || (statusCode >= 500 ? "Server error" : "Unknown error");

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${error.message}\nStatus: ${statusCode}\nCode: ${error.code || "SERVER_ERROR"}\nStack: ${error.stack}\n\n`;

  console.error(`[${timestamp}]`, error.message);
  if (statusCode >= 500) {
    console.error("Request URL:", req.method, req.originalUrl);
    // 🔐 Never persist passwords / OTPs in logs: redact sensitive request
    // fields before they reach stdout or the error log.
    const SENSITIVE_FIELDS = new Set([
      "password",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "otp",
      "resetToken",
      "token",
    ]);
    const redact = (value) => {
      if (Array.isArray(value)) return value.map(redact);
      if (value && typeof value === "object") {
        const out = {};
        for (const [key, item] of Object.entries(value)) {
          out[key] = SENSITIVE_FIELDS.has(key) ? "[REDACTED]" : redact(item);
        }
        return out;
      }
      return value;
    };
    console.error("Request Body:", JSON.stringify(redact(req.body), null, 2));
    console.error(error.stack);
  }

  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error("Failed to write to backend-error.log:", err);
  }

  return failure(res, message, statusCode, error.code || "SERVER_ERROR");
};

module.exports = {
  notFound,
  errorHandler,
};
