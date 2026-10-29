/**
 * The same-origin guard shared by the session route handlers (BFF CSRF defence).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/server/same-origin";

const APP = "https://sugu.test";

function request(headers: Record<string, string>, url = `${APP}/api/backend/api/v1/cart`): NextRequest {
  return new NextRequest(url, { method: "POST", headers });
}

afterEach(() => vi.unstubAllEnvs());

describe("isSameOriginRequest", () => {
  it("accepts the site's own origin", () => {
    expect(isSameOriginRequest(request({ origin: APP }), { requireOrigin: true })).toBe(true);
  });

  it("refuses a foreign origin, required or not", () => {
    const foreign = request({ origin: "https://evil.test" });
    expect(isSameOriginRequest(foreign, { requireOrigin: true })).toBe(false);
    expect(isSameOriginRequest(foreign, { requireOrigin: false })).toBe(false);
  });

  it("refuses a missing origin only where one is required", () => {
    expect(isSameOriginRequest(request({}), { requireOrigin: true })).toBe(false);
    expect(isSameOriginRequest(request({}), { requireOrigin: false })).toBe(true);
  });

  it("refuses a cross-site fetch whatever its origin", () => {
    const crossSite = request({ origin: APP, "sec-fetch-site": "cross-site" });
    expect(isSameOriginRequest(crossSite, { requireOrigin: true })).toBe(false);
  });

  it("accepts the public app URL and the origin rebuilt behind the proxy", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sugu.pro/");
    const internal = "http://10.0.0.5:3000/api/backend/api/v1/cart";

    expect(isSameOriginRequest(request({ origin: "https://sugu.pro" }, internal), { requireOrigin: true })).toBe(true);
    expect(
      isSameOriginRequest(
        request({ origin: "https://www.sugu.pro", "x-forwarded-host": "www.sugu.pro", "x-forwarded-proto": "https" }, internal),
        { requireOrigin: true },
      ),
    ).toBe(true);
  });

  it("accepts loopback origins against a loopback host outside production only", () => {
    const loopback = request({ origin: "http://127.0.0.1:3000" }, "http://[::1]:3000/api/x");

    vi.stubEnv("NODE_ENV", "development");
    expect(isSameOriginRequest(loopback, { requireOrigin: true })).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isSameOriginRequest(loopback, { requireOrigin: true })).toBe(false);
  });
});
