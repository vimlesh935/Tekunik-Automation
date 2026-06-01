/**
 * Response Normalizer Middleware
 * Ensures all API responses follow a consistent format
 * Format: { success: boolean, data: {}, timestamp: ISO }
 */

const normalizeResponse = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // If response is already wrapped with success flag, return as-is
    if (data && typeof data === "object" && "success" in data) {
      return originalJson.call(this, data);
    }

    // If response is an error object, wrap it properly
    if (data && typeof data === "object" && data.isOperational) {
      return originalJson.call(this, {
        success: false,
        data: null,
        message: data.message || "An error occurred",
        code: data.code || "ERROR",
        timestamp: new Date().toISOString(),
      });
    }

    // Wrap normal successful response with standard format
    return originalJson.call(this, {
      success: true,
      data: data || {},
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

module.exports = normalizeResponse;
