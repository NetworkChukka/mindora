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
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Calendar,
  GraduationCap,
  School as SchoolIcon,
  Phone,
  User,
  X
} from "lucide-react";

export const TeachersPage = () => {
  const { socket } = useSocket();
  const { success, error } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [schoolsList, setSchoolsList] = useState([]);

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    teacherName: "",
    schoolId: "",
    
    phoneNumber: "",
    visitDate: "",
    remarks: ""
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRegistrations = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        search: searchTerm,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter,
        customDate: dateFilter
      });

      const res = await api.get(`/teachers?${params.toString()}`);
      if (res.data.success) {
        setRegistrations(res.data.data.items);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await api.get("/schools");
      if (res.data.success) {
        setSchoolsList(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegistrations(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, gradeFilter, levelFilter, schoolFilter, dateFilter]);

  // Real-time Socket Sync
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchRegistrations(pagination.page);
    socket.on("teacher:registered", handleUpdate);
    socket.on("teacher:updated", handleUpdate);
    socket.on("teacher:deleted", handleUpdate);

    return () => {
      socket.off("teacher:registered", handleUpdate);
      socket.off("teacher:updated", handleUpdate);
      socket.off("teacher:deleted", handleUpdate);
    };
  }, [socket, pagination.page]);

  // Handle Edit Save
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/teachers/${editItem._id}`, editForm);
      if (res.data.success) {
        success(`Registration ${editItem.teacherRegistrationNumber} updated successfully`);
        setEditItem(null);
        fetchRegistrations(pagination.page);
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to update registration");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Soft Delete
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/teachers/${deleteItem._id}`);
      if (res.data.success) {
        success(`Registration ${deleteItem.teacherRegistrationNumber} deleted`);
        setDeleteItem(null);
        fetchRegistrations(pagination.page);
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setDeleteLoading(false);
    }
  };

  const [exportLoading, setExportLoading] = useState("");

  // Export handlers
  const handleExport = async (type) => {
    setExportLoading(type);
    try {
      const token = localStorage.getItem("mindora_token");
      const params = new URLSearchParams({
        search: searchTerm,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter,
        customDate: dateFilter,
        ...(token ? { token } : {})
      });

      const res = await api.get(`/reports/${type}?${params.toString()}`, {
        responseType: "blob"
      });

      const ext = type === "excel" ? "xlsx" : type;
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `MINDORA_Registrations_${dateStr}.${ext}`;

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
      const token = localStorage.getItem("mindora_token");
      const params = new URLSearchParams({
        search: searchTerm,
        grade: gradeFilter,
        educationLevel: levelFilter,
        schoolId: schoolFilter,
        customDate: dateFilter,
        ...(token ? { token } : {})
      });
      window.open(`/api/reports/${type}?${params.toString()}`, "_blank");
    } finally {
      setExportLoading("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            Registrations Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total recorded: <strong>{pagination.total}</strong> teachers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport("excel")}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport("csv")}
            icon={<Download className="w-4 h-4 text-blue-600" />}
          >
            CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport("pdf")}
            icon={<FileText className="w-4 h-4" />}
          >
            Print PDF
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by Teacher Name, MIN ID, school, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grade Filter */}
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
        >
          <option value="">All Grades (6–13)</option>
          {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>

        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
        >
          <option value="">All Levels (O/L & A/L)</option>
          <option value="O/L">O/L Only (Grades 6–11)</option>
          <option value="A/L">A/L Only (Grades 12–13)</option>
        </select>

        {/* School Filter */}
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
        >
          <option value="">All Schools</option>
          {schoolsList.map((s) => (
            <option key={s._id} value={s._id}>
              {s.schoolName}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Registration ID</th>
                <th className="py-3.5 px-4">Teacher Name</th>
                <th className="py-3.5 px-4">School</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Visit Date</th>
                <th className="py-3.5 px-4">Registered By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <LoadingSpinner label="Fetching teacher registrations..." />
                  </td>
                </tr>
              ) : registrations.length > 0 ? (
                registrations.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-800">
                      {item.teacherRegistrationNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.teacherName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.schoolNameSnapshot}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {item.phoneNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.visitDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.registeredByName}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditForm({
                              teacherName: item.teacherName,
                              schoolId: item.schoolId?._id || item.schoolId,
                              grade: item.grade,
                              phoneNumber: item.phoneNumber || "",
                              visitDate: item.visitDate,
                              remarks: item.remarks || ""
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Registration"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                    No registrations found matching the criteria.
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
          onPageChange={(p) => fetchRegistrations(p)}
        />
      </div>

      {/* Edit Registration Modal */}
      {editItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditItem(null)}
          title={`Edit Registration: ${editItem.teacherRegistrationNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Teacher Name"
              value={editForm.teacherName}
              onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
              required
            />

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">School</label>
              <select
                value={editForm.schoolId}
                onChange={(e) => setEditForm({ ...editForm, schoolId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
              >
                {schoolsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.schoolName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Grade</label>
                <select
                  value={editForm.grade}
                  onChange={(e) => setEditForm({ ...editForm, grade: parseInt(e.target.value, 10) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
                >
                  {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => (
                    <option key={g} value={g}>
                      Grade {g} ({g >= 12 ? "A/L" : "O/L"})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Visit Date"
                type="date"
                value={editForm.visitDate}
                onChange={(e) => setEditForm({ ...editForm, visitDate: e.target.value })}
              />
            </div>

            <Input
              label="Phone Number"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              placeholder="e.g. 0771234567"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setEditItem(null)} disabled={editLoading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={editLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Registration"
        message={`Are you sure you want to delete registration ${deleteItem?.teacherRegistrationNumber} for ${deleteItem?.teacherName}? It will be removed from active exhibition statistics.`}
        confirmText="Delete Registration"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
