import { useSyncExternalStore } from "react";

/**
 * Client-only values read without hydration mismatches.
 *
 * The server (and an ISR page cached for minutes) cannot know the visitor's
 * clock or session. Reading Date.now() or a cookie while rendering gave the
 * server and the browser two different first renders. These hooks answer
 * the server value during hydration, then the client value.
 */

const noopSubscribe = () => () => {};

/** false on the server and during hydration, true once on the client. */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// ─── Shared one-second clock ─────────────────────────────────

const clockListeners = new Set<() => void>();
let clockNow = typeof window === "undefined" ? 0 : Date.now();
let clockTimer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (clockTimer === undefined) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer !== undefined) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

/**
 * Current time in ms, ticking every second and shared by every countdown of
 * the page; null on the server and during hydration.
 */
export function useSecondClock(): number | null {
  return useSyncExternalStore<number | null>(
    subscribeClock,
    () => clockNow,
    () => null,
  );
}
