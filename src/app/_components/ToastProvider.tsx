"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title: string;
  variant?: "success" | "error" | "info";
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, durationMs: 3000, variant: "info", ...t };
    setToasts((cur) => [...cur, toast]);
    const duration = toast.durationMs ?? 3000;
    setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const cls = t.variant === "success"
            ? "border-success-200 bg-success-50 text-success-800"
            : t.variant === "error"
            ? "border-danger-200 bg-danger-50 text-danger-800"
            : "border-secondary-200 bg-white text-secondary-900";
          return (
            <div key={t.id} className={`pointer-events-auto rounded-lg border px-3 py-2 shadow ${cls}`}>
              <div className="text-sm">{t.title}</div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}


