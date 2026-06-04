// ─── Store ───────────────────────────────────────────────────
export { useFavoritesStore } from "./store/favorites-store";

// ─── API ─────────────────────────────────────────────────────
export {
  fetchFavoriteIds,
  addFavorite,
  removeFavorite,
  bulkMergeFavorites,
  fetchWishlistPage,
} from "./api/favorites.api";

// ─── Models ──────────────────────────────────────────────────
export type {
  FavoriteId,
  FavoriteIdsBootstrapResult,
  BulkMergeResult,
} from "./models/favorites";

// ─── Schemas (types) ─────────────────────────────────────────
export type {
  FavoriteIdsResponse,
  BulkMergeResponse,
  WishlistPageResponse,
} from "./api/favorites.schemas";
