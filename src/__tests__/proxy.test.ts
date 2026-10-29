/**
 * The proxy end to end: a legacy URL is redirected, an App Router path never
 * reaches the backend, the coming-soon wall sends the catalogue home.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import proxy from "@/proxy";
import { __clearSeoRedirectCache } from "@/lib/routing/seo-redirects";

beforeEach(() => __clearSeoRedirectCache());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("proxy", () => {
  it("redirects a legacy URL to the backend's destination", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ match: true, to: "/category/fruits", status_code: 301 })),
    );

    const response = await proxy(new NextRequest("https://sugu.pro/ancienne-categorie?p=2"));

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://sugu.pro/category/fruits?p=2");
  });

  it("serves an App Router path without asking the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const path of ["/", "/product/x", "/payments/success"]) {
      const response = await proxy(new NextRequest(`https://sugu.pro${path}`));
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("walls the catalogue off while coming soon", async () => {
    vi.stubEnv("COMING_SOON_ENABLED", "true");

    const response = await proxy(new NextRequest("https://sugu.pro/product/x"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sugu.pro/");
  });
});
