import React from "react";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  type = "button",
  onClick,
  className = "",
  icon = null
}) => {
  const base = "inline-flex items-center justify-center font-semibold transition-all rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-navy-700 hover:bg-navy-800 text-white focus:ring-navy-600 shadow-navy-900/10",
    success: "bg-brand-green hover:bg-brand-greenDark text-white focus:ring-brand-green shadow-green-900/10",
    blue: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 focus:ring-slate-400",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 shadow-none border-0"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
    xl: "px-8 py-4 text-lg gap-3"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
