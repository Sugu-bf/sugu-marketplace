/**
 * BFF ETag forwarding — Lot 1.
 *
 * Verifies the two surgical allow-list additions in route.ts:
 *   - `if-none-match` is forwarded from the client to the upstream (request).
 *   - `etag` is exposed from the upstream back to the client (response).
 *   - a 304 upstream status is passed through with an empty body.
 *
 * The route handler `fetch`es API_BASE_URL directly; MSW intercepts that
 * upstream call. Env is `node` (this is a route handler, not a component).
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { GET } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();

const UPSTREAM_URL = new URL("/api/v1/mobile/favorites/ids", API_BASE_URL).toString();

function bffRequest(headers?: Record<string, string>): NextRequest {
  // The request URL path is irrelevant to the handler — it derives the upstream
  // target from `context.params`, and only the request origin is read (for the
  // same-origin check). A bare origin keeps clear of the localhost-API lint guard.
  return new NextRequest("http://localhost:3000/", { headers });
}

function ctx() {
  return { params: Promise.resolve({ path: ["api", "v1", "mobile", "favorites", "ids"] }) };
}

describe("BFF ETag forwarding", () => {
  it("forwards if-none-match request header to upstream", async () => {
    let forwarded: string | null = "UNSET";
    server.use(
      http.get(UPSTREAM_URL, ({ request }) => {
        forwarded = request.headers.get("if-none-match");
        return HttpResponse.json({ success: true, data: { ids: [] } });
      }),
    );

    await GET(bffRequest({ "if-none-match": '"v1-etag"' }), ctx());

    expect(forwarded).toBe('"v1-etag"');
  });

  it("exposes etag response header to the client", async () => {
    server.use(
      http.get(UPSTREAM_URL, () =>
        HttpResponse.json({ success: true, data: { ids: [] } }, { headers: { etag: '"v1-etag"' } }),
      ),
    );

    const res = await GET(bffRequest(), ctx());

    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toBe('"v1-etag"');
  });

  it("returns 304 with empty body without buffering", async () => {
    server.use(
      http.get(UPSTREAM_URL, () =>
        new HttpResponse(null, { status: 304, headers: { etag: '"v1-etag"' } }),
      ),
    );

    const res = await GET(bffRequest({ "if-none-match": '"v1-etag"' }), ctx());

    expect(res.status).toBe(304);
    expect(res.headers.get("etag")).toBe('"v1-etag"');
    expect(await res.text()).toBe("");
  });
});
