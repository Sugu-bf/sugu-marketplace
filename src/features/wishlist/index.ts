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

// ─── Queries & hooks (Lot 3) ─────────────────────────────────
export { favoritesKeys } from "./queries/favorites-keys";
export { useFavoritesBootstrap } from "./queries/use-favorites-bootstrap";
export type { FavoritesBootstrapData } from "./queries/use-favorites-bootstrap";
export { useIsFavorite } from "./hooks/use-is-favorite";
export { useToggleFavorite } from "./hooks/use-toggle-favorite";
export { useMergeFavoritesOnLogin } from "./hooks/use-merge-favorites-on-login";
export { WishlistProvider } from "./components/WishlistProvider";
export { FavoriteHeart } from "./components/FavoriteHeart";
export type { FavoriteHeartProps } from "./components/FavoriteHeart";
