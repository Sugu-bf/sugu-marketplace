"use client";

/**
 * ToastContainer — renders global toast notifications.
 *
 * Mount this ONCE in the root layout (inside body).
 * Beautiful, animated, stacked from bottom-right.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast, type Toast, type ToastType } from "./toast-store";

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="flex-shrink-0" />,
  error: <AlertCircle size={18} className="flex-shrink-0" />,
  info: <Info size={18} className="flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="flex-shrink-0" />,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
};

function ToastItem({ toast }: { toast: Toast }) {
  const { remove } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => remove(toast.id), 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-sm min-w-[300px] max-w-[420px]",
        COLOR_MAP[toast.type],
        "transition-all duration-300 ease-out",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0"
      )}
    >
      {ICON_MAP[toast.type]}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      {toast.action && (
        <Link
          href={toast.action.href}
          onClick={handleDismiss}
          className="flex-shrink-0 text-xs font-bold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
        >
          {toast.action.label}
        </Link>
      )}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fermer la notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-auto"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
