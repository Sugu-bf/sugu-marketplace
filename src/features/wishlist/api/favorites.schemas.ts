/**
 * Wishlist (favorites) — strict Zod schemas mirroring the backend contract.
 *
 * Strict by design (no .passthrough() / .partial()): a malformed/unexpected
 * payload throws a ZodError rather than being silently mis-read. Unknown keys
 * are stripped by Zod's default object behavior (the /mobile/wishlist response
 * carries extra top-level sections — filter_counts, counts, empty_state — that
 * we intentionally ignore at this stage).
 *
 * Field names and units verified against the backend (sprint 898a4bc):
 *   - GET  /api/v1/mobile/favorites/ids       → { ids, updated_at }
 *   - POST /api/v1/mobile/favorites/bulk-merge → { merged_count, skipped_count, truncated }
 *   - GET  /api/v1/mobile/wishlist            → { wishlist: { items[], pagination }, ... }
 * Prices are in minor units (centimes) — see memory prices-minor-units-centimes.
 */
import { z } from "zod";

export const FavoriteIdsResponseSchema = z.object({
  ids: z.array(z.string()),
  updated_at: z.string().nullable(), // ISO 8601 (max item updated_at) or null when empty
});
export type FavoriteIdsResponse = z.infer<typeof FavoriteIdsResponseSchema>;

export const BulkMergeResponseSchema = z.object({
  merged_count: z.number().int().nonnegative(),
  skipped_count: z.number().int().nonnegative(),
  truncated: z.boolean(),
});
export type BulkMergeResponse = z.infer<typeof BulkMergeResponseSchema>;

/**
 * /mobile/wishlist page — STRICT MINIMAL (essential UI fields only).
 * Extended strictly at Lot 5 as the page is built. Never made permissive
 * retroactively.
 */
export const WishlistPageItemSchema = z.object({
  product_id: z.string(), // ULID
  name: z.string(),
  image_url: z.string().nullable(),
  price: z.number().int(), // centimes (minor units)
});

export const WishlistPagePaginationSchema = z.object({
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  last_page: z.number().int().nonnegative(),
});

export const WishlistPageResponseSchema = z.object({
  wishlist: z.object({
    items: z.array(WishlistPageItemSchema),
    pagination: WishlistPagePaginationSchema,
  }),
});
export type WishlistPageResponse = z.infer<typeof WishlistPageResponseSchema>;
