const env = require("../config/env");
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

/**
 * Middleware: Requires a valid admin JWT (Bearer token in Authorization header).
 * The token must have role === 'admin'.
 * Used on all /api/admin/* protected routes.
 */
const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Admin authentication required", 401, "ADMIN_AUTH_REQUIRED");
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (payload.role !== "admin") {
      throw new AppError("Admin access required", 403, "ADMIN_FORBIDDEN");
    }

    req.admin = payload;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired admin session", 401, "INVALID_ADMIN_SESSION"));
  }
};

module.exports = { requireAdmin };
