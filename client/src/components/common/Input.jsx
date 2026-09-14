import React from "react";

export const Input = ({
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder = "",
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  autoFocus = false,
  className = "",
  inputRef = null,
  icon = null
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:border-transparent text-base ${
            icon ? "pl-10" : ""
          } ${
            error
              ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
              : "border-slate-300 focus:ring-navy-600 focus:border-navy-600"
          } ${disabled ? "bg-slate-100 cursor-not-allowed text-slate-500" : ""}`}
        />
      </div>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};
