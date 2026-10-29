/**
 * Payment API — retry of an unpaid order's payment, status behind a ref.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { getPaymentStatus, retryOrderPayment } from "../api/payment.api";

setupMswServer();

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";
const RETRY_URL = `${API_BASE_URL}/api/v1/orders/${ORDER}/payment`;
const STATUS_URL = `${API_BASE_URL}/api/v1/payments/status`;

describe("retryOrderPayment", () => {
  it("posts once, with the guest order token, and returns the payment step", async () => {
    const calls: (string | null)[] = [];
    server.use(
      http.post(RETRY_URL, ({ request }) => {
        calls.push(request.headers.get("x-guest-order-token"));
        return HttpResponse.json({
          success: true,
          data: { order_id: ORDER, payment_url: "https://app.ligdicash.com/x", next_step: "redirect_to_payment" },
        });
      })
    );

    await expect(retryOrderPayment(ORDER, "gt_abc123")).resolves.toEqual({
      order_id: ORDER,
      payment_url: "https://app.ligdicash.com/x",
      next_step: "redirect_to_payment",
    });
    expect(calls).toEqual(["gt_abc123"]);
  });

  it("sends no guest header for a logged-in buyer", async () => {
    let seen: string | null = "unset";
    server.use(
      http.post(RETRY_URL, ({ request }) => {
        seen = request.headers.get("x-guest-order-token");
        return HttpResponse.json({
          success: true,
          data: { order_id: ORDER, payment_url: "https://app.ligdicash.com/x", next_step: "redirect_to_payment" },
        });
      })
    );

    await retryOrderPayment(ORDER, null);

    expect(seen).toBeNull();
  });

  it.each([
    [409, "ORDER_NOT_PAYABLE"],
    [409, "OUT_OF_STOCK"],
    [502, "PAYMENT_INIT_FAILED"],
  ])("surfaces a %i %s with its error code, without retrying", async (status, errorCode) => {
    let calls = 0;
    server.use(
      http.post(RETRY_URL, () => {
        calls++;
        return HttpResponse.json({ success: false, message: "refusé", error_code: errorCode }, { status });
      })
    );

    const error = await retryOrderPayment(ORDER).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).details?.errorCode).toBe(errorCode);
    expect(calls).toBe(1);
  });
});

describe("getPaymentStatus", () => {
  const status = {
    order_id: ORDER,
    order_number: "SU-2026-000010",
    purpose: "checkout",
    status: "succeeded",
    terminal: true,
    amount: 15000,
    currency: "XOF",
  };

  it("passes the provider's ref through verbatim, URL-encoded", async () => {
    const refs: (string | null)[] = [];
    const raw: string[] = [];
    server.use(
      http.get(STATUS_URL, ({ request }) => {
        const url = new URL(request.url);
        refs.push(url.searchParams.get("ref"));
        raw.push(url.search);
        return HttpResponse.json({ success: true, data: status });
      })
    );

    await expect(getPaymentStatus("eyJpdiI6+/x=&a")).resolves.toEqual(status);
    expect(refs).toEqual(["eyJpdiI6+/x=&a"]);
    expect(raw[0]).toBe("?ref=eyJpdiI6%2B%2Fx%3D%26a");
  });

  it.each([401, 404, 429])("surfaces a %i once, without retrying", async (code) => {
    let calls = 0;
    server.use(
      http.get(STATUS_URL, () => {
        calls++;
        return HttpResponse.json({ success: false, message: "refusé" }, { status: code });
      })
    );

    const error = await getPaymentStatus("abc").catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(code);
    expect(calls).toBe(1);
  });
});
