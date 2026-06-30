import { useState, useEffect, useRef, useCallback } from "react";
import { emailValidationService } from "../services/api";

const DEBOUNCE_DELAY = 600; // 600ms debounce
const STANDARD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useEmailValidation(options = {}) {
  const {
    validateOnBlur = true,
    validateOnChange = true,
    debounceMs = DEBOUNCE_DELAY,
    requireValidForSubmit = true,
  } = options;

  const [email, setEmail] = useState("");
  const [validationStatus, setValidationStatus] = useState("idle"); // idle | validating | valid | invalid | error
  const [validationDetails, setValidationDetails] = useState(null);
  const [isFormatValid, setIsFormatValid] = useState(null);

  const debounceTimerRef = useRef(null);
  const lastValidatedEmailRef = useRef("");
  const validationRequestIdRef = useRef(0);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const performValidation = useCallback(
    async (emailValue) => {
      const trimmed = String(emailValue || "").trim();
      const currentRequestId = ++validationRequestIdRef.current;

      if (!trimmed) {
        setValidationStatus("idle");
        setValidationDetails(null);
        setIsFormatValid(null);
        lastValidatedEmailRef.current = "";
        return;
      }

      // Basic format check for instant feedback
      const formatOk = STANDARD_EMAIL_REGEX.test(trimmed.toLowerCase());
      setIsFormatValid(formatOk);
      console.log("[EmailValidation] Email entered by user:", emailValue);
      console.log("[EmailValidation] Email after trim():", trimmed);
      console.log("[EmailValidation] Regex result:", formatOk);

      if (!formatOk) {
        setValidationStatus("invalid");
        setValidationDetails(null);
        lastValidatedEmailRef.current = trimmed;
        console.log("[EmailValidation] Validation result:", false);
        return;
      }

      // Avoid re-validating the same exact email in rapid succession
      if (lastValidatedEmailRef.current === trimmed && validationStatus === "valid") {
        return;
      }

      setValidationStatus("validating");
      setValidationDetails(null);
      lastValidatedEmailRef.current = "";

      try {
        console.log("[EmailValidation] Request payload:", JSON.stringify({ email: trimmed }));
        const response = await emailValidationService.validateEmail(trimmed);
        console.log("[EmailValidation] API request sent for:", trimmed);
        console.log("[EmailValidation] API response:", JSON.stringify(response));

        // Ignore stale responses
        if (currentRequestId !== validationRequestIdRef.current) {
          return;
        }

        const data = response?.data || response;

        const isValid = data?.data?.isValid ?? data?.isValid;
        if (data?.success && isValid) {
          setValidationStatus("valid");
          setValidationDetails(data?.data || data);
          lastValidatedEmailRef.current = trimmed;
          console.log("[EmailValidation] Validation result:", true);
        } else {
          setValidationStatus("invalid");
          setValidationDetails(data);
          lastValidatedEmailRef.current = trimmed;
          console.log("[EmailValidation] Validation result:", false);
        }
      } catch (error) {
        if (currentRequestId !== validationRequestIdRef.current) {
          return;
        }

        console.error("[EmailValidation] API request failed for:", trimmed);
        console.error("[EmailValidation] Error stack:", error.stack);
        console.error("[EmailValidation] Status:", error?.response?.status, error?.response?.statusText);

        // The checkout should not reject a syntactically valid email because
        // the verification endpoint is down or out of quota.
        setValidationStatus(formatOk ? "valid" : "error");
        setValidationDetails(formatOk ? { source: "format-only:request-error" } : null);
        lastValidatedEmailRef.current = trimmed;
        console.log("[EmailValidation] Validation result:", formatOk);
      }
    },
    [validationStatus],
  );

  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  const handleEmailChange = useCallback(
    (value) => {
      setEmail(value);

      if (!validateOnChange) {
        return;
      }

      clearDebounce();

      const trimmed = String(value || "").trim();

      if (!trimmed) {
        setValidationStatus("idle");
        setValidationDetails(null);
        setIsFormatValid(null);
        lastValidatedEmailRef.current = "";
        return;
      }

      // Quick format-only feedback immediately
      const formatOk = STANDARD_EMAIL_REGEX.test(trimmed.toLowerCase());
      setIsFormatValid(formatOk);
      console.log("[EmailValidation] Email entered by user:", value);
      console.log("[EmailValidation] Email after trim():", trimmed);
      console.log("[EmailValidation] Regex result:", formatOk);

      if (!formatOk) {
        setValidationStatus("invalid");
        setValidationDetails(null);
        lastValidatedEmailRef.current = "";
        console.log("[EmailValidation] Validation result:", false);
        return;
      }

      setValidationStatus("idle");
      setValidationDetails(null);
      lastValidatedEmailRef.current = "";

      debounceTimerRef.current = setTimeout(() => {
        performValidation(trimmed);
      }, debounceMs);
    },
    [validateOnChange, debounceMs, performValidation, clearDebounce],
  );

  const handleEmailBlur = useCallback(
    (value) => {
      if (!validateOnBlur) {
        return;
      }

      clearDebounce();
      const trimmed = String(value || "").trim();

      if (!trimmed) {
        return;
      }

      // Validate immediately on blur if format looks ok and we haven't validated yet
      const formatOk = STANDARD_EMAIL_REGEX.test(trimmed.toLowerCase());
      console.log("[EmailValidation] Email entered by user:", value);
      console.log("[EmailValidation] Email after trim():", trimmed);
      console.log("[EmailValidation] Regex result:", formatOk);
      if (formatOk) {
        performValidation(trimmed);
      } else {
        console.log("[EmailValidation] Validation result:", false);
      }
    },
    [validateOnBlur, performValidation, clearDebounce],
  );

  const resetValidation = useCallback(() => {
    clearDebounce();
    setValidationStatus("idle");
    setValidationDetails(null);
    setIsFormatValid(null);
    lastValidatedEmailRef.current = "";
  }, [clearDebounce]);

  const isValid =
    validationStatus === "valid" ||
    (!requireValidForSubmit && validationStatus !== "invalid" && isFormatValid === true);

  const isInvalid =
    validationStatus === "invalid" ||
    isFormatValid === false;

  return {
    email,
    setEmail,
    isValid,
    isInvalid,
    isFormatValid,
    validationStatus,
    validationDetails,
    handleEmailChange,
    handleEmailBlur,
    resetValidation,
  };
}

export default useEmailValidation;
