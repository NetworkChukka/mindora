import React from "react";

export const Select = ({
  label,
  value,
  onChange,
  options = [],
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  className = ""
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 transition focus:outline-none focus:ring-2 focus:border-transparent text-base ${
          error
            ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
            : "border-slate-300 focus:ring-navy-600 focus:border-navy-600"
        } ${disabled ? "bg-slate-100 cursor-not-allowed text-slate-500" : ""}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};
