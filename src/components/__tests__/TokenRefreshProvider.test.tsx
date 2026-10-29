// @vitest-environment jsdom
/**
 * Audit 2026-10-29 (auth lows) — `auth:session-expired` was dispatched when
 * the backend ended the session, and nothing listened: the page kept showing
 * the signed-in state of a session that no longer existed. The provider now
 * resets the client session (cache, favorites, cart, realtime) and reloads
 * the current page, signed out.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { TokenRefreshProvider } from "../TokenRefreshProvider";

const resetClientSession = vi.fn<(to: string) => Promise<void>>(async () => undefined);
vi.mock("@/lib/session/reset-client-session", () => ({
  resetClientSession: (to: string) => resetClientSession(to),
}));
vi.mock("@/features/auth/hooks/useTokenRefresh", () => ({
  useTokenRefresh: () => undefined,
}));

describe("TokenRefreshProvider", () => {
  it("resets the client session on the current page when the session ends", () => {
    window.history.replaceState(null, "", "/account/orders?page=2");
    const { unmount } = render(<TokenRefreshProvider>page</TokenRefreshProvider>);

    window.dispatchEvent(new CustomEvent("auth:session-expired"));
    expect(resetClientSession).toHaveBeenCalledTimes(1);
    expect(resetClientSession).toHaveBeenCalledWith("/account/orders?page=2");

    unmount();
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
    expect(resetClientSession).toHaveBeenCalledTimes(1);
  });
});
