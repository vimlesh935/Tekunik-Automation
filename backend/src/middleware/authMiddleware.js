const env = require("../config/env");
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

const getTokenFromRequest = (req) => {
  // Primary: httpOnly cookie (set on login/register)
  if (req.cookies && req.cookies[env.cookieName]) return req.cookies[env.cookieName];
  // Fallback: Authorization Bearer header (from localStorage via api.js)
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
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

const optionalAuth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return next();

    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      req.user = decoded;
    }
  } catch {
    // Token invalid or expired — continue without setting req.user
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
};