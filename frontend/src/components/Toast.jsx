import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const toastVariants = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-300",
    iconColor: "text-emerald-400",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-300",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-300",
    iconColor: "text-amber-400",
  },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const variant = toastVariants[toast.type] || toastVariants.success;
          const Icon = variant.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-slide-down ${variant.bg} border rounded-2xl px-5 py-4 min-w-[300px] max-w-[420px] shadow-2xl shadow-black/40 flex items-start gap-3 backdrop-blur-xl`}
            >
              <Icon size={20} className={`${variant.iconColor} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm flex-1 ${variant.text}`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-500 hover:text-gray-300 transition flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}