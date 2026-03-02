/**
 * Tests for lib/api/config.ts — Base URL guard
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("API Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should resolve to https://api.mysugu.com when env is set correctly", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.mysugu.com";
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it("should fall back to https://api.mysugu.com when env is empty", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it("should strip trailing slashes from the URL", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.mysugu.com///";
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://api.mysugu.com");
  });

  it("should throw if URL contains localhost", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000/api";
    await expect(() => import("@/lib/api/config")).rejects.toThrow(
      /local address/i
    );
  });

  it("should throw if URL contains 127.0.0.1", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000/api";
    await expect(() => import("@/lib/api/config")).rejects.toThrow(
      /local address/i
    );
  });

  it("should throw if URL contains 0.0.0.0", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://0.0.0.0:8000";
    await expect(() => import("@/lib/api/config")).rejects.toThrow(
      /local address/i
    );
  });

  it("should NOT throw for a valid production URL", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://staging.api.mysugu.com";
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).toBe("https://staging.api.mysugu.com");
  });

  it("should never contain localhost in the default fallback", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const { API_BASE_URL } = await import("@/lib/api/config");
    expect(API_BASE_URL).not.toContain("localhost");
    expect(API_BASE_URL).not.toContain("127.0.0.1");
  });
});
