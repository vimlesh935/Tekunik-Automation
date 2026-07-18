const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const stepService = require("../services/smartHomeStepService");

/**
 * POST /api/smart-home/steps
 * Save a step's data. If no sessionId, creates a new session.
 * Body: { sessionId, step (1-5), data: { ... } }
 */
const saveStep = asyncHandler(async (req, res) => {
  const { sessionId, step, data } = req.body;

  if (!step || !data) {
    throw new AppError("step and data are required", 400, "VALIDATION_ERROR");
  }

  const result = await stepService.createOrUpdateStep(sessionId || null, step, data);
  return success(res, "Step saved successfully", result, result.isNew ? 201 : 200);
});

/**
 * GET /api/smart-home/steps/:id
 * Get the current state of a session.
 */
const getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await stepService.getSession(id);
  if (!session) throw new AppError("Session not found", 404, "NOT_FOUND");
  return success(res, "Session retrieved successfully", session);
});

/**
 * POST /api/smart-home/steps/resume
 * Find a draft session by email.
 * Body: { email }
 */
const resumeSession = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required", 400, "VALIDATION_ERROR");
  const session = await stepService.findSessionByEmail(email);
  return success(res, "Session found", session || null);
});

module.exports = {
  saveStep,
  getSession,
  resumeSession,
};