// @vitest-environment jsdom
/**
 * usePaymentStatus — polls the status behind the provider's `ref` every 3 s,
 * stops on a final status, a refused ref or after 2 minutes, and on unmount.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ApiError } from "@/lib/api/errors";
import type { PaymentStatus } from "../api/payment.schemas";

const { getPaymentStatus } = vi.hoisted(() => ({ getPaymentStatus: vi.fn() }));
vi.mock("../api/payment.api", () => ({ getPaymentStatus }));

import {
  PAYMENT_STATUS_POLL_INTERVAL_MS,
  PAYMENT_STATUS_POLL_TIMEOUT_MS,
  usePaymentStatus,
} from "../hooks/usePaymentStatus";

const REF = "eyJpdiI6IjEyMyJ9+/=";

function payment(status: PaymentStatus["status"]): PaymentStatus {
  return {
    order_id: "01jkqz3m5baxnp9c7hd2fewyr4",
    order_number: "SU-2026-000010",
    purpose: "checkout",
    status,
    terminal: status !== "processing",
    amount: 15000,
    currency: "XOF",
  };
}

const apiError = (status: number) =>
  new ApiError({ status, code: status === 401 ? "UNAUTHORIZED" : "NOT_FOUND", message: "x" });

/** Let the pending poll settle, then move the clock. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  getPaymentStatus.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePaymentStatus", () => {
  it("does not poll without a ref", async () => {
    const { result } = renderHook(() => usePaymentStatus(null));

    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 3);

    expect(result.current).toEqual({ kind: "missing_ref" });
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });

  it("checks while processing and stops on success", async () => {
    getPaymentStatus
      .mockResolvedValueOnce(payment("processing"))
      .mockResolvedValueOnce(payment("processing"))
      .mockResolvedValueOnce(payment("succeeded"));

    const { result } = renderHook(() => usePaymentStatus(REF));
    expect(result.current).toEqual({ kind: "checking", payment: null });

    await advance(0);
    expect(result.current).toEqual({ kind: "checking", payment: payment("processing") });

    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 2);
    expect(result.current).toEqual({ kind: "succeeded", payment: payment("succeeded") });

    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 5);
    expect(getPaymentStatus).toHaveBeenCalledTimes(3);
    expect(getPaymentStatus).toHaveBeenCalledWith(REF);
  });

  it.each(["failed", "under_review"] as const)("stops on %s", async (status) => {
    getPaymentStatus.mockResolvedValue(payment(status));

    const { result } = renderHook(() => usePaymentStatus(REF));
    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 3);

    expect(result.current).toEqual({ kind: status, payment: payment(status) });
    expect(getPaymentStatus).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "unauthorized"],
    [404, "not_found"],
  ] as const)("stops on a %i (%s)", async (status, kind) => {
    getPaymentStatus.mockRejectedValue(apiError(status));

    const { result } = renderHook(() => usePaymentStatus(REF));
    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 3);

    expect(result.current).toEqual({ kind });
    expect(getPaymentStatus).toHaveBeenCalledTimes(1);
  });

  it("keeps polling through transient failures", async () => {
    getPaymentStatus
      .mockRejectedValueOnce(new ApiError({ status: 429, code: "RATE_LIMITED", message: "x" }))
      .mockRejectedValueOnce(new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }))
      .mockResolvedValueOnce(payment("succeeded"));

    const { result } = renderHook(() => usePaymentStatus(REF));
    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 2);

    expect(result.current.kind).toBe("succeeded");
  });

  it("gives up after two minutes of processing", async () => {
    getPaymentStatus.mockResolvedValue(payment("processing"));

    const { result } = renderHook(() => usePaymentStatus(REF));
    await advance(PAYMENT_STATUS_POLL_TIMEOUT_MS);

    expect(result.current).toEqual({ kind: "timed_out", payment: payment("processing") });
    const calls = getPaymentStatus.mock.calls.length;
    // One check at t=0, then one every 3 s up to the 2-minute mark.
    expect(calls).toBe(PAYMENT_STATUS_POLL_TIMEOUT_MS / PAYMENT_STATUS_POLL_INTERVAL_MS + 1);

    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 5);
    expect(getPaymentStatus).toHaveBeenCalledTimes(calls);
  });

  it("stops polling on unmount", async () => {
    getPaymentStatus.mockResolvedValue(payment("processing"));

    const { unmount } = renderHook(() => usePaymentStatus(REF));
    await advance(0);
    unmount();
    await advance(PAYMENT_STATUS_POLL_INTERVAL_MS * 5);

    expect(getPaymentStatus).toHaveBeenCalledTimes(1);
  });
});
