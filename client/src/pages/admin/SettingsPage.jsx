import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Settings,
  Calendar,
  Save,
  CheckSquare,
  Square,
  Sparkles,
  Shield,
  Layers
} from "lucide-react";

export const SettingsPage = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [form, setForm] = useState({
    eventName: "MINDORA",
    subtitle: "MICROBIOLOGY EXHIBITION",
    eventDay1Date: "2026-09-14",
    eventDay2Date: "2026-09-15",
    activeEventDate: "2026-09-14",
    venue: "Faculty of Science, University",
    registrationPrefix: "MIN",
    duplicateDetection: true,
    eventDayMode: false
  });

  // End-of-event checklist state
  const [checklist, setChecklist] = useState({
    exportExcel: false,
    exportPDF: false,
    exportCSV: false,
    backupMongo: false,
    copyUSB: false,
    verifyCount: false,
    stopServer: false
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings");
      if (res.data.success) {
        setForm(res.data.data);
      }
    } catch (err) {
      error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await api.put("/settings", form);
      if (res.data.success) {
        success("Event settings updated successfully");
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <LoadingSpinner label="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-navy-800 tracking-tight">
          Event Settings & Configurations
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure exhibition branding, dates, registration parameters, and checklist
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form (2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-navy-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-navy-700" />
            Core Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Name"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              required
            />
            <Input
              label="Event Subtitle"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Day 1 Date"
              type="date"
              value={form.eventDay1Date}
              onChange={(e) => setForm({ ...form, eventDay1Date: e.target.value })}
              required
            />
            <Input
              label="Day 2 Date"
              type="date"
              value={form.eventDay2Date}
              onChange={(e) => setForm({ ...form, eventDay2Date: e.target.value })}
              required
            />
            <Input
              label="Active Visit Date"
              type="date"
              value={form.activeEventDate}
              onChange={(e) => setForm({ ...form, activeEventDate: e.target.value })}
              helperText="Default date for registrations"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Exhibition Venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
            <Input
              label="Registration ID Prefix"
              value={form.registrationPrefix}
              onChange={(e) => setForm({ ...form, registrationPrefix: e.target.value })}
              placeholder="e.g. MIN"
              helperText="Prefix for sequential IDs (MIN-000001)"
              required
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={form.duplicateDetection}
                onChange={(e) => setForm({ ...form, duplicateDetection: e.target.checked })}
                className="w-4 h-4 text-navy-700 rounded focus:ring-navy-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Duplicate Student Detection</div>
                <div className="text-[11px] text-slate-500">Warns operators if same student & school register twice</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={form.eventDayMode}
                onChange={(e) => setForm({ ...form, eventDayMode: e.target.checked })}
                className="w-4 h-4 text-navy-700 rounded focus:ring-navy-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Event Day High-Speed Mode</div>
                <div className="text-[11px] text-slate-500">Streamlines UI controls for maximum registration throughput</div>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={saveLoading}
              icon={<Save className="w-4 h-4" />}
            >
              Save Event Settings
            </Button>
          </div>
        </form>

        {/* End of Event Checklist (1 col) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-navy-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-green" />
            End-of-Event Checklist
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Follow this step-by-step checklist when concluding the two-day exhibition:
          </p>

          <div className="space-y-2.5">
            {[
              { id: "exportExcel", label: "Export Full Excel Workbook (.xlsx)" },
              { id: "exportPDF", label: "Generate Official Summary PDF" },
              { id: "exportCSV", label: "Export CSV Data Archive" },
              { id: "backupMongo", label: "Run Database Backup Now" },
              { id: "copyUSB", label: "Copy Backup File to External USB Drive" },
              { id: "verifyCount", label: "Verify Final Visitor & School Counts" },
              { id: "stopServer", label: "Stop MINDORA Server Safely" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklist(item.id)}
                className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition ${
                  checklist[item.id]
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 line-through opacity-80"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {checklist[item.id] ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
