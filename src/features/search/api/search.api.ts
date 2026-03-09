/**
 * Search API — business-oriented fetch functions for search.
 *
 * Endpoints consumed:
 * - GET /api/v1/web-products?search=...&sort=...&page=...
 *   → Product search / catalogue (via WebProductController::public)
 *
 * Typesense strategy: BACKEND-PROXY
 * - The front always calls /api/v1/web-products.
 * - If SCOUT_DRIVER=typesense on the backend, the search uses Typesense.
 * - If not, it falls back to DB LIKE queries.
 * - The front NEVER talks directly to Typesense. Zero client-side keys.
 *
 * All calls go through lib/api. No direct fetch.
 */

import { api, v1Url, CacheTags, RevalidatePresets } from "@/lib/api";
import type { QueryParams } from "@/lib/api";
import { SearchResponseSchema, type SearchResponseData } from "./search.schemas";
import type { SearchQueryState, SearchProductItem, FilterCategoryFacet } from "./search.types";
import { buildBackendParams, SEARCH_PER_PAGE } from "../utils/buildBackendParams";
import { DEFAULT_PRICE_RANGES } from "@/lib/constants";
import type { PriceRange } from "../models/search";

// ─── Constants ───────────────────────────────────────────────

const FALLBACK_THUMBNAIL = "https://cdn.sugu.pro/s/theme/fallback-product.png";

// ─── Normalizer: API → UI ProductItem ────────────────────────

/** Single product item from Zod-parsed API response */
type ApiProduct = SearchResponseData["data"]["products"][number];

function normalizeProduct(raw: ApiProduct): SearchProductItem {
  const effectivePrice = raw.sale_price ?? raw.price;
  const comparePrice = raw.compare_price ?? (raw.sale_price ? raw.price : null);
  const hasDiscount = comparePrice !== null && comparePrice > effectivePrice;

  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    highlightName: raw.highlight_name || undefined,
    price: effectivePrice,
    originalPrice: hasDiscount ? comparePrice : null,
    discount: raw.discount_percent ?? (hasDiscount && comparePrice
      ? Math.round(((comparePrice - effectivePrice) / comparePrice) * 100)
      : null),
    thumbnail: raw.thumbnail || FALLBACK_THUMBNAIL,
    rating: raw.avg_rating ?? 0,
    reviewCount: raw.review_count ?? 0,
    stock: raw.total_stock ?? 0,
    sold: raw.sales_count ?? 0,
    vendorName: raw.store?.name ?? "",
    categoryName: raw.primary_category?.name ?? "",
  };
}

// ─── Search API Fetch ────────────────────────────────────────

export interface SearchResultData {
  products: SearchProductItem[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  filtersApplied: Record<string, unknown>;
  /** Category facets — from Typesense native facets (accurate across ALL results) */
  categoryFacets: FilterCategoryFacet[];
}

/**
 * Fetch search results from backend with SSR caching.
 *
 * @param state - Parsed search query state from URL
 * @returns Normalized search result data ready for UI
 */
export async function fetchSearchResults(
  state: SearchQueryState
): Promise<SearchResultData> {
  const backendParams = buildBackendParams(state);

  // Build URL params
  const urlParams: QueryParams = {};
  if (backendParams.search) urlParams.search = backendParams.search;
  if (backendParams.category_slug) urlParams.category_slug = backendParams.category_slug;
  if (backendParams.min_price !== undefined) urlParams.min_price = backendParams.min_price;
  if (backendParams.max_price !== undefined) urlParams.max_price = backendParams.max_price;
  if (backendParams.rating_min !== undefined) urlParams.rating_min = backendParams.rating_min;
  if (backendParams.in_stock) urlParams.in_stock = 1;
  if (backendParams.sort) urlParams.sort = backendParams.sort;
  urlParams.per_page = backendParams.per_page ?? SEARCH_PER_PAGE;
  if (backendParams.page) urlParams.page = backendParams.page;

  // Cache key hash
  const searchTag = state.q
    ? CacheTags.search(state.q.toLowerCase().trim())
    : "search:browse";

  const { data } = await api.get(v1Url("web-products", urlParams), {
    schema: SearchResponseSchema,
    revalidate: 30, // Short cache: 30s public + stale-while-revalidate
    tags: [CacheTags.products(), searchTag],
  });

  const products = data.data.products.map(normalizeProduct);

  // ── Category facets: use Typesense native facets (accurate across ALL results)
  //    Falls back to client-side counting if facets aren't returned (browse mode)
  let categoryFacets: FilterCategoryFacet[];

  const backendCategoryFacets = data.data.facets?.category_name;
  if (backendCategoryFacets && backendCategoryFacets.length > 0) {
    // Typesense native facets — accurate counts across ALL matching products
    categoryFacets = backendCategoryFacets.map((f) => ({
      slug: slugify(f.value),
      name: f.label || f.value,
      count: f.count,
    }));
  } else {
    // Fallback: derive from current page products (browse mode, no Typesense)
    const categoryMap = new Map<string, { name: string; count: number }>();
    for (const p of products) {
      if (p.categoryName) {
        const slug = slugify(p.categoryName);
        const existing = categoryMap.get(slug);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(slug, { name: p.categoryName, count: 1 });
        }
      }
    }
    categoryFacets = Array.from(categoryMap.entries())
      .map(([slug, { name, count }]) => ({ slug, name, count }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    products,
    pagination: {
      currentPage: data.data.pagination.current_page,
      lastPage: data.data.pagination.last_page,
      perPage: data.data.pagination.per_page,
      total: data.data.pagination.total,
    },
    filtersApplied: data.data.filters_applied ?? {},
    categoryFacets,
  };
}

// ─── Price Ranges (static, from constants) ───────────────────

/**
 * Get price range buckets.
 * These are static and defined in lib/constants.
 * If the backend ever returns faceted price ranges, swap this function.
 */
export function getStaticPriceRanges(): PriceRange[] {
  return [...DEFAULT_PRICE_RANGES];
}

// ─── Helpers ─────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
