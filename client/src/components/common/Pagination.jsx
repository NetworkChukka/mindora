import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, limit }) => {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6 rounded-b-2xl">
      <div className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-800">{start}</span> to{" "}
        <span className="font-semibold text-slate-800">{end}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-700 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
