import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { Maximize, Minimize, Users, GraduationCap, School, RefreshCw } from "lucide-react";

export const LiveDisplayPage = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/display");
      if (res.data.success) {
        setStats(res.data.data);
        setLastUpdated(res.data.data.lastUpdated);
      }
    } catch (err) {
      console.error("Display stats error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    // 5-second polling fallback
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Socket sync
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchStats();
    socket.on("student:registered", handleUpdate);
    socket.on("student:updated", handleUpdate);
    socket.on("student:deleted", handleUpdate);
    socket.on("teacher:registered", handleUpdate);
    socket.on("teacher:updated", handleUpdate);
    socket.on("teacher:deleted", handleUpdate);
    socket.on("school:created", handleUpdate);

    return () => {
      socket.off("student:registered", handleUpdate);
      socket.off("student:updated", handleUpdate);
      socket.off("student:deleted", handleUpdate);
      socket.off("teacher:registered", handleUpdate);
      socket.off("teacher:updated", handleUpdate);
      socket.off("teacher:deleted", handleUpdate);
      socket.off("school:created", handleUpdate);
    };
  }, [socket]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white p-6 md:p-12 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl">
          <img
            src="/assets/mindora-logo.png"
            alt="MINDORA Logo"
            className="h-14 md:h-16 w-auto object-contain"
          />
          <div className="pr-2">
            <h1 className="text-xl md:text-2xl font-black text-navy-800 tracking-tight leading-none">
              MINDORA
            </h1>
            <p className="text-xs font-bold text-brand-green uppercase tracking-widest mt-1">
              Microbiology Exhibition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              LIVE EXHIBITION METRICS
            </div>
            <div className="text-xs text-brand-green font-semibold">
              Updated: {lastUpdated || "Live"}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main KPI Stats Display */}
      <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visitors Card */}
        <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-white/15 p-8 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              TOTAL VISITORS
            </span>
            <div className="p-3 bg-brand-green/20 rounded-2xl text-brand-green">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="my-4">
            <div className="text-5xl md:text-6xl font-black tracking-tight text-white font-mono">
              {(stats?.totalVisitors ?? stats?.totalStudents ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Students: {stats?.totalStudents?.toLocaleString() || "0"}
          </div>
        </div>

        {/* Teachers Card */}
        <div className="bg-purple-950/60 border border-purple-500/30 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-purple-300 uppercase">
              TEACHERS
            </span>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
              Staff
            </span>
          </div>
          <div className="my-4">
            <div className="text-5xl md:text-6xl font-black text-purple-400 font-mono">
              {stats?.totalTeachers?.toLocaleString() || "0"}
            </div>
            <div className="text-xs font-semibold text-purple-200 mt-1">
              Visiting Teachers
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-purple-400 h-2 rounded-full transition-all duration-500"
              style={{
                width: stats?.totalVisitors ? `${Math.round(((stats?.totalTeachers || 0) / stats.totalVisitors) * 100)}%` : "0%"
              }}
            />
          </div>
        </div>

        {/* O/L Students */}
        <div className="bg-emerald-950/60 border border-emerald-500/30 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
              O/L STUDENTS
            </span>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg">
              Grades 6–11
            </span>
          </div>
          <div className="my-4">
            <div className="text-5xl md:text-6xl font-black text-emerald-400 font-mono">
              {stats?.olStudents?.toLocaleString() || "0"}
            </div>
            <div className="text-xs font-semibold text-emerald-200 mt-1">
              {stats?.olPercentage || "0.0"}% of students
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats?.olPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* A/L Students */}
        <div className="bg-blue-950/60 border border-blue-500/30 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">
              A/L STUDENTS
            </span>
            <span className="text-xs font-extrabold px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg">
              Grades 12–13
            </span>
          </div>
          <div className="my-4">
            <div className="text-5xl md:text-6xl font-black text-blue-400 font-mono">
              {stats?.alStudents?.toLocaleString() || "0"}
            </div>
            <div className="text-xs font-semibold text-blue-200 mt-1">
              {stats?.alPercentage || "0.0"}% of students
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats?.alPercentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grade Breakdown Cards Bar */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-green" />
            Attendance Breakdown by Grade
          </h3>
          <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <School className="w-4 h-4 text-slate-400" />
            <span>Participating Schools: <strong>{stats?.activeSchoolsCount || 0}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {stats?.grades?.map((g) => (
            <div
              key={g.grade}
              className={`p-3.5 rounded-2xl border text-center transition-transform hover:scale-105 ${
                g.grade >= 12
                  ? "bg-blue-900/30 border-blue-500/30"
                  : "bg-navy-800/40 border-white/10"
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Gr. {g.grade}
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {g.count}
              </div>
              <div className={`text-[10px] font-bold uppercase mt-0.5 ${g.grade >= 12 ? "text-blue-300" : "text-emerald-300"}`}>
                {g.educationLevel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-semibold">
        <div>MINDORA • Official University Microbiology Exhibition Live Board</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-brand-green animate-ping" />
          <span>Offline Central Node</span>
        </div>
      </div>
    </div>
  );
};
