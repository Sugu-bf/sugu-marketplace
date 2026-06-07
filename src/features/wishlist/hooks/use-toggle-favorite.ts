import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useToast } from "@/features/toast/toast-store";
import { useFavoritesStore } from "../store/favorites-store";
import { addFavorite, removeFavorite } from "../api/favorites.api";
import { favoritesKeys } from "../queries/favorites-keys";

/**
 * Module-level mutex keyed by productId. Shared across every <FavoriteHeart>
 * instance (a product can appear on many cards in one grid), so a double-tap on
 * any rendering of the same product is collapsed to a single in-flight request.
 */
const mutexMap = new Map<string, boolean>();

/** Test-only: reset the module-level double-tap mutex for isolation between tests. */
export function __clearToggleMutex(): void {
  mutexMap.clear();
}

type ToggleVars = { productId: string; action: "add" | "remove" };

/**
 * Optimistic favorite toggle. Flips the store immediately, fires the network
 * call, reverts + toasts on error, invalidates the bootstrap query on success.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, unknown, ToggleVars>({
    mutationFn: async ({ productId, action }) => {
      if (action === "add") await addFavorite(productId);
      else await removeFavorite(productId);
    },
    onMutate: ({ productId, action }) => {
      const store = useFavoritesStore.getState();
      if (action === "add") store.add(productId);
      else store.remove(productId);
    },
    onError: (_err, { productId, action }) => {
      // Revert the optimistic flip.
      const store = useFavoritesStore.getState();
      if (action === "add") store.remove(productId);
      else store.add(productId);
      useToast
        .getState()
        .error(
          action === "add"
            ? "Impossible d'ajouter aux favoris"
            : "Impossible de retirer des favoris",
        );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesKeys.ids() });
      void queryClient.invalidateQueries({ queryKey: favoritesKeys.page() }); // Lot 5: keeps /account/wishlist in sync
    },
    onSettled: (_data, _err, { productId }) => {
      mutexMap.delete(productId);
    },
  });

  const toggle = (productId: string): void => {
    const store = useFavoritesStore.getState();

    // Guests are local-only: the favorites endpoints are auth-strict (401 for
    // guests). Flip the persisted Set; the login merge syncs it to the server.
    // No network → no revert/toast, no mutex needed.
    if (!hasAuthSession()) {
      store.toggle(productId);
      return;
    }

    if (mutexMap.get(productId)) return; // a tap is already in flight
    mutexMap.set(productId, true);
    const action = store.has(productId) ? "remove" : "add";
    mutation.mutate({ productId, action });
  };

  return { toggle, isPending: mutation.isPending };
}
