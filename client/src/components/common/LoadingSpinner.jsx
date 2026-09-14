import React from "react";

export const LoadingSpinner = ({ label = "Loading...", size = "md" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div
        className={`${sizes[size]} border-navy-700 border-t-transparent rounded-full animate-spin`}
      />
      {label && <p className="text-xs font-semibold text-slate-500">{label}</p>}
    </div>
  );
};
