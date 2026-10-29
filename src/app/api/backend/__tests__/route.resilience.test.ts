/**
 * BFF resilience (audit M9): a bounded request body, a bounded wait on
 * Laravel, and a JSON 502/504 instead of an HTML 500 when Laravel fails.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { POST } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();
afterEach(() => vi.restoreAllMocks());

const APP = "https://sugu.test";
const CART_URL = new URL("/api/v1/cart/items", API_BASE_URL).toString();
const ctx = { params: Promise.resolve({ path: ["api", "v1", "cart", "items"] }) };

function post(body: BodyInit, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${APP}/`, {
    method: "POST",
    headers: { origin: APP, "content-type": "application/json", ...headers },
    body,
  });
}

describe("BFF resilience", () => {
  it("refuses a JSON body above 1 MB before calling Laravel", async () => {
    const upstream = vi.fn(() => HttpResponse.json({}));
    server.use(http.post(CART_URL, upstream));

    const response = await POST(post("x".repeat(1024 * 1024 + 1)), ctx);

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ success: false });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("lets a multipart upload through up to the attachment limit", async () => {
    let received = 0;
    server.use(
      http.post(CART_URL, async ({ request }) => {
        received = (await request.arrayBuffer()).byteLength;
        return HttpResponse.json({ success: true });
      }),
    );

    const body = new Uint8Array(2 * 1024 * 1024);
    const response = await POST(post(body, { "content-type": "multipart/form-data; boundary=x" }), ctx);

    expect(response.status).toBe(200);
    expect(received).toBe(body.byteLength);
  });

  it("answers a JSON 502 when Laravel cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.post(CART_URL, () => HttpResponse.error()));

    const response = await POST(post("{}"), ctx);

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("answers a JSON 504 when Laravel takes too long", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() =>
      AbortSignal.abort(new DOMException("The operation timed out.", "TimeoutError")),
    );
    server.use(http.post(CART_URL, () => HttpResponse.json({ success: true })));

    const response = await POST(post("{}"), ctx);

    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ success: false });
  });
});
