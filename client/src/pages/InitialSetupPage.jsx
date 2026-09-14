import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { ShieldCheck, User, Lock, ArrowRight } from "lucide-react";

export const InitialSetupPage = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { initialSetup } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password) {
      error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await initialSetup(fullName, username, password, confirmPassword);
      success("Administrator account created successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      error(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 pb-6 text-center border-b border-slate-100">
            <img
              src="/assets/mindora-logo.png"
              alt="MINDORA Logo"
              className="h-16 w-auto mx-auto mb-3 object-contain"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              FIRST-TIME SETUP
            </div>
            <h1 className="text-xl font-black text-navy-800">Create System Administrator</h1>
            <p className="text-xs text-slate-500 mt-1">
              Set up the master admin credentials for the exhibition server.
            </p>
          </div>

          <form onSubmit={handleSetup} className="p-8 space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Dr. Kasun Wickramasinghe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Admin Username"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              icon={<User className="w-4 h-4" />}
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Create Administrator
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
