const axios = require("axios");

/**
 * Abstract Email Validation API Service
 * Validates email deliverability, detects disposable emails, and provides quality scores
 */

// In-memory cache for validation results (per session)
const validationCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const ABSTRACT_EMAIL_API_URL = "https://emailvalidation.abstractapi.com/v1/";
const STANDARD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format locally
 */
const isValidEmailFormat = (email) => {
  return STANDARD_EMAIL_REGEX.test(email);
};

/**
 * Sanitizes email input
 */
const sanitizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const readApiValue = (field) => {
  if (field && typeof field === "object" && Object.prototype.hasOwnProperty.call(field, "value")) {
    return field.value;
  }
  return field;
};

const toBoolean = (field) => {
  const value = readApiValue(field);
  if (typeof value === "boolean") return value;
  return String(value || "").trim().toLowerCase() === "true";
};

const maskApiKey = (apiKey) => {
  if (!apiKey) return "not set";
  if (apiKey === "your-abstract-email-api-key-here") return "placeholder";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)} (length ${apiKey.length})`;
};

const getQuotaHeaders = (headers = {}) => ({
  limit: headers["x-ratelimit-limit"] || headers["x-rate-limit-limit"] || headers["ratelimit-limit"],
  remaining: headers["x-ratelimit-remaining"] || headers["x-rate-limit-remaining"] || headers["ratelimit-remaining"],
  reset: headers["x-ratelimit-reset"] || headers["x-rate-limit-reset"] || headers["ratelimit-reset"],
});

const formatOnlyResult = (email, reason = "format-only") => {
  const formatValid = isValidEmailFormat(email);
  return {
    isValid: formatValid,
    deliverability: formatValid ? "UNKNOWN" : "INVALID_FORMAT",
    isDisposable: false,
    qualityScore: 0,
    isFreeEmail: false,
    isRoleEmail: false,
    source: reason,
    message: formatValid
      ? "Email format is valid."
      : "Please enter a valid email address.",
  };
};

/**
 * Calls Abstract Email Validation API
 */
const validateEmailWithAPI = async (email) => {
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
  console.log("[EmailValidation] API key status:", maskApiKey(apiKey));
  console.log("[EmailValidation] Request URL:", ABSTRACT_EMAIL_API_URL);
  console.log("[EmailValidation] Request payload:", JSON.stringify({ email }));

  if (!apiKey || apiKey === "your-abstract-email-api-key-here") {
    console.log("[EmailValidation] No valid API key configured. Falling back to format-only validation.");
    return formatOnlyResult(email, "format-only:no-api-key");
  }

  try {
    const response = await axios.get(ABSTRACT_EMAIL_API_URL, {
      params: {
        api_key: apiKey,
        email: email,
      },
      timeout: 10000, // 10 second timeout
    });

    const data = response.data;
    const formatValid = toBoolean(data.is_valid_format);
    const localFormatValid = isValidEmailFormat(email);
    const deliverability = String(data.deliverability || "UNKNOWN").toUpperCase();
    const finalFormatValid = formatValid || localFormatValid;

    console.log("[EmailValidation] HTTP response:", response.status, response.statusText);
    console.log("[EmailValidation] Quota headers:", JSON.stringify(getQuotaHeaders(response.headers)));
    console.log(
      "[EmailValidation] API parsed result:",
      JSON.stringify({
        email,
        localFormatValid,
        apiFormatValid: formatValid,
        deliverability,
      }),
    );

    return {
      isValid: finalFormatValid && deliverability !== "UNDELIVERABLE",
      deliverability,
      isDisposable: toBoolean(data.is_disposable_email),
      qualityScore: parseFloat(data.quality_score) || 0,
      isFreeEmail: toBoolean(data.is_free_email),
      isRoleEmail: toBoolean(data.is_role_email),
      source: "abstract-api",
      message: getValidationMessage(data, finalFormatValid, deliverability),
    };
  } catch (error) {
    console.error("[EmailValidation] API Error:", error.message);
    if (error.response) {
      console.error("[EmailValidation] HTTP response:", error.response.status, error.response.statusText);
      console.error("[EmailValidation] Quota headers:", JSON.stringify(getQuotaHeaders(error.response.headers)));
      console.error("[EmailValidation] API response body:", JSON.stringify(error.response.data));
    }
    console.error("[EmailValidation] Falling back to format-only validation due to API error.");
    return formatOnlyResult(email, "format-only:api-error");
  }
};

/**
 * Generates appropriate message based on validation result
 */
const getValidationMessage = (data, formatValid = toBoolean(data.is_valid_format), deliverability = data.deliverability) => {
  if (!formatValid) {
    return "Please enter a valid email address.";
  }

  if (deliverability === "UNDELIVERABLE") {
    return "This email address does not exist or cannot receive emails.";
  }

  if (toBoolean(data.is_disposable_email)) {
    return "Disposable email addresses are not allowed. Please use a permanent email.";
  }

  if (deliverability === "DELIVERABLE") {
    return "Email verified successfully.";
  }

  if (deliverability === "RISKY") {
    return "This email may have delivery issues. Please use a different email.";
  }

  return "Unable to verify email. Please try again.";
};

/**
 * Cached email validation to avoid repeated API calls
 */
const getCachedValidation = (email) => {
  const cached = validationCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  if (cached) {
    validationCache.delete(email);
  }
  return null;
};

const setCachedValidation = (email, result) => {
  validationCache.set(email, {
    result,
    timestamp: Date.now(),
  });

  // Clean up old cache entries (keep only last 100)
  if (validationCache.size > 100) {
    const oldestKey = validationCache.keys().next().value;
    validationCache.delete(oldestKey);
  }
};

/**
 * Main validation function with caching, format check, and API call
 */
const validateEmail = async (email) => {
  const sanitizedEmail = sanitizeEmail(email);
  console.log("[EmailValidation] Email entered by user:", email);
  console.log("[EmailValidation] Email after trim():", String(email || "").trim());
  console.log("[EmailValidation] Email after trim()+lowercase:", sanitizedEmail);
  console.log("[EmailValidation] Regex result:", isValidEmailFormat(sanitizedEmail));

  // Check cache first
  const cachedResult = getCachedValidation(sanitizedEmail);
  if (cachedResult) {
    console.log("[EmailValidation] Final validation result:", JSON.stringify(cachedResult));
    return cachedResult;
  }

  // Initial format validation
  if (!sanitizedEmail) {
    const result = {
      success: false,
      isValid: false,
      deliverability: "UNKNOWN",
      isDisposable: false,
      qualityScore: 0,
      message: "Email is required.",
    };
    console.log("[EmailValidation] Final validation result:", JSON.stringify(result));
    return result;
  }

  if (!isValidEmailFormat(sanitizedEmail)) {
    const result = {
      success: false,
      isValid: false,
      deliverability: "UNKNOWN",
      isDisposable: false,
      qualityScore: 0,
      message: "Please enter a valid email address.",
    };
    console.log("[EmailValidation] Final validation result:", JSON.stringify(result));
    return result;
  }

  // Call API
  try {
    const apiResult = await validateEmailWithAPI(sanitizedEmail);

    const result = {
      success: true,
      isValid: apiResult.isValid,
      deliverability: apiResult.deliverability,
      isDisposable: apiResult.isDisposable,
      qualityScore: apiResult.qualityScore,
      source: apiResult.source,
      message: apiResult.message,
    };

    // Cache the result
    setCachedValidation(sanitizedEmail, result);

    console.log("[EmailValidation] Final validation result:", JSON.stringify(result));
    return result;
  } catch (error) {
    const fallback = formatOnlyResult(sanitizedEmail, "format-only:unexpected-error");
    const result = {
      success: fallback.isValid,
      isValid: fallback.isValid,
      deliverability: fallback.deliverability,
      isDisposable: fallback.isDisposable,
      qualityScore: fallback.qualityScore,
      source: fallback.source,
      message: fallback.message,
    };
    console.error("[EmailValidation] Unexpected validation error:", error.message);
    console.log("[EmailValidation] Final validation result:", JSON.stringify(result));
    return result;
  }
};

/**
 * Quick local format validation (no API call)
 */
const validateEmailFormatOnly = (email) => {
  const sanitizedEmail = sanitizeEmail(email);

  if (!sanitizedEmail) {
    return {
      success: false,
      isValid: false,
      message: "Email is required.",
    };
  }

  if (!isValidEmailFormat(sanitizedEmail)) {
    return {
      success: false,
      isValid: false,
      message: "Please enter a valid email address.",
    };
  }

  return {
    success: true,
    isValid: true,
    message: "Email format is valid.",
  };
};

/**
 * Clear validation cache (useful for testing)
 */
const clearCache = () => {
  validationCache.clear();
};

module.exports = {
  validateEmail,
  validateEmailFormatOnly,
  isValidEmailFormat,
  clearCache,
};
