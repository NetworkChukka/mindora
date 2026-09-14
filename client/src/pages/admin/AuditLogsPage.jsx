import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { History, Search, Filter, ShieldCheck, UserCheck, Activity } from "lucide-react";

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "30",
        search: searchTerm,
        action: actionFilter
      });
      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data.items);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [searchTerm, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-navy-800 tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Immutable log of administrative, operator, and database operations
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search audit descriptions, user names, or registration IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-600 w-full sm:w-60"
        >
          <option value="all">All Actions</option>
          <option value="OPERATOR_REGISTERED_STUDENT">OPERATOR_REGISTERED_STUDENT</option>
          <option value="OPERATOR_CREATED_SCHOOL">OPERATOR_CREATED_SCHOOL</option>
          <option value="ADMIN_EDITED_REGISTRATION">ADMIN_EDITED_REGISTRATION</option>
          <option value="ADMIN_DELETED_REGISTRATION">ADMIN_DELETED_REGISTRATION</option>
          <option value="ADMIN_CREATED_USER">ADMIN_CREATED_USER</option>
          <option value="ADMIN_CREATED_BACKUP">ADMIN_CREATED_BACKUP</option>
          <option value="ADMIN_RESTORED_BACKUP">ADMIN_RESTORED_BACKUP</option>
          <option value="ADMIN_EXPORTED_REPORT">ADMIN_EXPORTED_REPORT</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12">
                    <LoadingSpinner label="Loading audit logs..." />
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-navy-800 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-md break-words">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || "local"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No audit records found.
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
          onPageChange={(p) => fetchLogs(p)}
        />
      </div>
    </div>
  );
};
