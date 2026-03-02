import { api, v1Url } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import {
  VendorPageResponseSchema,
  FollowResponseSchema,
  type VendorPageResponse,
  type FollowResponse,
} from "./store.schemas";

// ─── Vendor Page BFF ──────────────────────────────────────────

export type VendorPageSort =
  | "popular"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "top_rated";

export interface VendorPageParams {
  slug: string;
  limit?: number;
  cursor?: string | null;
  sort?: VendorPageSort;
  q?: string;
}

/**
 * Fetch the vendor page BFF endpoint.
 *
 * GET /api/v1/vendors/{slug}/page?limit=20&cursor=...&sort=popular&q=
 *
 * Returns vendor profile + sidebar banner + cursor-paginated products + reviews.
 */
export async function fetchVendorPage(
  params: VendorPageParams,
  options?: { revalidate?: number | false; tags?: string[] },
): Promise<ApiResponse<VendorPageResponse>> {
  const { slug, ...query } = params;

  return api.get<VendorPageResponse>(
    v1Url(`vendors/${slug}/page`, {
      limit: query.limit,
      cursor: query.cursor ?? undefined,
      sort: query.sort,
      q: query.q || undefined,
    }),
    {
      schema: VendorPageResponseSchema,
      revalidate: options?.revalidate,
      tags: options?.tags,
    },
  );
}

// ─── Follow / Unfollow ────────────────────────────────────────

/**
 * Follow a vendor store.
 *
 * POST /api/v1/vendors/{storeId}/follow
 * Auth required.
 */
export async function followStore(
  storeId: string,
): Promise<ApiResponse<FollowResponse>> {
  return api.post<FollowResponse>(v1Url(`vendors/${storeId}/follow`), {
    schema: FollowResponseSchema,
  });
}

/**
 * Unfollow a vendor store.
 *
 * DELETE /api/v1/vendors/{storeId}/follow
 * Auth required.
 */
export async function unfollowStore(
  storeId: string,
): Promise<ApiResponse<FollowResponse>> {
  return api.delete<FollowResponse>(v1Url(`vendors/${storeId}/follow`), {
    schema: FollowResponseSchema,
  });
}
