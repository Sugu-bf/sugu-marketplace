"use client";

import { useEffect, useState } from "react";
import { isApiError } from "@/lib/api/errors";
import { getPaymentStatus } from "../api/payment.api";
import type { PaymentStatus } from "../api/payment.schemas";

export const PAYMENT_STATUS_POLL_INTERVAL_MS = 3_000;
export const PAYMENT_STATUS_POLL_TIMEOUT_MS = 120_000;

export type PaymentStatusState =
  /** No `ref` in the URL: nothing to check. */
  | { kind: "missing_ref" }
  /** Waiting for the first answer, or the payment is still processing. */
  | { kind: "checking"; payment: PaymentStatus | null }
  | { kind: "succeeded" | "failed" | "under_review"; payment: PaymentStatus }
  /** Still processing when polling gave up. */
  | { kind: "timed_out"; payment: PaymentStatus | null }
  /** The order belongs to a registered buyer who is not logged in. */
  | { kind: "unauthorized" }
  /** Unknown ref, or not the buyer's order. */
  | { kind: "not_found" };

/**
 * State of a payment once the provider sent the buyer back, by its `ref`.
 *
 * Polls every 3 s until the payment reaches a final status, the API refuses
 * the ref (401/404), or 2 minutes have passed. Transient failures (network,
 * 429, 5xx) only skip a beat. Polling stops on unmount. Mount it with
 * `key={ref}` so another ref starts from a clean state.
 */
export function usePaymentStatus(ref: string | null): PaymentStatusState {
  const [state, setState] = useState<PaymentStatusState>(() =>
    ref ? { kind: "checking", payment: null } : { kind: "missing_ref" }
  );

  useEffect(() => {
    if (!ref) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last: PaymentStatus | null = null;
    const deadline = Date.now() + PAYMENT_STATUS_POLL_TIMEOUT_MS;

    const poll = async () => {
      try {
        const payment = await getPaymentStatus(ref);
        if (cancelled) return;
        last = payment;
        if (payment.status !== "processing") {
          setState({ kind: payment.status, payment });
          return;
        }
        setState({ kind: "checking", payment });
      } catch (error) {
        if (cancelled) return;
        if (isApiError(error) && error.status === 401) {
          setState({ kind: "unauthorized" });
          return;
        }
        if (isApiError(error) && (error.status === 404 || error.status === 422)) {
          setState({ kind: "not_found" });
          return;
        }
      }

      if (Date.now() + PAYMENT_STATUS_POLL_INTERVAL_MS > deadline) {
        setState({ kind: "timed_out", payment: last });
        return;
      }
      timer = setTimeout(poll, PAYMENT_STATUS_POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ref]);

  return state;
}
