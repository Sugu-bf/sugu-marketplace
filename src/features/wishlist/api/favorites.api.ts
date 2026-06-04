/**
 * Wishlist (favorites) — API functions.
 *
 * Mutations + page read go through the central api client. The bootstrap
 * GET /mobile/favorites/ids uses fetch() brut (Strategy A): the central client
 * throws on any !response.ok, which would include a 304 conditional GET, so we
 * read the 304 explicitly here and never clobber the local Set.
 */
import { api } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";
import {
  FavoriteIdsResponseSchema,
  BulkMergeResponseSchema,
  WishlistPageResponseSchema,
  type WishlistPageResponse,
} from "./favorites.schemas";
import {
  FAVORITES_IDS_PATH,
  favoriteByProductUrl,
  bulkMergeFavoritesUrl,
  wishlistPageUrl,
} from "./favorites.endpoints";
import type { FavoriteIdsBootstrapResult, BulkMergeResult } from "../models/favorites";

/**
 * Resolve the bootstrap URL for the fetch-brut path. Mirrors client.ts
 * shouldProxyThroughBff: in the browser, route through the same-origin BFF so
 * the HttpOnly auth cookie is injected server-side; on the server / in tests,
 * hit the absolute upstream directly.
 */
function resolveBootstrapUrl(): string {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
    return `${API_BASE_URL}${FAVORITES_IDS_PATH}`;
  }
  return `/api/backend${FAVORITES_IDS_PATH}`;
}

/**
 * Bootstrap the favorites Set. Sends If-None-Match when an ETag is known.
 * Returns { notModified: true } on 304 (caller keeps the current Set), or the
 * fresh ids on 200.
 */
export async function fetchFavoriteIds(
  opts?: { ifNoneMatch?: string | null },
): Promise<FavoriteIdsBootstrapResult> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.ifNoneMatch) headers["If-None-Match"] = opts.ifNoneMatch;

  const response = await fetch(resolveBootstrapUrl(), {
    method: "GET",
    credentials: "include",
    headers,
  });

  const etag = response.headers.get("etag");

  if (response.status === 304) {
    return { notModified: true, etag };
  }
  if (!response.ok) {
    throw new Error(`fetchFavoriteIds failed: ${response.status}`);
  }

  const parsed = FavoriteIdsResponseSchema.parse(await response.json());
  return {
    notModified: false,
    ids: parsed.ids,
    updatedAt: parsed.updated_at,
    etag,
  };
}

/** Add a favorite (idempotent, backend replies 204). */
export async function addFavorite(productId: string): Promise<void> {
  await api.post(favoriteByProductUrl(productId));
}

/** Remove a favorite (idempotent, backend replies 204). */
export async function removeFavorite(productId: string): Promise<void> {
  await api.delete(favoriteByProductUrl(productId));
}

/** Merge the guest favorites Set into the authenticated wishlist at login. */
export async function bulkMergeFavorites(ids: string[]): Promise<BulkMergeResult> {
  const { data } = await api.post(bulkMergeFavoritesUrl(), { body: { ids } });
  const parsed = BulkMergeResponseSchema.parse(data);
  return {
    mergedCount: parsed.merged_count,
    skippedCount: parsed.skipped_count,
    truncated: parsed.truncated,
  };
}

/** Aggregated wishlist page data (Q7). Strict-minimal schema (extended at Lot 5). */
export async function fetchWishlistPage(): Promise<WishlistPageResponse> {
  const { data } = await api.get(wishlistPageUrl());
  return WishlistPageResponseSchema.parse(data);
}
