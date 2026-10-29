/**
 * Server calls made for one visitor carry that visitor's signed address
 * (audit P1-3); reads shared through the data cache carry none.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api/client";
import { buildApiUrl } from "@/lib/api/endpoints";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "198.18.0.9, 41.203.64.10" }),
  cookies: async () => ({ get: () => undefined }),
}));

const mockFetch = vi.fn();
const url = buildApiUrl("/api/v1/me/orders");

function sent(call: number): Headers {
  return mockFetch.mock.calls[call][1].headers as Headers;
}

beforeEach(() => {
  vi.stubEnv("SUGU_EDGE_SECRET", "0123456789abcdef0123456789abcdef");
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => Response.json({ ok: true }));
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("visitor address on server calls", () => {
  it("is signed onto a credentialed uncached call", async () => {
    await api.get(url);
    await api.post(url, { body: {} });

    for (const call of [0, 1]) {
      expect(sent(call).get("X-Sugu-Client-IP")).toBe("41.203.64.10");
      expect(sent(call).get("X-Sugu-Client-IP-Sig")).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("is left off cached reads and public calls", async () => {
    await api.get(url, { revalidate: 300 });
    await api.get(url, { skipCredentials: true });

    for (const call of [0, 1]) {
      expect(sent(call).has("X-Sugu-Client-IP")).toBe(false);
    }
  });
});
