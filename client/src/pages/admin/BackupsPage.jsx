import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { ConfirmationModal } from "../../components/common/ConfirmationModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  FileCheck2,
  AlertTriangle
} from "lucide-react";

export const BackupsPage = () => {
  const { success, error, warning } = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // Restore Modal State
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get("/backups");
      if (res.data.success) {
        setBackups(res.data.data);
      }
    } catch (err) {
      error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreateLoading(true);
    try {
      const res = await api.post("/backups", { label: "admin_manual" });
      if (res.data.success) {
        success(`✓ Backup created: ${res.data.data.filename}`);
        fetchBackups();
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to create backup");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedBackup) return;
    setRestoreLoading(true);
    try {
      const res = await api.post("/backups/restore", { filename: selectedBackup.filename });
      if (res.data.success) {
        success(`✓ Database restored successfully! Safety backup saved as: ${res.data.data.safetyBackup}`);
        setSelectedBackup(null);
        fetchBackups();
      }
    } catch (err) {
      error(err.response?.data?.message || "Restore failed");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            Database Backups & Recovery
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Local offline collection snapshots stored centrally in <code>/backups/</code>
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleCreateBackup}
          loading={createLoading}
          icon={<Database className="w-4 h-4" />}
        >
          Backup Database Now
        </Button>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-blue-900 text-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Automatic Safety Protection:</strong> Whenever you restore an earlier backup, the system automatically creates an emergency safety backup snapshot first. All data is preserved offline without cloud reliance.
        </div>
      </div>

      {/* Backups List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Backup Filename</th>
                <th className="py-3.5 px-4">Created Date & Time</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Students</th>
                <th className="py-3.5 px-4">Schools</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12">
                    <LoadingSpinner label="Fetching backups..." />
                  </td>
                </tr>
              ) : backups.length > 0 ? (
                backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-800">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <span>{b.filename}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {(b.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {b.counts?.registrations || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {b.counts?.schools || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedBackup(b)}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No database backups found in /backups/. Click "Backup Database Now" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(selectedBackup)}
        onClose={() => setSelectedBackup(null)}
        onConfirm={handleRestoreConfirm}
        title="Restore Database Backup"
        message={`Warning: Restoring "${selectedBackup?.filename}" will replace current database collections with this backup's records (${selectedBackup?.counts?.registrations || 0} student registrations). An automatic pre-restore safety backup will be created first.`}
        confirmText="Confirm & Restore Backup"
        confirmVariant="danger"
        loading={restoreLoading}
      />
    </div>
  );
};
