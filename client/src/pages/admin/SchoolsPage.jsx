import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmationModal } from "../../components/common/ConfirmationModal";
import { Pagination } from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  School as SchoolIcon,
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export const SchoolsPage = () => {
  const { socket } = useSocket();
  const { success, error, warning } = useToast();

  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [form, setForm] = useState({ schoolName: "", schoolCode: "", city: "", district: "" });
  const [formLoading, setFormLoading] = useState(false);

  // Import Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchSchools = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: searchTerm,
        status: statusFilter
      });
      const res = await api.get(`/schools?${params.toString()}`);
      if (res.data.success) {
        if (res.data.data.items) {
          setSchools(res.data.data.items);
          setPagination(res.data.data.pagination);
        } else {
          setSchools(res.data.data);
        }
      }
    } catch (err) {
      error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools(1);
  }, [searchTerm, statusFilter]);

  // Real-time Socket Sync
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchSchools(pagination.page);
    socket.on("school:created", handleUpdate);
    socket.on("school:updated", handleUpdate);

    return () => {
      socket.off("school:created", handleUpdate);
      socket.off("school:updated", handleUpdate);
    };
  }, [socket, pagination.page]);

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setForm({ schoolName: "", schoolCode: "", city: "", district: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setForm({
      schoolName: school.schoolName,
      schoolCode: school.schoolCode || "",
      city: school.city || "",
      district: school.district || ""
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.schoolName.trim()) {
      error("School name is required");
      return;
    }
    setFormLoading(true);
    try {
      if (editingSchool) {
        const res = await api.put(`/schools/${editingSchool._id}`, form);
        if (res.data.success) {
          success(`School "${form.schoolName}" updated`);
          setIsModalOpen(false);
          fetchSchools(pagination.page);
        }
      } else {
        const res = await api.post("/schools", form);
        if (res.data.success) {
          success(`School "${form.schoolName}" created`);
          setIsModalOpen(false);
          fetchSchools(1);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to save school");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (school) => {
    try {
      const res = await api.patch(`/schools/${school._id}/status`);
      if (res.data.success) {
        success(res.data.message);
        fetchSchools(pagination.page);
      }
    } catch (err) {
      error("Failed to update status");
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      error("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);
    setImportLoading(true);

    try {
      const res = await api.post("/schools/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        setImportResult(res.data.data);
        success(res.data.message);
        fetchSchools(1);
      }
    } catch (err) {
      error(err.response?.data?.message || "Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            School Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Central repository of participating schools
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setImportResult(null);
              setImportFile(null);
              setIsImportOpen(true);
            }}
            icon={<Upload className="w-4 h-4 text-blue-600" />}
          >
            Import Schools
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New School
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search school by name, city, district, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600 w-full sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="disabled">Disabled Only</option>
        </select>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">School Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <LoadingSpinner label="Fetching schools..." />
                  </td>
                </tr>
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <SchoolIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{school.schoolName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {school.schoolCode || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {school.city || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {school.district || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {school.createdByName || "System"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          school.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                        }`}
                      >
                        {school.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(school)}
                          className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit School"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(school)}
                          className={`p-1.5 rounded-lg transition ${
                            school.status === "active"
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={school.status === "active" ? "Disable School" : "Enable School"}
                        >
                          {school.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => fetchSchools(p)}
        />
      </div>

      {/* Add/Edit School Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? `Edit School: ${editingSchool.schoolName}` : "Add New School"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="School Name"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            placeholder="e.g. Royal College"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Colombo"
            />
            <Input
              label="District"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="e.g. Colombo"
            />
          </div>

          <Input
            label="School Code (Optional)"
            value={form.schoolCode}
            onChange={(e) => setForm({ ...form, schoolCode: e.target.value })}
            placeholder="e.g. RC-01"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={formLoading}>
              {editingSchool ? "Save Changes" : "Create School"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Schools Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Schools from Excel / CSV"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload an Excel (.xlsx) or CSV file with columns: <strong>School Name, School Code, City, District</strong>. Existing schools will be automatically skipped.
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-navy-700 file:text-white hover:file:bg-navy-800"
            />
          </div>

          {importResult && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">Import Summary:</div>
              <div className="text-emerald-700 font-semibold">✓ {importResult.imported} schools added</div>
              <div className="text-slate-500">⚠ {importResult.skipped} duplicate schools skipped</div>
              {importResult.errors?.length > 0 && (
                <div className="text-rose-600">✕ {importResult.errors.length} errors</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsImportOpen(false)} disabled={importLoading}>
              Close
            </Button>
            <Button variant="primary" onClick={handleImportSubmit} loading={importLoading} disabled={!importFile}>
              Start Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
