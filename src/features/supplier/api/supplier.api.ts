import { api, v1Url } from "@/lib/api";
import type { ApiResponse } from "@/lib/api";
import {
  SuppliersResponseSchema,
  type SuppliersResponse,
} from "./supplier.schemas";

// ─── Params ──────────────────────────────────────────────

export interface SuppliersParams {
  limit?: number;
  cursor?: string | null;
  sort?: "top_rated" | "popular" | "newest";
  q?: string;
  min_rating?: number;
}

// ─── Fetch Suppliers ─────────────────────────────────────

/**
 * Fetch suppliers from the vendors API.
 *
 * GET /api/v1/vendors?limit=12&cursor=...&sort=top_rated&q=
 *
 * Same endpoint as stores — MVP reuses vendor listing.
 */
export async function fetchSuppliers(
  params: SuppliersParams,
  options?: { revalidate?: number | false; tags?: string[] },
): Promise<ApiResponse<SuppliersResponse>> {
  return api.get<SuppliersResponse>(
    v1Url("vendors", {
      limit: params.limit,
      cursor: params.cursor ?? undefined,
      sort: params.sort,
      q: params.q || undefined,
      min_rating: params.min_rating,
    }),
    {
      schema: SuppliersResponseSchema,
      revalidate: options?.revalidate,
      tags: options?.tags,
    },
  );
}
