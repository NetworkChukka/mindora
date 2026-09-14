import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { StatCard } from "../../components/common/StatCard";
import {
  BarChart3,
  Calendar,
  GraduationCap,
  School,
  Activity,
  Users,
  Clock,
  ArrowUpDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [twoDay, setTwoDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [schoolSortField, setSchoolSortField] = useState("total");
  const [schoolSortAsc, setSchoolSortAsc] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/dashboard/stats?dateFilter=${dateFilter}`;
      if (dateFilter === "custom" && customDate) {
        url += `&customDate=${customDate}`;
      }
      const [statsRes, twoDayRes] = await Promise.all([
        api.get(url),
        api.get("/dashboard/two-day")
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (twoDayRes.data.success) setTwoDay(twoDayRes.data.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, customDate]);

  if (loading && !stats) {
    return <LoadingSpinner label="Compiling analytics..." />;
  }

  const pieData = [
    { name: "O/L Students (6-11)", value: stats?.olStudents || 0, color: "#10B981" },
    { name: "A/L Students (12-13)", value: stats?.alStudents || 0, color: "#2563EB" }
  ];

  const sortedSchools = [...(stats?.schools || [])].sort((a, b) => {
    const mult = schoolSortAsc ? 1 : -1;
    return (a[schoolSortField] - b[schoolSortField]) * mult;
  });

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            Advanced Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Statistical breakdown of visitors, schools, grades, and desks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "All Days", value: "all" },
            { label: "Day 1 (Sep 14)", value: "day1" },
            { label: "Day 2 (Sep 15)", value: "day2" },
            { label: "Custom Date", value: "custom" }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateFilter === f.value
                  ? "bg-navy-700 text-white shadow-sm"
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
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white"
            />
          )}
        </div>
      </div>

      {/* Two-Day Exhibition Comparison Cards */}
      {twoDay && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-navy-800 to-navy-900 text-white p-5 rounded-3xl border border-navy-700 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase pb-2 border-b border-white/10">
              <span>DAY 1 SUMMARY</span>
              <span>{twoDay.day1.date}</span>
            </div>
            <div className="mt-3 text-3xl font-black">{twoDay.day1.totalStudents} Students</div>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <div>O/L: <strong className="text-emerald-400">{twoDay.day1.olStudents}</strong> • A/L: <strong className="text-blue-400">{twoDay.day1.alStudents}</strong></div>
              <div>Participating Schools: <strong>{twoDay.day1.schoolsCount}</strong></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-3xl border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase pb-2 border-b border-white/10">
              <span>DAY 2 SUMMARY</span>
              <span>{twoDay.day2.date}</span>
            </div>
            <div className="mt-3 text-3xl font-black">{twoDay.day2.totalStudents} Students</div>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
              <div>O/L: <strong className="text-emerald-400">{twoDay.day2.olStudents}</strong> • A/L: <strong className="text-blue-400">{twoDay.day2.alStudents}</strong></div>
              <div>Participating Schools: <strong>{twoDay.day2.schoolsCount}</strong></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 rounded-3xl border border-emerald-700 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-bold uppercase pb-2 border-b border-white/10">
              <span>COMBINED 2-DAY TOTAL</span>
              <span>Exhibition Final</span>
            </div>
            <div className="mt-3 text-3xl font-black">{twoDay.combined.totalStudents} Students</div>
            <div className="mt-2 text-xs text-emerald-200 space-y-1">
              <div>Total O/L: <strong>{twoDay.combined.olStudents}</strong> • Total A/L: <strong>{twoDay.combined.alStudents}</strong></div>
              <div>Total Unique Schools: <strong>{twoDay.combined.schoolsCount}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Distribution & Level Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Breakdown Detailed Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-navy-800 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-navy-700" />
            Complete Grade Breakdown (6–13)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats?.grades?.map((g) => {
              const pct = stats.totalStudents > 0 ? ((g.count / stats.totalStudents) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={g.grade}
                  className={`p-4 rounded-2xl border text-center ${
                    g.grade >= 12
                      ? "bg-blue-50/60 border-blue-200"
                      : "bg-emerald-50/60 border-emerald-200"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    Grade {g.grade}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {g.count}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                    {pct}% of visitors
                  </div>
                  <div
                    className={`mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                      g.grade >= 12 ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {g.educationLevel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Education Level Ratio Pie Chart (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-navy-800 mb-2">
            O/L vs A/L Distribution
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t text-xs text-slate-500 text-center font-medium">
            O/L: {stats?.olPercentage}% • A/L: {stats?.alPercentage}%
          </div>
        </div>
      </div>

      {/* School Analytics Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-navy-800 flex items-center gap-2">
              <School className="w-5 h-5 text-navy-700" />
              School Analytics Table
            </h3>
            <p className="text-xs text-slate-500">
              Sort by Total, O/L, or A/L students to identify top visiting schools
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold uppercase">Sort by:</span>
            {["total", "ol", "al"].map((field) => (
              <button
                key={field}
                onClick={() => {
                  if (schoolSortField === field) {
                    setSchoolSortAsc(!schoolSortAsc);
                  } else {
                    setSchoolSortField(field);
                    setSchoolSortAsc(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase transition flex items-center gap-1 ${
                  schoolSortField === field
                    ? "bg-navy-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{field}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">School Name</th>
                <th className="py-3 px-4 text-center">O/L Students</th>
                <th className="py-3 px-4 text-center">A/L Students</th>
                <th className="py-3 px-4 text-right pr-4">Total Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSchools.map((s, idx) => (
                <tr key={s._id || idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{s.schoolName}</td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600 bg-emerald-50/40 rounded">
                    {s.ol}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600 bg-blue-50/40 rounded">
                    {s.al}
                  </td>
                  <td className="py-3 px-4 text-right pr-4 font-black text-navy-800 text-sm">
                    {s.total}
                  </td>
                </tr>
              ))}
              {sortedSchools.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No school statistics recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
