/**
 * Channel authorization relay: same-origin only, a bounded body, a bounded
 * wait on Laravel with a JSON 502 when it fails, the visitor's signed address.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { POST } from "@/app/api/broadcasting/auth/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const APP = "https://sugu.test";
const AUTH_URL = new URL("/api/broadcasting/auth", API_BASE_URL).toString();
const TOKEN = "1|abcdefghijklmnopqrstuvwxyz0123456789ABCD";
const PAYLOAD = JSON.stringify({ socket_id: "123.456", channel_name: "private-conversation.1" });

function authorize(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`${APP}/api/broadcasting/auth`, {
    method: "POST",
    headers: {
      origin: APP,
      "content-type": "application/json",
      cookie: `auth_token=${encodeURIComponent(TOKEN)}`,
      ...headers,
    },
    body,
  });
}

describe("POST /api/broadcasting/auth", () => {
  it("relays the authorization with the visitor's signed address", async () => {
    vi.stubEnv("SUGU_EDGE_SECRET", "0123456789abcdef0123456789abcdef");
    let seen: Headers | null = null;
    server.use(
      http.post(AUTH_URL, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ auth: "key:signature" });
      }),
    );

    const response = await POST(authorize(PAYLOAD, { "x-forwarded-for": "41.203.64.10" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ auth: "key:signature" });
    expect(seen!.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(seen!.get("x-sugu-client-ip")).toBe("41.203.64.10");
  });

  it("refuses a foreign origin and an oversized body", async () => {
    expect((await POST(authorize(PAYLOAD, { origin: "https://evil.test" }))).status).toBe(403);
    expect((await POST(authorize("x".repeat(5000)))).status).toBe(413);
  });

  it("answers a JSON 502 when Laravel cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.post(AUTH_URL, () => HttpResponse.error()));

    const response = await POST(authorize(PAYLOAD));

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
