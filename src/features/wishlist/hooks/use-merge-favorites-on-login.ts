import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useToast } from "@/features/toast/toast-store";
import { useFavoritesStore } from "../store/favorites-store";
import { bulkMergeFavorites } from "../api/favorites.api";
import { favoritesKeys } from "../queries/favorites-keys";

const SESSION_FLAG_KEY = "sugu_favorites_merge_attempted_v1";

/**
 * Reconcile guest favorites into the authenticated wishlist at login.
 *
 * Auth uses a hard redirect (window.location.href), so there is no SPA "success
 * event" to hook — instead we reconcile on mount: if the session is now
 * authenticated, no merge was attempted this session, and a guest Set exists, we
 * merge once.
 *
 * The session flag is posted BEFORE the network call (not after): a failed merge
 * must not retry-loop on every subsequent mount. The local guest Set stays in
 * the store/localStorage, so display keeps working even if the transfer failed.
 */
export function useMergeFavoritesOnLogin(): void {
  const queryClient = useQueryClient();
  const localFlagRef = useRef(false);

  useEffect(() => {
    if (localFlagRef.current) return; // component-instance guard (StrictMode safe)
    if (!hasAuthSession()) return;
    if (sessionStorage.getItem(SESSION_FLAG_KEY)) return; // cross-mount guard
    const guestIds = useFavoritesStore.getState().ids();
    if (guestIds.length === 0) return;

    // Pose both flags BEFORE the call — race protection, no retry loop.
    localFlagRef.current = true;
    sessionStorage.setItem(SESSION_FLAG_KEY, "1");

    void (async () => {
      try {
        const result = await bulkMergeFavorites(guestIds);
        await queryClient.invalidateQueries({ queryKey: favoritesKeys.ids() });
        useFavoritesStore.getState().clearGuest();

        if (result.truncated) {
          useToast
            .getState()
            .info("Certains favoris n'ont pas pu être transférés (limite atteinte)");
        }
        if (result.skippedCount > 0) {
          console.info(`Bulk-merge skipped ${result.skippedCount} items`);
        }
      } catch (err) {
        // Silent by design (rare edge case) — flag stays set, no retry loop.
        console.error("Bulk-merge favorites failed", err);
      }
    })();
  }, [queryClient]);
}
