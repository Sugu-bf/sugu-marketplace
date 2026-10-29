/**
 * Tests for lib/api/config.ts — Base URL guard.
 *
 * A production build only talks to a remote https API; development and tests
 * may use a local or staging API (audit M7).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("API Config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should resolve to https://api.mysugu.com when env is set correctly", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.mysugu.com");
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it("should fall back to https://api.mysugu.com when env is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it("should strip trailing slashes from the URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.mysugu.com///");
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it.each(["http://localhost:8000", "http://127.0.0.1:8000", "http://0.0.0.0:8000", "http://[::1]:8000"])(
    "refuses the local address %s in production",
    async (url) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", url);
      await expect(() => import("@/lib/api/config")).rejects.toThrow(/local address/i);
    },
  );

  it("refuses a plain http API in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://api.mysugu.com");
    await expect(() => import("@/lib/api/config")).rejects.toThrow(/https/);
  });

  it.each(["development", "test"])("allows a local API in %s", async (mode) => {
    vi.stubEnv("NODE_ENV", mode);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000/");
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });

  it("refuses what is not an http(s) URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "ftp://api.mysugu.com");
    await expect(() => import("@/lib/api/config")).rejects.toThrow(/Invalid API base URL/);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "not a url");
    await expect(() => import("@/lib/api/config")).rejects.toThrow(/Invalid API base URL/);
  });

  it("should NOT throw for a valid staging URL in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://staging.api.mysugu.com");
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://staging.api.mysugu.com");
  });
});
