/**
 * Ends a session on this device (audit P1-11): logout, session expiry.
 *
 * Signing out on the server is not enough on a shared device: the next person
 * would find the previous account's data in this browser (React Query cache,
 * favorites, cart, realtime socket), and the favorites merge at the next
 * sign-in would carry them into another account. Everything the session left
 * in the browser is cleared, then the page is fully reloaded so nothing held
 * in memory survives either.
 */
import { getBrowserQueryClient } from "@/lib/query-provider";
import { useFavoritesStore } from "@/features/wishlist/store/favorites-store";
import { FAVORITES_MERGE_FLAG_KEY } from "@/features/wishlist/hooks/use-merge-favorites-on-login";
import { clearCartToken } from "@/features/cart/api/cart-token";
import { clearCartItems } from "@/features/cart/events/cart-storage";

/** The session hint kept for the token refresh (see auth-service). */
const AUTH_EXPIRY_KEY = "auth_token_expires_at";

/** Runs every step even if one throws (blocked storage, socket already gone). */
function attempt(step: () => void): void {
  try {
    step();
  } catch {
    // Best effort per step: the full reload below still drops memory state.
  }
}

/** Clears what the session left in this browser, without navigating. */
export async function clearClientSessionState(): Promise<void> {
  try {
    const { disconnectEcho } = await import("@/lib/echo");
    disconnectEcho();
  } catch {
    // Realtime never started on this page.
  }

  attempt(() => getBrowserQueryClient()?.clear());
  attempt(() => {
    useFavoritesStore.getState().clearGuest();
    void useFavoritesStore.persist.clearStorage();
  });
  attempt(() => sessionStorage.removeItem(FAVORITES_MERGE_FLAG_KEY));
  attempt(clearCartToken);
  attempt(clearCartItems);
  attempt(() => localStorage.removeItem(AUTH_EXPIRY_KEY));
}

/**
 * Clears the session's traces, then loads `destination` from scratch. Only
 * same-origin paths are followed; anything else goes home.
 */
export async function resetClientSession(
  destination = "/",
  navigate: (url: string) => void = (url) => window.location.assign(url),
): Promise<void> {
  await clearClientSessionState();
  navigate(/^\/(?![/\\])/.test(destination) ? destination : "/");
}
