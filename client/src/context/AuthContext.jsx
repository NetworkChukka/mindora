import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mindora_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("mindora_token"));
  const [loading, setLoading] = useState(true);
  const [isSetupCompleted, setIsSetupCompleted] = useState(true);

  // Check setup status and verify user session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check if initial setup is required
        const setupRes = await api.get("/auth/setup-status");
        if (setupRes.data.success) {
          setIsSetupCompleted(setupRes.data.data.isSetupCompleted);
        }

        // 2. Verify token if present
        const savedToken = localStorage.getItem("mindora_token");
        if (savedToken) {
          const res = await api.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem("mindora_user", JSON.stringify(res.data.data));
          }
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem("mindora_token");
        localStorage.removeItem("mindora_user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem("mindora_token", newToken);
      localStorage.setItem("mindora_user", JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const initialSetup = async (fullName, username, password, confirmPassword) => {
    const res = await api.post("/auth/setup", {
      fullName,
      username,
      password,
      confirmPassword
    });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      setToken(newToken);
      setUser(userData);
      setIsSetupCompleted(true);
      localStorage.setItem("mindora_token", newToken);
      localStorage.setItem("mindora_user", JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || "Setup failed");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("mindora_token");
    localStorage.removeItem("mindora_user");
  };

  const isAdmin = user?.role === "admin";
  const isOperator = user?.role === "operator" || user?.role === "admin";
  const isViewer = user?.role === "viewer" || user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSetupCompleted,
        login,
        initialSetup,
        logout,
        isAdmin,
        isOperator,
        isViewer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
