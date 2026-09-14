import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConnectionBanner } from "../components/common/ConnectionBanner";
import { LogOut, UserCheck, QrCode } from "lucide-react";

export const OperatorLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ConnectionBanner />

      {/* Top Desk Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/mindora-logo.png" alt="MINDORA Logo" className="h-9 w-auto object-contain" />
            <div>
              <div className="font-extrabold text-sm md:text-base text-navy-800 leading-tight">MINDORA</div>
              <div className="text-[10px] md:text-xs font-bold text-brand-green tracking-wider uppercase">
                Microbiology Exhibition
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Operator Desk Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-50 border border-navy-200 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-navy-700" />
              <span className="font-bold text-navy-800">{user?.fullName || user?.username}</span>
            </div>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center px-3 py-1.5 bg-navy-700 text-white rounded-xl text-xs font-semibold hover:bg-navy-800 transition"
              >
                Admin Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};
