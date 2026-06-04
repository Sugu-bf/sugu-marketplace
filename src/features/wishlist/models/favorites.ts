/**
 * Wishlist (favorites) — UI-facing types.
 *
 * Pure types, no logic. The store and API layers consume these; React lands
 * at Lot 3+. Favorites are tracked at product granularity (the variant_id is
 * resolved contextually by the backend — transparent to the client).
 */

export type FavoriteId = string;

/**
 * Result of the bootstrap GET /mobile/favorites/ids (Strategy A — handled by a
 * fetch-brut path so a 304 does not throw through the central api client).
 */
export type FavoriteIdsBootstrapResult =
  | { notModified: true; etag: string | null }
  | {
      notModified: false;
      ids: FavoriteId[];
      updatedAt: string | null;
      etag: string | null;
    };

/** Result of POST /mobile/favorites/bulk-merge (snake_case → camelCase). */
export type BulkMergeResult = {
  mergedCount: number;
  skippedCount: number;
  truncated: boolean;
};

// Lot 5 will add WishlistPageItem / WishlistPageData UI types as the page
// schema is extended (kept minimal here per the sprint plan).
