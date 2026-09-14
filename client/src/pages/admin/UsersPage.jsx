import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Users,
  UserPlus,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  Edit2
} from "lucide-react";

export const UsersPage = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", role: "operator" });
  const [addLoading, setAddLoading] = useState(false);

  // Reset Password Modal
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", role: "operator", status: "active" });
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.password) {
      error("All fields are required");
      return;
    }
    setAddLoading(true);
    try {
      const res = await api.post("/users", form);
      if (res.data.success) {
        success(`User @${form.username} created successfully`);
        setIsAddOpen(false);
        setForm({ fullName: "", username: "", password: "", role: "operator" });
        fetchUsers();
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      error("Password must be at least 6 characters");
      return;
    }
    setResetLoading(true);
    try {
      const res = await api.patch(`/users/${resetUser._id}/password`, { newPassword });
      if (res.data.success) {
        success(`Password updated for @${resetUser.username}`);
        setResetUser(null);
        setNewPassword("");
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put(`/users/${editUser._id}`, editForm);
      if (res.data.success) {
        success(`User @${editUser.username} updated`);
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      error(err.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            User Accounts & Registration Desks
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage admin, desk operators, and viewer accounts
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Create Desk Account
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Registrations</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <LoadingSpinner label="Loading users..." />
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {u.fullName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-800">
                      @{u.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : u.role === "operator"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-navy-800 text-sm">
                      {u.registrationCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditForm({ fullName: u.fullName, role: u.role, status: u.status });
                          }}
                          className="p-1.5 text-slate-400 hover:text-navy-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword("");
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create User / Registration Desk"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name / Desk Title"
            placeholder="e.g. Desk 04 (Kasun)"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            autoFocus
          />

          <Input
            label="Username"
            placeholder="e.g. desk04"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          <Input
            label="Password (min 6 characters)"
            type="password"
            placeholder="Initial password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Account Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
            >
              <option value="operator">Registration Operator (Desk)</option>
              <option value="viewer">Viewer (Dashboard Only)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsAddOpen(false)} disabled={addLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={addLoading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {resetUser && (
        <Modal
          isOpen={true}
          onClose={() => setResetUser(null)}
          title={`Reset Password for @${resetUser.username}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setResetUser(null)} disabled={resetLoading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={resetLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditUser(null)}
          title={`Edit User: @${editUser.username}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              required
              autoFocus
            />

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
              >
                <option value="operator">Registration Operator</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setEditUser(null)} disabled={editLoading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={editLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
