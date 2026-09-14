import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  CheckCircle,
  Calendar,
  Layers,
  Printer
} from "lucide-react";

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [schoolsList, setSchoolsList] = useState([]);

  const [previewStats, setPreviewStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await api.get("/schools");
        if (res.data.success) setSchoolsList(res.data.data);
      } catch (e) {}
    };
    fetchSchools();
  }, []);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateFilter,
        customDate,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter
      });
      const res = await api.get(`/dashboard/stats?${params.toString()}`);
      if (res.data.success) {
        setPreviewStats(res.data.data);
      }
    } catch (err) {
      console.error("Preview load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [dateFilter, customDate, gradeFilter, levelFilter, schoolFilter]);

  const [exportLoading, setExportLoading] = useState("");

  const handleExport = async (format) => {
    setExportLoading(format);
    try {
      const token = localStorage.getItem("mindora_token");
      const params = new URLSearchParams({
        dateFilter,
        customDate,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter,
        ...(token ? { token } : {})
      });

      const res = await api.get(`/reports/${format}?${params.toString()}`, {
        responseType: "blob"
      });

      const ext = format === "excel" ? "xlsx" : format;
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `MINDORA_${format.toUpperCase()}_Report_${dateFilter}_${dateStr}.${ext}`;

      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export failed:", err);
      // Fallback with token in query
      const token = localStorage.getItem("mindora_token");
      const params = new URLSearchParams({
        dateFilter,
        customDate,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter,
        ...(token ? { token } : {})
      });
      window.open(`/api/reports/${format}?${params.toString()}`, "_blank");
    } finally {
      setExportLoading("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-navy-800 tracking-tight">
          Exhibition Reports & Exports
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Generate official university spreadsheets, CSV data archives, and printable PDF documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filter Controls (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-navy-800 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Filter className="w-4 h-4 text-navy-700" />
            Report Configuration
          </h3>

          {/* Date Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Exhibition Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="all">All Exhibition Days (Combined)</option>
              <option value="today">Today's Data Only</option>
              <option value="day1">Day 1 (14 September 2026)</option>
              <option value="day2">Day 2 (15 September 2026)</option>
              <option value="custom">Custom Specific Date</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Select Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold"
              />
            </div>
          )}

          {/* Education Level Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Education Level
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="">All Levels (O/L & A/L)</option>
              <option value="O/L">O/L Only (Grades 6–11)</option>
              <option value="A/L">A/L Only (Grades 12–13)</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Grade
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="">All Grades</option>
              {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              School
            </label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="">All Schools</option>
              {schoolsList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.schoolName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Report Preview & Export Buttons (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-navy-800 pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
              <span>Report Scope Preview</span>
              {loading && <span className="text-xs text-slate-400">Updating...</span>}
            </h3>

            {previewStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-navy-50 rounded-2xl border border-navy-200 text-center">
                  <div className="text-xs text-navy-700 font-bold uppercase">Total Students</div>
                  <div className="text-3xl font-black text-navy-900 mt-1">{previewStats.totalStudents}</div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-bold uppercase">O/L Students</div>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{previewStats.olStudents}</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <div className="text-xs text-blue-700 font-bold uppercase">A/L Students</div>
                  <div className="text-3xl font-black text-blue-900 mt-1">{previewStats.alStudents}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-600 font-bold uppercase">Schools</div>
                  <div className="text-3xl font-black text-slate-800 mt-1">{previewStats.activeSchoolsCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Export Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Excel Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-400 transition">
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl w-fit mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-navy-800 text-base">Excel Workbook</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  5 formatted worksheets: Registrations, Summary, Schools, Grades, and Desks.
                </p>
              </div>
              <Button
                variant="success"
                onClick={() => handleExport("excel")}
                loading={exportLoading === "excel"}
                className="w-full mt-6"
                icon={<Download className="w-4 h-4" />}
              >
                Download .XLSX
              </Button>
            </div>

            {/* PDF Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-navy-400 transition">
              <div>
                <div className="p-3 bg-navy-50 text-navy-700 rounded-2xl w-fit mb-3">
                  <Printer className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-navy-800 text-base">Official PDF Report</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Printable document with MINDORA header, logo, statistics, and tables.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleExport("pdf")}
                loading={exportLoading === "pdf"}
                className="w-full mt-6"
                icon={<FileText className="w-4 h-4" />}
              >
                Generate .PDF
              </Button>
            </div>

            {/* CSV Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition">
              <div>
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl w-fit mb-3">
                  <Download className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-navy-800 text-base">CSV Data Export</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Raw tabular dataset for statistical software, databases, or external analysis.
                </p>
              </div>
              <Button
                variant="blue"
                onClick={() => handleExport("csv")}
                loading={exportLoading === "csv"}
                className="w-full mt-6"
                icon={<Download className="w-4 h-4" />}
              >
                Export .CSV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
