import React from "react";

export const StatCard = ({
  title,
  value,
  subtitle = "",
  icon = null,
  trend = "",
  variant = "default",
  className = ""
}) => {
  const variantStyles = {
    default: "bg-white border-slate-200 text-slate-900",
    primary: "bg-navy-700 border-navy-800 text-white",
    green: "bg-emerald-50 border-emerald-200 text-emerald-950",
    blue: "bg-blue-50 border-blue-200 text-blue-950",
    amber: "bg-amber-50 border-amber-200 text-amber-950"
  };

  const iconStyles = {
    default: "bg-slate-100 text-navy-700",
    primary: "bg-white/10 text-brand-green",
    green: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600"
  };

  const isDark = variant === "primary";

  return (
    <div
      className={`relative p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            {title}
          </p>
          <h4 className={`text-3xl font-extrabold mt-2 tracking-tight ${isDark ? "text-white" : "text-navy-800"}`}>
            {value}
          </h4>
          {subtitle && (
            <p className={`text-xs mt-1.5 font-medium ${isDark ? "text-brand-green" : "text-slate-600"}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl flex-shrink-0 ${iconStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-3 pt-3 border-t text-xs font-semibold ${isDark ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-500"}`}>
          {trend}
        </div>
      )}
    </div>
  );
};
