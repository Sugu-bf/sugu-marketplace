/**
 * Category Listing — API functions for the /category/[slug] page.
 *
 * Endpoints consumed:
 * - GET /api/v1/categories/{slug}     → Category detail (hero, children, SEO)
 * - GET /api/v1/web-products?...      → Paginated product listing with filters
 *
 * RULES:
 * - All requests go through lib/api/client.ts
 * - URLs built via v1Url()
 * - Zod validation on all responses
 * - Proper revalidate + tags for SSR caching
 * - No fetch() in UI components
 */

import { api, v1Url, CacheTags, RevalidatePresets, isApiError } from "@/lib/api";
import {
  CategoryDetailResponseSchema,
  ProductListingResponseSchema,
  type ApiCategoryDetail,
  type ApiProductListingItem,
  type ApiPaginationMeta,
} from "./category-listing.schemas";
import {
  type CategoryFiltersState,
  buildBackendQueryParams,
} from "../utils/category-url-state";

// ─── Category Detail (SSR, cached 6h) ────────────────────────

/**
 * Fetch category detail by slug.
 * Used by the RSC page for hero + metadata.
 */
export async function fetchCategoryDetail(
  slug: string
): Promise<ApiCategoryDetail | null> {
  try {
    const { data } = await api.get(
      v1Url(`categories/${encodeURIComponent(slug)}`),
      {
        schema: CategoryDetailResponseSchema,
        revalidate: RevalidatePresets.static, // 600s (10min)
        tags: [CacheTags.category(slug), CacheTags.categories()],
      }
    );
    return data.category;
  } catch (error) {
    if (isApiError(error) && error.code === "NOT_FOUND") {
      return null;
    }
    console.error(
      `[CategoryListing] Failed to fetch category "${slug}":`,
      (error as Error).message
    );
    return null;
  }
}

// ─── Products Listing (SSR, cached 5min) ─────────────────────

export interface ProductListingResult {
  products: ApiProductListingItem[];
  meta: ApiPaginationMeta;
}

/**
 * Fetch paginated products for a category with filters.
 * Used by the RSC page for the initial listing.
 */
export async function fetchCategoryProducts(
  categorySlug: string,
  filters: CategoryFiltersState,
  perPage = 24
): Promise<ProductListingResult> {
  try {
    const queryParams = buildBackendQueryParams(categorySlug, filters, perPage);

    // Clean undefined values
    const cleanParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== false) {
        cleanParams[key] = value as string | number;
      }
    }

    const { data } = await api.get(
      v1Url("web-products", cleanParams),
      {
        schema: ProductListingResponseSchema,
        revalidate: RevalidatePresets.frequent, // 120s
        tags: [
          CacheTags.categoryProducts(categorySlug),
          CacheTags.products(),
        ],
      }
    );

    return {
      products: data.data.products,
      meta: data.data.pagination,
    };
  } catch (error) {
    console.error(
      `[CategoryListing] Failed to fetch products for "${categorySlug}":`,
      (error as Error).message
    );
    return {
      products: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: null,
        to: null,
      },
    };
  }
}
