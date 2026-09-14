import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Activity,
  Server,
  Database,
  Wifi,
  Cpu,
  Clock,
  HardDrive,
  RefreshCw
} from "lucide-react";

export const SystemStatusPage = () => {
  const { isConnected } = useSocket();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/system/status");
      if (res.data.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return <LoadingSpinner label="Fetching system diagnostics..." />;
  }

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-navy-800 tracking-tight">
            System & Network Diagnostics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time telemetry of host laptop, MongoDB instance, and local LAN
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
          title="Refresh Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* App Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>APPLICATION NODE</span>
            <Server className="w-4 h-4 text-navy-700" />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xl font-black text-slate-900">ONLINE</span>
          </div>
          <div className="text-xs text-slate-500">Node {status?.application?.nodeVersion} • {status?.application?.platform}</div>
        </div>

        {/* Database Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>MONGODB DATABASE</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${status?.database?.status === "connected" ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className="text-xl font-black text-slate-900 uppercase">
              {status?.database?.status}
            </span>
          </div>
          <div className="text-xs text-slate-500">Host: {status?.database?.host} ({status?.database?.name})</div>
        </div>

        {/* Real-time Socket */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>SOCKET.IO REAL-TIME</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-xl font-black text-slate-900">
              {isConnected ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>
          <div className="text-xs text-slate-500">Desk Telemetry Active</div>
        </div>

        {/* Server Uptime */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>SERVER UPTIME</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {formatUptime(status?.application?.uptimeSeconds || 0)}
          </div>
          <div className="text-xs text-slate-500">RAM: {status?.application?.memoryUsageMB} MB</div>
        </div>
      </div>

      {/* Network Interface Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-800 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Wifi className="w-5 h-5 text-navy-700" />
          Local Network (LAN) Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-bold uppercase">PRIMARY LAN ACCESS URL</div>
            <div className="font-mono text-base font-extrabold text-navy-800 mt-1 select-all">
              http://{status?.network?.primaryIP}:{status?.network?.port}
            </div>
            <div className="text-xs text-slate-400 mt-1">Registration Desks connect via this IP</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-bold uppercase">LATEST DATABASE BACKUP</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">
              {status?.backup?.lastBackup ? new Date(status.backup.lastBackup).toLocaleString() : "No backups yet"}
            </div>
            <div className="text-xs text-slate-400 mt-1">{status?.backup?.totalBackups || 0} total snapshots saved</div>
          </div>
        </div>
      </div>
    </div>
  );
};
