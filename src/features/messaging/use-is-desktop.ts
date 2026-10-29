"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `lg`: from here on, /messages shows its panels side by side. */
const DESKTOP_QUERY = "(min-width: 1024px)";

function mediaQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DESKTOP_QUERY)
    : null;
}

function subscribe(onChange: () => void): () => void {
  const query = mediaQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

/**
 * Whether /messages is laid out for a desktop. False on the server and
 * before hydration: the page then renders its mobile layout first.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => mediaQuery()?.matches ?? false,
    () => false,
  );
}
