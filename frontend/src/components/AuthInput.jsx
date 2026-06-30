import React, { useState, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  showPasswordToggle = false,
  autoComplete,
  disabled = false,
  className = "",
  as = "input",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle ? (showPassword ? "text" : "password") : type;
  const paddingClasses = `${Icon ? "pl-12" : "pl-4"} ${showPasswordToggle ? "pr-12" : "pr-4"}`;

  const handlePasswordToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  const handleClick = (e) => {
    if (isPassword && showPasswordToggle) {
      handlePasswordToggle(e);
    }
  };

  const baseInputClasses = `input-field ${paddingClasses}`;

  const textareaClasses = "input-field pl-12 pr-4";

  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className={`absolute left-4 ${as === "textarea" ? "top-3.5" : "top-1/2 -translate-y-1/2"} text-slate-500 transition-colors duration-300 pointer-events-none`}>
            {Icon}
          </div>
        )}
        {as === "textarea" ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={textareaClasses}
            {...props}
          />
        ) : (
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            className={baseInputClasses}
            {...props}
          />
        )}
        {showPasswordToggle && as !== "textarea" && (
          <button
            type="button"
            onClick={handlePasswordToggle}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-300 z-10 flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-800/60 cursor-pointer"
          >
            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
