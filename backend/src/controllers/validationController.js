const emailValidationService = require("../services/emailValidationService");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

/**
 * POST /api/validation/email
 * Validates an email address using Abstract Email Validation API
 * Body: { email: string }
 */
const validateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  console.log("[Validation] Backend received email:", email);

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required", 400, "VALIDATION_ERROR");
  }

  // Sanitize email
  const sanitizedEmail = String(email).trim().toLowerCase();
  console.log("[Validation] Email after trim():", String(email).trim());
  console.log("[Validation] Email after trim()+lowercase:", sanitizedEmail);

  // Perform validation
  const result = await emailValidationService.validateEmail(sanitizedEmail);
  console.log("[Validation] Final validation result:", JSON.stringify(result));

  return success(res, "Email validation completed", result);
});

/**
 * GET /api/validation/email/format
 * Quick local email format validation (no API call)
 * Query: ?email=user@example.com
 */
const validateEmailFormat = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    throw new AppError("Email is required", 400, "VALIDATION_ERROR");
  }

  const result = emailValidationService.validateEmailFormatOnly(email);

  return success(res, "Email format validation completed", result);
});

/**
 * POST /api/validation/email/batch
 * Validates multiple email addresses
 * Body: { emails: string[] }
 */
const validateEmailsBatch = asyncHandler(async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    throw new AppError("Emails array is required", 400, "VALIDATION_ERROR");
  }

  if (emails.length > 10) {
    throw new AppError("Cannot validate more than 10 emails at once", 400, "VALIDATION_ERROR");
  }

  const results = await Promise.all(
    emails.map(async (email) => {
      const sanitizedEmail = String(email || "").trim().toLowerCase();
      const result = await emailValidationService.validateEmail(sanitizedEmail);
      return {
        email: sanitizedEmail,
        ...result,
      };
    })
  );

  return success(res, "Batch email validation completed", { results });
});

module.exports = {
  validateEmail,
  validateEmailFormat,
  validateEmailsBatch,
};
