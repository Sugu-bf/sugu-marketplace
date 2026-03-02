"use client";

/**
 * Toast Store — lightweight global toast system using Zustand.
 * 
 * No external dependencies. Supports success, error, info, warning.
 * Auto-dismiss after configurable duration.
 * 
 * Usage:
 *   import { useToast } from "@/features/toast/toast-store";
 *   const { success, error } = useToast();
 *   success("Ajouté au panier !");
 */

import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Optional action button */
  action?: { label: string; href: string };
  /** Duration in ms before auto-dismiss. 0 = manual. */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  /** Shorthand helpers */
  success: (message: string, opts?: Partial<Pick<Toast, "action" | "duration">>) => string;
  error: (message: string, opts?: Partial<Pick<Toast, "action" | "duration">>) => string;
  info: (message: string, opts?: Partial<Pick<Toast, "action" | "duration">>) => string;
  warning: (message: string, opts?: Partial<Pick<Toast, "action" | "duration">>) => string;
}

let counter = 0;
function uid(): string {
  return `toast-${++counter}-${Date.now()}`;
}

const DEFAULT_DURATION = 4000;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],

  add: (toast) => {
    const id = uid();
    set((s) => ({
      toasts: [...s.toasts.slice(-4), { ...toast, id }], // Keep max 5
    }));

    // Auto-dismiss
    if (toast.duration !== 0) {
      setTimeout(() => get().remove(id), toast.duration || DEFAULT_DURATION);
    }

    return id;
  },

  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  success: (message, opts) =>
    get().add({ type: "success", message, duration: DEFAULT_DURATION, ...opts }),

  error: (message, opts) =>
    get().add({ type: "error", message, duration: 6000, ...opts }),

  info: (message, opts) =>
    get().add({ type: "info", message, duration: DEFAULT_DURATION, ...opts }),

  warning: (message, opts) =>
    get().add({ type: "warning", message, duration: 5000, ...opts }),
}));
