import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { StatCard } from "../../components/common/StatCard";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Users,
  GraduationCap,
  School,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export const DashboardPage = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  const fetchStats = async () => {
    try {
      let url = `/dashboard/stats?dateFilter=${dateFilter}`;
      if (dateFilter === "custom" && customDate) {
        url += `&customDate=${customDate}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateFilter, customDate]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchStats();
    socket.on("student:registered", handleUpdate);
    socket.on("student:updated", handleUpdate);
    socket.on("student:deleted", handleUpdate);
    socket.on("school:created", handleUpdate);

    return () => {
      socket.off("student:registered", handleUpdate);
      socket.off("student:updated", handleUpdate);
      socket.off("student:deleted", handleUpdate);
      socket.off("school:created", handleUpdate);
    };
  }, [socket, dateFilter, customDate]);

  if (loading && !stats) {
    return <LoadingSpinner label="Loading live dashboard statistics..." />;
  }

  const chartData = stats?.grades?.map((g) => ({
    grade: `Grade ${g.grade}`,
    count: g.count,
    level: g.educationLevel
  })) || [];

  const hourlyData = stats?.hourly?.map((h) => ({
    hour: h._id,
    count: h.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Bar with Two-Day Date Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            Exhibition Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-desk telemetry & visitor analytics
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          {[
            { label: "All Days", value: "all" },
            { label: "Today", value: "today" },
            { label: "Day 1 (Sep 14)", value: "day1" },
            { label: "Day 2 (Sep 15)", value: "day2" },
            { label: "Custom Date", value: "custom" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateFilter === f.value
                  ? "bg-navy-700 text-white shadow-sm shadow-navy-800/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}

          {dateFilter === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Registered Students"
          value={stats?.totalStudents?.toLocaleString() || "0"}
          subtitle="All connected desks"
          icon={<Users className="w-6 h-6" />}
          variant="primary"
        />

        <StatCard
          title="O/L Students (Grades 6–11)"
          value={stats?.olStudents?.toLocaleString() || "0"}
          subtitle={`${stats?.olPercentage || "0.0"}% of total attendance`}
          icon={<GraduationCap className="w-6 h-6" />}
          variant="green"
        />

        <StatCard
          title="A/L Students (Grades 12–13)"
          value={stats?.alStudents?.toLocaleString() || "0"}
          subtitle={`${stats?.alPercentage || "0.0"}% of total attendance`}
          icon={<GraduationCap className="w-6 h-6" />}
          variant="blue"
        />

        <StatCard
          title="Visiting Schools"
          value={stats?.activeSchoolsCount?.toLocaleString() || "0"}
          subtitle={`Out of ${stats?.totalSchoolsCount || 0} registered schools`}
          icon={<School className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Hourly and Grade Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-800">Grade Distribution</h3>
              <p className="text-xs text-slate-500">Student count across Grade 6 through Grade 13</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="inline-block w-3 h-3 rounded-md bg-emerald-500" /> O/L (6-11)
              <span className="inline-block w-3 h-3 rounded-md bg-blue-600 ml-2" /> A/L (12-13)
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} Students`, item.payload.level]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  fill="#1E224F"
                  shape={(props) => {
                    const { fill, x, y, width, height, payload } = props;
                    const color = payload.level === "O/L" ? "#10B981" : "#2563EB";
                    return <rect x={x} y={y} width={width} height={height} rx={6} fill={color} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-800">Hourly Flow</h3>
              <p className="text-xs text-slate-500">
                Peak Time: <strong>{stats?.peakHour || "N/A"}</strong> ({stats?.peakCount || 0} students)
              </p>
            </div>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    formatter={(val) => [`${val} Registrations`, "Volume"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1E224F"
                    strokeWidth={3}
                    dot={{ fill: "#7CB342", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                No hourly registration data available for this filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Schools Table & Operator Desks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Participating Schools (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-navy-800 flex items-center gap-2">
              <School className="w-5 h-5 text-navy-700" />
              Top Visiting Schools
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Showing top {Math.min(stats?.schools?.length || 0, 10)} schools
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3 pl-2">School Name</th>
                  <th className="pb-3 text-center">O/L</th>
                  <th className="pb-3 text-center">A/L</th>
                  <th className="pb-3 text-right pr-2">Total Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.schools?.slice(0, 10).map((s, idx) => (
                  <tr key={s._id || idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 pl-2 font-bold text-slate-800">
                      {idx + 1}. {s.schoolName}
                    </td>
                    <td className="py-3 text-center font-semibold text-emerald-600 bg-emerald-50/50 rounded">
                      {s.ol}
                    </td>
                    <td className="py-3 text-center font-semibold text-blue-600 bg-blue-50/50 rounded">
                      {s.al}
                    </td>
                    <td className="py-3 text-right pr-2 font-extrabold text-navy-800 text-sm">
                      {s.total}
                    </td>
                  </tr>
                ))}
                {(!stats?.schools || stats.schools.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">
                      No school registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desk Operators Performance (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-navy-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-green" />
              Registration Desks
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {stats?.operators?.length || 0} active
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats?.operators?.map((op) => (
              <div
                key={op._id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-navy-900">{op.operatorName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    O/L: <strong className="text-emerald-600">{op.ol}</strong> • A/L: <strong className="text-blue-600">{op.al}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-navy-800">{op.total}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Students</div>
                </div>
              </div>
            ))}
            {(!stats?.operators || stats.operators.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No active desk activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
