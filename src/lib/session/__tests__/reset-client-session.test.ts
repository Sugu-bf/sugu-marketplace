// @vitest-environment jsdom
/**
 * Ending a session on this device (audit P1-11): nothing the account left in
 * the browser survives a logout or an expiry.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { clearClientSessionState, resetClientSession } from "@/lib/session/reset-client-session";
import { useFavoritesStore } from "@/features/wishlist/store/favorites-store";
import { FAVORITES_MERGE_FLAG_KEY } from "@/features/wishlist/hooks/use-merge-favorites-on-login";
import { useCartStore } from "@/features/cart/store/cart-store";

const queryClient = new QueryClient();
const disconnectEcho = vi.fn();

vi.mock("@/lib/query-provider", () => ({ getBrowserQueryClient: () => queryClient }));
vi.mock("@/lib/echo", () => ({ disconnectEcho: () => disconnectEcho() }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  disconnectEcho.mockClear();
});

function seedSession() {
  queryClient.setQueryData(["favorites", "ids"], { ids: ["p1"] });
  useFavoritesStore.getState().clearGuest();
  useFavoritesStore.getState().add("p1");
  sessionStorage.setItem(FAVORITES_MERGE_FLAG_KEY, "1");
  localStorage.setItem("sugu:cart-token", "0b6c3f4e-2a2b-4c4d-9e9f-0a1b2c3d4e5f");
  localStorage.setItem("sugu:cart-items", JSON.stringify([{ id: "p1", qty: 1 }]));
  localStorage.setItem("auth_token_expires_at", "2027-01-01T00:00:00Z");
  document.cookie = "sugu_cart_token=0b6c3f4e-2a2b-4c4d-9e9f-0a1b2c3d4e5f; path=/";
}

describe("clearClientSessionState", () => {
  it("clears the cache, favorites, cart, flags and the realtime socket", async () => {
    seedSession();

    await clearClientSessionState();

    expect(queryClient.getQueryData(["favorites", "ids"])).toBeUndefined();
    expect(useFavoritesStore.getState().size()).toBe(0);
    expect(localStorage.getItem("sugu_favorites_guest_v1")).toBeNull();
    expect(sessionStorage.getItem(FAVORITES_MERGE_FLAG_KEY)).toBeNull();
    expect(localStorage.getItem("sugu:cart-token")).toBeNull();
    expect(localStorage.getItem("sugu:cart-items")).toBeNull();
    expect(localStorage.getItem("auth_token_expires_at")).toBeNull();
    expect(document.cookie).not.toContain("sugu_cart_token=0b6c");
    expect(useCartStore.getState().items).toEqual([]);
    expect(disconnectEcho).toHaveBeenCalledTimes(1);
  });

  it("keeps going when a step fails", async () => {
    seedSession();
    disconnectEcho.mockImplementationOnce(() => {
      throw new Error("socket already closed");
    });

    await clearClientSessionState();

    expect(localStorage.getItem("sugu:cart-token")).toBeNull();
    expect(useFavoritesStore.getState().size()).toBe(0);
  });
});

describe("resetClientSession", () => {
  it("reloads the destination once everything is cleared", async () => {
    seedSession();
    const navigate = vi.fn(() => {
      expect(localStorage.getItem("sugu:cart-token")).toBeNull();
    });

    await resetClientSession("/login", navigate);

    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it.each(["https://evil.test/", "//evil.test", "/\\evil.test", "javascript:alert(1)"])(
    "goes home instead of %j",
    async (destination) => {
      const navigate = vi.fn();
      await resetClientSession(destination, navigate);
      expect(navigate).toHaveBeenCalledWith("/");
    },
  );
});
