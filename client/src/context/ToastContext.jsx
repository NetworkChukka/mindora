import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (msg, dur) => showToast(msg, "success", dur);
  const error = (msg, dur) => showToast(msg, "error", dur);
  const warning = (msg, dur) => showToast(msg, "warning", dur);
  const info = (msg, dur) => showToast(msg, "info", dur);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-600" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 break-words">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
