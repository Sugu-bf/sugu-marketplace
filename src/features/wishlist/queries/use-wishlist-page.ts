import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { fetchWishlistPage } from "../api/favorites.api";
import { favoritesKeys } from "./favorites-keys";

/**
 * Fetches the paginated wishlist page (page 1 only — MVP).
 *
 * Key: favoritesKeys.page() — invalidated by useToggleFavorite.onSuccess
 * so that removing a heart from the dedicated /account/wishlist page
 * immediately removes the item from the list.
 *
 * Disabled for guests: the account layout handles the redirect to /login.
 * staleTime: 30s (less critical than the bootstrap ids query).
 */
export function useWishlistPage() {
  return useQuery({
    queryKey: favoritesKeys.page(),
    queryFn: fetchWishlistPage,
    enabled: hasAuthSession(),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
