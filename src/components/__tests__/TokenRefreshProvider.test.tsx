// @vitest-environment jsdom
/**
 * Audit 2026-10-29 (auth lows) — `auth:session-expired` was dispatched when
 * the backend ended the session, and nothing listened: the page kept showing
 * the signed-in state of a session that no longer existed.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { TokenRefreshProvider } from "../TokenRefreshProvider";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("@/features/auth/hooks/useTokenRefresh", () => ({
  useTokenRefresh: () => undefined,
}));

describe("TokenRefreshProvider", () => {
  it("reloads the server data of the page when the session ends", () => {
    const { unmount } = render(<TokenRefreshProvider>page</TokenRefreshProvider>);

    window.dispatchEvent(new CustomEvent("auth:session-expired"));
    expect(refresh).toHaveBeenCalledTimes(1);

    unmount();
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
