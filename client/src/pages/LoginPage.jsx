import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { User, Lock, ArrowRight, QrCode, Tv } from "lucide-react";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isSetupCompleted } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error("Please enter your username and password");
      return;
    }

    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      success(`Welcome back, ${user.fullName}!`);
      if (user.role === "admin" || user.role === "viewer") {
        navigate("/admin/dashboard");
      } else {
        navigate("/register");
      }
    } catch (err) {
      error(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          {/* Brand Header */}
          <div className="p-8 pb-6 text-center border-b border-slate-100">
            <div className="inline-flex justify-center mb-4">
              <img
                src="/assets/mindora-logo.png"
                alt="MINDORA Logo"
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-2xl font-black text-navy-800 tracking-tight">MINDORA</h1>
            <p className="text-xs font-bold text-brand-green uppercase tracking-widest mt-0.5">
              Microbiology Exhibition
            </p>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Offline Registration & Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <Input
              label="Username / Registration Desk"
              placeholder="e.g. desk01, desk02, admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              icon={<User className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your desk password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to System
              </Button>
            </div>

            {!isSetupCompleted && (
              <div className="pt-2 text-center">
                <Link
                  to="/setup"
                  className="text-xs font-bold text-brand-blue hover:underline"
                >
                  First-time setup? Create Administrator Account
                </Link>
              </div>
            )}
          </form>
        </div>

        {/* Quick Links Footer */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-semibold">
          <Link to="/connect" className="flex items-center gap-1.5 hover:text-navy-700 transition">
            <QrCode className="w-4 h-4" />
            <span>Connect Phones (QR)</span>
          </Link>
          <span>•</span>
          <Link to="/display" className="flex items-center gap-1.5 hover:text-navy-700 transition">
            <Tv className="w-4 h-4" />
            <span>Live Display</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
