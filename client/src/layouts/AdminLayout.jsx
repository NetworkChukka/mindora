import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConnectionBanner } from "../components/common/ConnectionBanner";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  School,
  BarChart3,
  FileSpreadsheet,
  History,
  Database,
  Settings,
  Activity,
  QrCode,
  Tv,
  LogOut,
  Menu,
  X,
  ChevronRight
} from "lucide-react";

export const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Register Student", path: "/register", icon: <UserPlus className="w-5 h-5 text-brand-green" /> },
    { label: "Registrations", path: "/admin/registrations", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Schools", path: "/admin/schools", icon: <School className="w-5 h-5" /> },
    ...(isAdmin ? [{ label: "Users & Desks", path: "/admin/users", icon: <Users className="w-5 h-5" /> }] : []),
    { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Reports & Exports", path: "/admin/reports", icon: <FileSpreadsheet className="w-5 h-5" /> },
    ...(isAdmin ? [
      { label: "Audit Logs", path: "/admin/audit-logs", icon: <History className="w-5 h-5" /> },
      { label: "Backups", path: "/admin/backups", icon: <Database className="w-5 h-5" /> },
      { label: "Event Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
      { label: "System Status", path: "/admin/system-status", icon: <Activity className="w-5 h-5" /> }
    ] : []),
    { label: "Connect / QR", path: "/connect", icon: <QrCode className="w-5 h-5" /> },
    { label: "Live Display (TV)", path: "/display", icon: <Tv className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ConnectionBanner />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-navy-700 text-white border-r border-navy-800 flex-shrink-0">
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-white">
            <img src="/assets/mindora-logo.png" alt="MINDORA Logo" className="h-10 w-auto object-contain" />
            <div>
              <div className="font-extrabold text-sm tracking-tight text-navy-800">MINDORA</div>
              <div className="text-[10px] font-bold text-brand-green tracking-wider uppercase">
                Microbiology Exhibition
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-white/70" />}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout Footer */}
          <div className="p-4 border-t border-white/10 bg-navy-800/60">
            <div className="flex items-center justify-between">
              <div className="truncate mr-2">
                <div className="text-xs font-bold text-white truncate">{user?.fullName || user?.username}</div>
                <div className="text-[10px] text-brand-green uppercase font-semibold tracking-wider">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header & Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between lg:hidden shadow-sm">
            <div className="flex items-center gap-2.5">
              <img src="/assets/mindora-logo.png" alt="MINDORA Logo" className="h-8 w-auto" />
              <div className="font-extrabold text-sm text-navy-800">MINDORA</div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </header>

          {/* Mobile Dropdown Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-navy-700 text-white p-4 space-y-1 shadow-2xl border-b border-navy-800 animate-in slide-in-from-top-5 duration-150">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      active ? "bg-brand-green text-white" : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300">{user?.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}

          {/* Main Page Area */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
