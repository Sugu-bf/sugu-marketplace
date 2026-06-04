/**
 * Wishlist (favorites) — URL builders. Mirrors the per-feature endpoint pattern
 * (no hardcoded paths in favorites.api.ts). `v1Url` prefixes `/api/v1/` and the
 * configured API base.
 */
import { v1Url } from "@/lib/api/endpoints";

const FAVORITES_BASE = "/mobile/favorites";
const WISHLIST_PAGE = "/mobile/wishlist";

/** Absolute path segment shared by the fetch-brut bootstrap (Strategy A). */
export const FAVORITES_IDS_PATH = "/api/v1/mobile/favorites/ids";

export const favoritesIdsUrl = (): string => v1Url(`${FAVORITES_BASE}/ids`);
export const favoriteByProductUrl = (productId: string): string =>
  v1Url(`${FAVORITES_BASE}/${productId}`);
export const bulkMergeFavoritesUrl = (): string => v1Url(`${FAVORITES_BASE}/bulk-merge`);
export const wishlistPageUrl = (): string => v1Url(WISHLIST_PAGE);
