const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success, failure } = require("../utils/response");
const systemSettingsService = require("../services/systemSettingsService");

/**
 * GET /api/admin/settings
 * Load all system settings (shows defaults if none exist)
 */
const index = asyncHandler(async (req, res) => {
  const data = await systemSettingsService.getAllSettings();
  return success(res, "Settings retrieved successfully", data);
});

/**
 * POST /api/admin/settings
 * Create the first settings record (only used if none exists)
 */
const store = asyncHandler(async (req, res) => {
  const settings = req.body.settings || req.body;
  if (!settings || typeof settings !== "object") {
    throw new AppError("Settings object is required", 400, "VALIDATION_ERROR");
  }
  const result = await systemSettingsService.upsertSettings(settings);
  return success(res, "Settings created successfully", result);
});

/**
 * PUT /api/admin/settings
 * Update existing settings, or create if none exist
 */
const update = asyncHandler(async (req, res) => {
  const settings = req.body.settings || req.body;
  if (!settings || typeof settings !== "object") {
    throw new AppError("Settings object is required", 400, "VALIDATION_ERROR");
  }
  const result = await systemSettingsService.upsertSettings(settings);
  return success(res, "Settings updated successfully", result);
});

module.exports = {
  index,
  store,
  update,
};