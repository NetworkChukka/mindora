import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, Check, ChevronDown, School as SchoolIcon, X } from "lucide-react";

export const SchoolSelect = ({
  schools = [],
  selectedSchoolId,
  onChange,
  onOpenAddModal,
  error = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedSchool = schools.find((s) => s._id === selectedSchoolId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter active schools based on search
  const filteredSchools = schools
    .filter((s) => s.status !== "disabled")
    .filter((s) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.schoolName.toLowerCase().includes(term) ||
        (s.city && s.city.toLowerCase().includes(term)) ||
        (s.district && s.district.toLowerCase().includes(term)) ||
        (s.schoolCode && s.schoolCode.toLowerCase().includes(term))
      );
    });

  const handleSelect = (school) => {
    onChange(school._id, school);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
        <span>
          School <span className="text-rose-500">*</span>
        </span>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-bold text-navy-700 hover:text-navy-900 flex items-center gap-1 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Missing School
        </button>
      </label>

      {/* Main Select Button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-left transition focus:outline-none focus:ring-2 ${
          error
            ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
            : "border-slate-300 focus:ring-navy-600 focus:border-navy-600"
        } ${disabled ? "bg-slate-100 cursor-not-allowed text-slate-400" : ""}`}
      >
        <div className="flex items-center gap-3 truncate">
          <SchoolIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
          {selectedSchool ? (
            <span className="font-semibold text-slate-900 truncate">
              {selectedSchool.schoolName}
              {selectedSchool.city && (
                <span className="text-xs font-normal text-slate-500 ml-2">
                  ({selectedSchool.city})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">Search and select school...</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search school by name or city..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* School list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => {
                const isSelected = school._id === selectedSchoolId;
                return (
                  <button
                    key={school._id}
                    type="button"
                    onClick={() => handleSelect(school)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition hover:bg-navy-50/50 ${
                      isSelected ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-800"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{school.schoolName}</div>
                      {(school.city || school.district) && (
                        <div className="text-xs text-slate-500">
                          {[school.city, school.district].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-navy-700 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500 font-medium">No schools matching "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddModal();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-navy-700 rounded-xl hover:bg-navy-800 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add "{searchTerm}" as New School
                </button>
              </div>
            )}
          </div>

          {/* Quick Add School Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddModal();
              }}
              className="text-xs font-bold text-navy-700 hover:text-navy-900 flex items-center gap-1 p-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Missing School
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
