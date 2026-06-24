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
    console.error("Request Body:", JSON.stringify(req.body, null, 2));
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
