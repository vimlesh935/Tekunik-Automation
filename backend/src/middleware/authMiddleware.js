const env = require("../config/env");
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies[env.cookieName]) return req.cookies[env.cookieName];

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
};

const requireAuth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) throw new AppError("Authentication required", 401, "AUTH_REQUIRED");

    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(new AppError("Invalid or expired session", 401, "INVALID_SESSION"));
  }
};

const requireAdmin = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) throw new AppError("Authentication required", 401, "AUTH_REQUIRED");

    const decoded = verifyToken(token);
    if (decoded.role !== "admin") {
      throw new AppError("Admin access required", 403, "ADMIN_FORBIDDEN");
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired session", 401, "INVALID_SESSION"));
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};
