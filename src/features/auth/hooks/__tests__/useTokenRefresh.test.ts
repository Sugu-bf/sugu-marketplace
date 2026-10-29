// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const authService = vi.hoisted(() => ({
  hasAuthSession: vi.fn(),
  tokenDaysRemaining: vi.fn(),
  refreshToken: vi.fn(),
  clearAuthTokenCookie: vi.fn(),
}));

vi.mock("@/features/auth/services/auth-service", () => authService);

import { refreshTokenIfDue } from "@/features/auth/hooks/useTokenRefresh";

type LockCallback = (lock: { name: string } | null) => Promise<void>;

function installLocks(available: boolean): ReturnType<typeof vi.fn> {
  const request = vi.fn(async (_name: string, _opts: unknown, cb: LockCallback) =>
    cb(available ? { name: "sugu-auth-token-refresh" } : null),
  );
  Object.defineProperty(navigator, "locks", { value: { request }, configurable: true });
  return request;
}

function rejectWith(status: number, errorCode?: string): void {
  authService.refreshToken.mockRejectedValueOnce(
    new ApiError({
      status,
      code: status === 401 ? "UNAUTHORIZED" : "CONFLICT",
      message: "refusé",
      details: errorCode ? { errorCode } : undefined,
    }),
  );
}

describe("refreshTokenIfDue — one refresh for all the tabs", () => {
  beforeEach(() => {
    authService.hasAuthSession.mockReturnValue(true);
    authService.tokenDaysRemaining.mockReturnValue(3);
    authService.refreshToken.mockResolvedValue({ expires_at: "2099-01-01T00:00:00.000Z" });
    authService.clearAuthTokenCookie.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes a token close to its end, holding the cross-tab lock", async () => {
    const request = installLocks(true);

    await refreshTokenIfDue();

    expect(request).toHaveBeenCalledWith("sugu-auth-token-refresh", { ifAvailable: true }, expect.any(Function));
    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("leaves the refresh to the tab that already holds the lock", async () => {
    installLocks(false);

    await refreshTokenIfDue();

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it("reads the expiry again once the lock is held: another tab may just have refreshed", async () => {
    installLocks(true);
    authService.tokenDaysRemaining.mockReturnValueOnce(3).mockReturnValue(89);

    await refreshTokenIfDue();

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it("keeps the session on a 401 that does not say the session ended", async () => {
    installLocks(true);
    rejectWith(401);

    await refreshTokenIfDue();

    expect(authService.clearAuthTokenCookie).not.toHaveBeenCalled();
  });

  it("keeps the session when another refresh already rotated the token", async () => {
    installLocks(true);
    rejectWith(409, "AUTH_083");

    await refreshTokenIfDue();

    expect(authService.clearAuthTokenCookie).not.toHaveBeenCalled();
  });

  it("ends the session when the backend says it was revoked", async () => {
    installLocks(true);
    rejectWith(401, "AUTH_081");
    const onExpired = vi.fn();
    window.addEventListener("auth:session-expired", onExpired);

    await refreshTokenIfDue();

    window.removeEventListener("auth:session-expired", onExpired);
    expect(authService.clearAuthTokenCookie).toHaveBeenCalledTimes(1);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
