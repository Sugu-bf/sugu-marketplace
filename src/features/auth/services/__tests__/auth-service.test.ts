import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeRelativePath, guestEntry } from "@/features/auth/services/auth-service";
import { ApiError } from "@/lib/api/errors";

describe("safeRelativePath", () => {
  it("allows only internal relative redirects", () => {
    expect(safeRelativePath("/")).toBe("/");
    expect(safeRelativePath("/account/orders?tab=open")).toBe("/account/orders?tab=open");
    expect(safeRelativePath("/checkout#shipping")).toBe("/checkout#shipping");
  });

  it("blocks external, protocol-relative, slash-backslash, and control redirects", () => {
    expect(safeRelativePath("https://evil.example")).toBe("/");
    expect(safeRelativePath("javascript:alert(1)")).toBe("/");
    expect(safeRelativePath("//evil.example")).toBe("/");
    expect(safeRelativePath("/\\evil.example")).toBe("/");
    expect(safeRelativePath("/account\nSet-Cookie:x=y")).toBe("/");
    expect(safeRelativePath("account/orders")).toBe("/");
    expect(safeRelativePath(null)).toBe("/");
  });
});

// ─── consumeAuthEnvelope contract — through guestEntry ─────────────────
//
// `consumeAuthEnvelope` is internal to auth-service; we cover it through
// `guestEntry` which calls it on every successful response. These tests
// lock the three invariants the BFF proxy is supposed to uphold:
//   I1 — success envelope
//   I2 — session_established flag (proof the HttpOnly cookie was set)
//   I3 — no raw token leaks back to JS
describe("auth-issuing flows — BFF proxy contract", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockFetchOnce(body: unknown, status = 200): void {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
  }

  it("accepts a well-formed proxy envelope", async () => {
    mockFetchOnce({
      success: true,
      data: {
        user: { id: "u_1", name: "Invité", email: null },
        expires_at: "2099-01-01T00:00:00.000Z",
        session_established: true,
      },
    });

    const result = await guestEntry();
    expect(result.user.id).toBe("u_1");
    // expires_at is preserved on the returned payload so the caller can act on it.
    expect(result.expires_at).toBe("2099-01-01T00:00:00.000Z");
  });

  it("rejects loud when session_established is missing (proxy did not run)", async () => {
    mockFetchOnce({
      success: true,
      data: {
        user: { id: "u_1" },
        // No session_established → cookie was never set → must fail loud.
        token: "1|abcdefghijklmnopqrstuvwxyz0123456789ABCDEF",
      },
    });

    await expect(guestEntry()).rejects.toMatchObject({
      code: "AUTH_TOKEN_LEAKED",
    });
  });

  it("rejects loud when the raw token leaked through", async () => {
    mockFetchOnce({
      success: true,
      data: {
        user: { id: "u_1" },
        token: "1|abcdefghijklmnopqrstuvwxyz0123456789ABCDEF",
        session_established: true,
      },
    });

    await expect(guestEntry()).rejects.toMatchObject({
      code: "AUTH_TOKEN_LEAKED",
    });
  });

  it("rejects when the success envelope is malformed", async () => {
    mockFetchOnce({ success: false, message: "boom" });

    await expect(guestEntry()).rejects.toBeInstanceOf(ApiError);
  });
});
