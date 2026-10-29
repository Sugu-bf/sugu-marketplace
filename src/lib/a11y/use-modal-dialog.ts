"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.closest("[inert]") && element.getAttribute("aria-hidden") !== "true",
  );
}

/**
 * Keyboard behaviour of a custom modal overlay (one not built on <dialog>):
 * focus moves into it when it opens (to `initialFocus`, else its first
 * focusable element, else the container), Tab and Shift+Tab stay inside,
 * Escape closes it, and focus returns where it was once it closes.
 *
 * The caller renders the container with role="dialog", aria-modal="true" and
 * an accessible name (aria-label or aria-labelledby), and attaches the ref.
 */
export function useModalDialog<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  initialFocus?: RefObject<HTMLElement | null>,
): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const target = initialFocus?.current ?? focusables(container)[0] ?? container;
    if (target === container && !container.hasAttribute("tabindex")) container.tabIndex = -1;
    target.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, initialFocus]);

  return containerRef;
}
