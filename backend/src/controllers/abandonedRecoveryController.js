const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const recoveryService = require("../services/abandonedRecoveryService");

/**
 * GET /api/admin/recovery/summary
 * Dashboard cards + analytics (from real DB data).
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await recoveryService.getSummary();
  return success(res, "Recovery summary fetched", summary);
});

/**
 * GET /api/admin/recovery
 * Searchable / filterable / paginated recovery records.
 */
const list = asyncHandler(async (req, res) => {
  const { page, limit, status, search, activityType, from, to } = req.query;
  const result = await recoveryService.listRecords({
    page,
    limit,
    status,
    search,
    activityType,
    from,
    to,
  });
  return success(res, "Recovery records fetched", result);
});

/**
 * GET /api/admin/recovery/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await recoveryService.getRecoverySettings();
  return success(res, "Recovery settings fetched", settings);
});

/**
 * PUT /api/admin/recovery/settings
 * Admin can configure reminder timing/window/toggles. Never touches the user's
 * actual order/cart/payment data.
 */
const updateSettings = asyncHandler(async (req, res) => {
  const { enabled, thresholdMinutes, firstReminderHours, secondReminderHours, maxReminders, recoveryWindowHours, stopRemindersOnRecovery } = req.body || {};

  const numberFields = { thresholdMinutes, firstReminderHours, secondReminderHours, maxReminders, recoveryWindowHours };
  for (const [key, value] of Object.entries(numberFields)) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || n > 24 * 60) {
      throw new AppError(`${key} must be a positive number`, 400, "VALIDATION_ERROR");
    }
  }
  if (enabled !== undefined && typeof enabled !== "boolean") {
    throw new AppError("enabled must be a boolean", 400, "VALIDATION_ERROR");
  }
  if (stopRemindersOnRecovery !== undefined && typeof stopRemindersOnRecovery !== "boolean") {
    throw new AppError("stopRemindersOnRecovery must be a boolean", 400, "VALIDATION_ERROR");
  }

  const settings = await recoveryService.saveRecoverySettings({
    enabled,
    thresholdMinutes,
    firstReminderHours,
    secondReminderHours,
    maxReminders,
    recoveryWindowHours,
    stopRemindersOnRecovery,
  });
  return success(res, "Recovery settings updated", settings);
});

/**
 * GET /api/admin/recovery/:id
 * Full record detail + reminder history.
 */
const detail = asyncHandler(async (req, res) => {
  const record = await recoveryService.getRecordDetail(req.params.id);
  if (!record) throw new AppError("Recovery record not found", 404, "NOT_FOUND");
  return success(res, "Recovery record fetched", record);
});

/**
 * POST /api/admin/recovery/:id/send-reminder
 * Admin-triggered reminder. The service re-checks the latest DB state before
 * sending (recovery may have happened in the meantime), and the emailKey +
 * INSERT IGNORE guard against duplicate sends under double-clicks.
 */
const sendReminder = asyncHandler(async (req, res) => {
  const result = await recoveryService.sendManualReminder({ recordId: req.params.id });
  if (!result.sent) {
    const status = result.error === "RECORD_NOT_FOUND" ? 404 : 409;
    throw new AppError(result.message, status, result.error);
  }
  return success(res, result.message, result);
});

module.exports = {
  getSummary,
  list,
  getSettings,
  updateSettings,
  detail,
  sendReminder,
};