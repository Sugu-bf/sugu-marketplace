"use client";

/**
 * Opens the live support chat from elsewhere on the page — the « Contacter
 * le support » of an order, for one. <SupportChatWidget /> reads here
 * whether it is open, and says it is mounted: openSupportChat() answers
 * false on a page without the widget, so the caller can go to /support-chat
 * instead of offering a button that does nothing.
 */
import { create } from "zustand";

const ULID = /^[0-9A-Za-z]{26}$/;

export interface SupportChatContext {
  /** Subject the start form offers. */
  subject?: string;
  /** The buyer's order the chat is about: sent as `order_id` when it starts. */
  orderId?: string;
}

interface SupportChatLauncherState {
  isOpen: boolean;
  /** Subject the start form offers, from the page that opened the chat. */
  suggestedSubject: string | null;
  /** Order a chat started now is about, from the page that opened it. */
  suggestedOrderId: string | null;
  /** How many widgets are mounted (one per page). */
  widgets: number;
  open: (context?: SupportChatContext) => void;
  close: () => void;
  toggle: () => void;
  /** Called by the widget when it mounts; the returned function when it goes. */
  register: () => () => void;
}

export const useSupportChatLauncher = create<SupportChatLauncherState>((set) => ({
  isOpen: false,
  suggestedSubject: null,
  suggestedOrderId: null,
  widgets: 0,
  open: (context) =>
    set({
      isOpen: true,
      suggestedSubject: context?.subject?.trim() || null,
      suggestedOrderId: context?.orderId && ULID.test(context.orderId) ? context.orderId : null,
    }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  register: () => {
    set((state) => ({ widgets: state.widgets + 1 }));
    return () =>
      set((state) => {
        const widgets = Math.max(0, state.widgets - 1);
        // The last widget gone, nothing of this page's chat is kept.
        return widgets === 0
          ? { widgets, isOpen: false, suggestedSubject: null, suggestedOrderId: null }
          : { widgets };
      });
  },
}));

/**
 * Open the support chat widget of the page, with what the page knows.
 * Returns false when the page has no widget: nothing was opened.
 */
export function openSupportChat(context?: SupportChatContext): boolean {
  const state = useSupportChatLauncher.getState();
  if (state.widgets === 0) return false;
  state.open(context);
  return true;
}
