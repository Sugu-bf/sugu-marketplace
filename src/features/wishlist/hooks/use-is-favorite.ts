import { useFavoritesStore } from "../store/favorites-store";

/**
 * Read whether a product is favorited. Returns a primitive boolean, so Zustand
 * re-renders the consumer only when THIS id's membership changes (Object.is).
 */
export function useIsFavorite(productId: string): boolean {
  return useFavoritesStore((state) => state.has(productId));
}
