const env = require("../config/env");
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

const getTokenFromRequest = (req) => {
  // 🛡️ User auth MUST come from the httpOnly cookie only.
  // The Authorization header is NOT accepted for regular user auth
  // because it persists across tabs after logout (via localStorage).
  // Admin auth uses its own separate middleware with Authorization header.
  if (req.cookies && req.cookies[env.cookieName]) return req.cookies[env.cookieName];
  return null;
};

const requireAuth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) throw new AppError("Authentication required", 401, "AUTH_REQUIRED");

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    next(new AppError("Invalid or expired session", 401, "INVALID_SESSION"));
  }
};

const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Admin authentication required", 401, "ADMIN_AUTH_REQUIRED");
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
    }
    if (decoded.role !== "admin") {
      throw new AppError("Admin access required", 403, "ADMIN_FORBIDDEN");
    }
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }
    next(new AppError("Invalid or expired admin session", 401, "INVALID_ADMIN_SESSION"));
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};