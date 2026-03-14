"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { queryTrackedOrderRaw, mapApiToTrackedOrder } from "@/features/order";
import type { TrackedOrder, OrderTrackingApiData } from "@/features/order";

/** Terminal statuses — stop polling once reached */
const TERMINAL_STATUSES = new Set(["delivered", "canceled", "returned", "failed"]);

/** Polling intervals (ms) */
const INITIAL_INTERVAL = 10_000;      // 10s
const STABLE_INTERVAL = 20_000;       // 20s after 3 polls without change
const SLOW_INTERVAL = 30_000;         // 30s after 6 polls without change
const ERROR_BACKOFF_BASE = 20_000;    // 20s base on error
const ERROR_BACKOFF_MAX = 60_000;     // 60s max on error

/**
 * Smart polling hook for order tracking.
 *
 * Features:
 * - Starts at 10s, backs off to 20s/30s if no status change
 * - Exponential backoff on errors
 * - Pauses when tab is hidden (document.visibilityState)
 * - Stops after terminal status (delivered/cancelled)
 * - Confirmation: polls 1-2 more times after terminal to confirm
 * - Returns only delta fields to avoid full rerender
 */
export function useOrderPolling(
  orderId: string,
  initialData: TrackedOrder
) {
  const [order, setOrder] = useState<TrackedOrder>(initialData);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollCountRef = useRef(0);
  const stablePollsRef = useRef(0); // polls without status change
  const errorCountRef = useRef(0);
  const lastStatusRef = useRef(initialData.status);
  const terminalConfirmRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isHiddenRef = useRef(false);

  const getInterval = useCallback(() => {
    // Error backoff
    if (errorCountRef.current > 0) {
      return Math.min(
        ERROR_BACKOFF_BASE * Math.pow(2, errorCountRef.current - 1),
        ERROR_BACKOFF_MAX
      );
    }

    // Stability-based backoff
    if (stablePollsRef.current >= 6) return SLOW_INTERVAL;
    if (stablePollsRef.current >= 3) return STABLE_INTERVAL;
    return INITIAL_INTERVAL;
  }, []);

  const poll = useCallback(async () => {
    if (!isMountedRef.current || isHiddenRef.current) return;

    try {
      const rawData = await queryTrackedOrderRaw(orderId);
      const mapped = mapApiToTrackedOrder(rawData);

      if (!isMountedRef.current) return;

      // Track status changes
      if (mapped.status !== lastStatusRef.current) {
        lastStatusRef.current = mapped.status;
        stablePollsRef.current = 0;
      } else {
        stablePollsRef.current++;
      }

      errorCountRef.current = 0;
      pollCountRef.current++;
      setError(null);

      // Update state — only if data differs meaningfully
      setOrder((prev) => {
        if (
          prev.status === mapped.status &&
          prev.timeline.length === mapped.timeline.length &&
          prev.deliveryProgress === mapped.deliveryProgress &&
          prev.driver?.name === mapped.driver?.name &&
          prev.estimatedDate === mapped.estimatedDate
        ) {
          return prev; // No rerender
        }
        return mapped;
      });

      // Check terminal status
      if (TERMINAL_STATUSES.has(rawData.statusCode)) {
        terminalConfirmRef.current++;
        if (terminalConfirmRef.current >= 2) {
          setIsPolling(false);
          return; // Stop polling — confirmed terminal
        }
      }
    } catch (err) {
      errorCountRef.current++;
      if (errorCountRef.current >= 5) {
        setIsPolling(false);
        setError("Impossible de mettre à jour le suivi. Veuillez rafraîchir la page.");
        return;
      }
    }

    // Schedule next poll
    if (isMountedRef.current && !isHiddenRef.current) {
      timerRef.current = setTimeout(poll, getInterval());
    }
  }, [orderId, getInterval]);

  // ─── Visibility change handler ──────────────────────────────

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        isHiddenRef.current = true;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        isHiddenRef.current = false;
        if (isPolling && !timerRef.current) {
          // Resume polling immediately
          timerRef.current = setTimeout(poll, 1_000);
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPolling, poll]);

  // ─── Start polling on mount ─────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    // Don't start polling if already terminal
    if (TERMINAL_STATUSES.has(initialData.status === "cancelled" ? "canceled" : initialData.status)) {
      setIsPolling(false);
      return;
    }

    timerRef.current = setTimeout(poll, INITIAL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [poll, initialData.status]);

  return { order, isPolling, error };
}
