import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";

// Layouts
import { AdminLayout } from "./layouts/AdminLayout";
import { OperatorLayout } from "./layouts/OperatorLayout";

// Public Pages
import { LoginPage } from "./pages/LoginPage";
import { InitialSetupPage } from "./pages/InitialSetupPage";
import { ConnectPage } from "./pages/ConnectPage";
import { LiveDisplayPage } from "./pages/LiveDisplayPage";

// Operator & Shared
import { RegisterPage } from "./pages/RegisterPage";

// Admin Pages
import { DashboardPage } from "./pages/admin/DashboardPage";
import { RegistrationsPage } from "./pages/admin/RegistrationsPage";
import { TeachersPage } from "./pages/admin/TeachersPage";
import { SchoolsPage } from "./pages/admin/SchoolsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { AuditLogsPage } from "./pages/admin/AuditLogsPage";
import { BackupsPage } from "./pages/admin/BackupsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { SystemStatusPage } from "./pages/admin/SystemStatusPage";
import { LoadingSpinner } from "./components/common/LoadingSpinner";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isSetupCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isSetupCompleted) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "admin" && user.role !== "admin") {
    return <Navigate to="/register" replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, loading, isSetupCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Starting MINDORA..." />
      </div>
    );
  }

  if (!isSetupCompleted) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin" || user.role === "viewer") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/register" replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={<InitialSetupPage />} />
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/display" element={<LiveDisplayPage />} />

              {/* Operator Quick Registration Route */}
              <Route
                path="/register"
                element={
                  <ProtectedRoute>
                    <OperatorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RegisterPage />} />
              </Route>

              {/* Admin Portal Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="viewer">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="registrations" element={<RegistrationsPage />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="schools" element={<SchoolsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="backups" element={<BackupsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="system-status" element={<SystemStatusPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
