/**
 * Centralized TanStack Query keys for the wishlist feature.
 */
export const favoritesKeys = {
  all: ["favorites"] as const,
  ids: () => [...favoritesKeys.all, "ids"] as const,
  page: () => [...favoritesKeys.all, "page"] as const,
};
