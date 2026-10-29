/**
 * BFF — guest order token (V5, P1-24).
 *
 * A guest has no session: it proves it owns an order with the
 * `X-Guest-Order-Token` it received when the order was placed. The relay
 * passes it on, or a guest could neither retry nor check its payment.
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { POST } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";
const PAYMENT_URL = new URL(`/api/v1/orders/${ORDER}/payment`, API_BASE_URL).toString();

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path: ["api", "v1", ...path] }) });

describe("BFF guest order token", () => {
  it("passes the guest order token on to Laravel", async () => {
    let seen: string | null = null;
    server.use(
      http.post(PAYMENT_URL, ({ request }) => {
        seen = request.headers.get("x-guest-order-token");
        return HttpResponse.json({ success: false, message: "Commande non payable", error_code: "ORDER_NOT_PAYABLE" }, { status: 409 });
      }),
    );

    await POST(
      new NextRequest("http://localhost:3000/", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "x-guest-order-token": "gt_abc123" },
      }),
      ctx("orders", ORDER, "payment"),
    );

    expect(seen).toBe("gt_abc123");
  });
});
