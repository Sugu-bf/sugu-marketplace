/**
 * Payment API — retry of an unpaid order's payment.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { retryOrderPayment } from "../api/payment.api";

setupMswServer();

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";
const RETRY_URL = `${API_BASE_URL}/api/v1/orders/${ORDER}/payment`;

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
    expect((error as ApiError).details?.error_code).toBe(errorCode);
    expect(calls).toBe(1);
  });
});
