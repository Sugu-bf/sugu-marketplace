/**
 * The account guard (audit P1-8): signed out → login; backend unable to
 * tell → a "service unavailable" page, not a raw 500 nor the account.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import type { AuthState } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";

const authState = vi.fn<() => Promise<AuthState>>();
const queryAccountPageData = vi.fn(async () => ({ profile: { name: "Awa" } }));
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

vi.mock("@/lib/api/auth", () => ({ getAuthState: () => authState() }));
vi.mock("@/features/account", () => ({ queryAccountPageData: () => queryAccountPageData() }));
vi.mock("@/features/account/components/AccountSidebar", () => ({ AccountSidebar: () => null }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

import AccountLayout from "../layout";

beforeEach(() => {
  authState.mockReset();
  queryAccountPageData.mockClear();
});

describe("AccountLayout", () => {
  it("sends a signed-out visitor to login", async () => {
    authState.mockResolvedValue({ status: "unauthenticated" });

    await expect(AccountLayout({ children: null })).rejects.toThrow("NEXT_REDIRECT /login?redirect=/account");
  });

  it("shows the service as unavailable when the session cannot be checked", async () => {
    authState.mockResolvedValue({
      status: "unavailable",
      error: new ApiError({ status: 503, code: "SERVER_ERROR", message: "" }),
    });

    const page = (await AccountLayout({ children: null })) as ReactElement<{ retryHref: string }>;

    expect(page.type).toBe(ServiceUnavailable);
    expect(page.props.retryHref).toBe("/account");
    expect(queryAccountPageData).not.toHaveBeenCalled();
  });

  it("renders the account for a signed-in visitor", async () => {
    authState.mockResolvedValue({
      status: "authenticated",
      user: { id: "1", name: "Awa", email: null, created_at: "2026-01-01" },
    });

    const page = (await AccountLayout({ children: null })) as ReactElement;

    expect(page.type).toBe("main");
    expect(queryAccountPageData).toHaveBeenCalledTimes(1);
  });
});
