/**
 * Pre-launch forms (audit 2026-10-29, catalogue low findings).
 *
 * /api/prelaunch/waitlist and /seller-register forwarded any POST to
 * Laravel: a cross-site `text/plain` form (no CORS preflight) could sign
 * visitors up from another site, and each call counted against the single
 * rate limit of the Next server's IP. Only same-origin JSON goes through.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as waitlist } from "../waitlist/route";
import { POST as sellerRegister } from "../seller-register/route";

const fetchMock = vi.fn();

function post(path: string, init: { origin?: string; contentType?: string; body?: string; site?: string }) {
  const headers = new Headers();
  if (init.origin) headers.set("origin", init.origin);
  if (init.contentType) headers.set("content-type", init.contentType);
  if (init.site) headers.set("sec-fetch-site", init.site);
  return new NextRequest(`https://sugu.pro/api/prelaunch/${path}`, { method: "POST", headers, body: init.body });
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ success: true }), { status: 201, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pre-launch routes", () => {
  it("forward a same-origin JSON form", async () => {
    const res = await waitlist(
      post("waitlist", { origin: "https://sugu.pro", contentType: "application/json", body: '{"email":"a@b.c"}' }),
    );

    expect(res.status).toBe(201);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/public\/prelaunch\/waitlist$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: "a@b.c" });
  });

  it.each([
    ["another origin", { origin: "https://evil.example", contentType: "application/json", body: "{}" }, 403],
    ["no origin", { contentType: "application/json", body: "{}" }, 403],
    ["a cross-site fetch", { origin: "https://sugu.pro", site: "cross-site", contentType: "application/json", body: "{}" }, 403],
    ["a text/plain form", { origin: "https://sugu.pro", contentType: "text/plain", body: '{"email":"a@b.c"}' }, 415],
    ["invalid JSON", { origin: "https://sugu.pro", contentType: "application/json", body: "{" }, 400],
    ["a JSON array", { origin: "https://sugu.pro", contentType: "application/json", body: "[]" }, 400],
    ["an oversized body", { origin: "https://sugu.pro", contentType: "application/json", body: JSON.stringify({ x: "a".repeat(9000) }) }, 413],
  ])("refuse %s", async (_label, init, status) => {
    for (const handler of [waitlist, sellerRegister]) {
      const res = await handler(post("x", init));
      expect(res.status).toBe(status);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
