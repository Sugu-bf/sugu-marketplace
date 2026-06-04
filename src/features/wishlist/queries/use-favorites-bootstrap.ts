import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { fetchFavoriteIds } from "../api/favorites.api";
import { favoritesKeys } from "./favorites-keys";

/**
 * Network source of truth for the favorites Set. The ETag lives here (in the
 * QueryClient data), never in Zustand — it's an HTTP/cache concern, not display
 * state. WishlistProvider replicates `data.ids` into the store (one-way).
 */
export type FavoritesBootstrapData = {
  ids: string[];
  updatedAt: string | null;
  etag: string | null;
};

const EMPTY: FavoritesBootstrapData = { ids: [], updatedAt: null, etag: null };

export function useFavoritesBootstrap() {
  const queryClient = useQueryClient();

  return useQuery<FavoritesBootstrapData>({
    queryKey: favoritesKeys.ids(),
    queryFn: async () => {
      const previous = queryClient.getQueryData<FavoritesBootstrapData>(favoritesKeys.ids());
      const result = await fetchFavoriteIds({ ifNoneMatch: previous?.etag ?? null });

      if (result.notModified) {
        // 304 — keep the previous data verbatim (the HTTP status is hidden
        // from consumers; they just read data.ids).
        return previous ?? { ...EMPTY, etag: result.etag };
      }
      return { ids: result.ids, updatedAt: result.updatedAt, etag: result.etag };
    },
    enabled: hasAuthSession(), // guests never fetch (would 401)
    refetchOnWindowFocus: true, // per-query override (global default is false)
    staleTime: 0, // always revalidate — cheap thanks to ETag/304
  });
}
