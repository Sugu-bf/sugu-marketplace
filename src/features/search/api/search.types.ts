/**
 * Search Feature — Type Definitions
 *
 * Canonical search state used across:
 * - URL query params (SEO-stable)
 * - Backend API params
 * - Client UI state
 */

// ─── Sort Values (match backend accepted values) ─────────────

export const SORT_VALUES = [
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "popular",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

// ─── View Mode ───────────────────────────────────────────────

export type ViewMode = "grid" | "list";

// ─── Search Query State (URL-encoded) ────────────────────────

export interface SearchQueryState {
  /** Search term */
  q: string;
  /** Selected category slugs (multi) */
  categories: string[];
  /** Min price filter */
  price_min: number | null;
  /** Max price filter */
  price_max: number | null;
  /** Minimum star rating (1-5) */
  rating_min: number | null;
  /** In stock only */
  in_stock: boolean;
  /** Sort order */
  sort: SortValue;
  /** View mode (client only, not sent to backend) */
  view: ViewMode;
  /** Current page number */
  page: number;
}

// ─── Backend API Params (mapped from SearchQueryState) ───────

export interface SearchBackendParams {
  search?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  rating_min?: number;
  in_stock?: boolean;
  sort?: string;
  per_page?: number;
  page?: number;
}

// ─── API Response Shapes ─────────────────────────────────────

export interface ApiProductStore {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductItem {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  price: number;
  compare_price: number | null;
  sale_price: number | null;
  currency: string;
  thumbnail: string | null;
  avg_rating: number;
  review_count: number;
  total_stock: number;
  sales_count: number;
  discount_percent: number | null;
  /** Typesense highlight with <mark> tags */
  highlight_name?: string;
  store: ApiProductStore | null;
  primary_category: ApiProductCategory | null;
}

export interface ApiSearchPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiFacetValue {
  value: string;
  count: number;
  label?: string;
}

export interface ApiSearchResponse {
  success: boolean;
  message: string;
  data: {
    products: ApiProductItem[];
    pagination: ApiSearchPagination;
    /** Typesense native facets */
    facets?: Record<string, ApiFacetValue[]>;
    filters_applied: Record<string, unknown>;
  };
}

// ─── UI-Ready Product ────────────────────────────────────────

export interface SearchProductItem {
  id: string;
  slug: string;
  name: string;
  /** Typesense highlighted name with <mark> tags (XSS-sanitized) */
  highlightName?: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sold: number;
  vendorName: string;
  categoryName: string;
}

// ─── Filter Facets ───────────────────────────────────────────

export interface FilterCategoryFacet {
  slug: string;
  name: string;
  count: number;
}
