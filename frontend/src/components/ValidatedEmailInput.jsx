import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useEmailValidation } from "../hooks/useEmailValidation";

export default function ValidatedEmailInput({
  label = "Email",
  name,
  value,
  onChange,
  onBlur,
  placeholder = "you@example.com",
  disabled = false,
  required = true,
  className = "",
  style = {},
  showValidationIcon = true,
  validateOnChange = true,
  validateOnBlur = true,
  requireValidForSubmit = true,
}) {
  const {
    isFormatValid,
    isValid,
    isInvalid,
    validationStatus,
    handleEmailChange: hookHandleEmailChange,
    handleEmailBlur: hookHandleEmailBlur,
  } = useEmailValidation({
    validateOnChange,
    validateOnBlur,
    requireValidForSubmit,
  });

  const isLoading = validationStatus === "validating";
  const showError = isInvalid && validationStatus === "invalid";
  const showSuccess = isValid && validationStatus === "valid";

  const handleChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(e);
    hookHandleEmailChange(val);
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);
    hookHandleEmailBlur(e.target.value);
  };

  const statusIcon = (() => {
    if (!showValidationIcon) return null;
    if (isLoading) {
      return (
        <span className="email-validation-icon-loading">
          <Loader2 size={16} className="animate-spin text-indigo-400" />
        </span>
      );
    }
    if (showSuccess) {
      return (
        <span className="email-validation-icon-success">
          <CheckCircle size={16} className="text-emerald-400" />
        </span>
      );
    }
    if (showError) {
      return (
        <span className="email-validation-icon-error">
          <AlertTriangle size={16} className="text-rose-400" />
        </span>
      );
    }
    return null;
  })();

  return (
    <div className={`validated-email-input-wrapper ${className}`} style={style}>
      {label && (
        <label
          style={{
            display: "block",
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: showError ? "#F87171" : showSuccess ? "#34D399" : "#64748B",
            marginBottom: 6,
          }}
        >
          {label}{required ? " *" : ""}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type="email"
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 42px 14px 14px",
            background: showError ? "rgba(248,113,113,0.06)" : showSuccess ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${showError ? "rgba(248,113,113,0.45)" : showSuccess ? "rgba(52,211,153,0.45)" : "#1E2640"}`,
            borderRadius: 12,
            color: "#E2E8F0",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            outline: "none",
            transition: "all 0.25s ease",
          }}
        />
        {statusIcon && (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {statusIcon}
          </span>
        )}
      </div>
    </div>
  );
}
