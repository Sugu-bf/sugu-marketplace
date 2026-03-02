/**
 * Build Backend Params — maps SearchQueryState → Backend API params.
 *
 * DRY: single mapping point, used by both SSR and client-side queries.
 *
 * Target endpoint: GET /api/v1/web-products (WebProductController::public)
 * Params: search, category_slug, min_price, max_price, rating_min, in_stock, sort, per_page, page
 */

import type { SearchQueryState, SearchBackendParams } from "../api/search.types";

/** Items per page for search results */
export const SEARCH_PER_PAGE = 24;

/** Map frontend sort values to backend sort values */
const SORT_MAP: Record<string, string> = {
  relevance: "relevance",
  price_asc: "price_asc",
  price_desc: "price_desc",
  newest: "newest",
  popular: "popular",
};

/**
 * Build the backend API query params from the parsed SearchQueryState.
 * Only includes non-null/non-default values.
 */
export function buildBackendParams(state: SearchQueryState): SearchBackendParams {
  const params: SearchBackendParams = {};

  // Search query
  if (state.q) {
    params.search = state.q;
  }

  // Category filter (backend accepts single slug; for multi we use the first)
  // The WebProductController supports category_slug as a single value
  if (state.categories.length > 0) {
    params.category_slug = state.categories[0];
  }

  // Price filters
  if (state.price_min !== null) {
    params.min_price = state.price_min;
  }
  if (state.price_max !== null) {
    params.max_price = state.price_max;
  }

  // Rating minimum
  if (state.rating_min !== null) {
    params.rating_min = state.rating_min;
  }

  // In stock filter
  if (state.in_stock) {
    params.in_stock = true;
  }

  // Sort
  if (state.sort && state.sort !== "relevance") {
    params.sort = SORT_MAP[state.sort] ?? "relevance";
  }

  // Pagination
  params.per_page = SEARCH_PER_PAGE;
  if (state.page > 1) {
    params.page = state.page;
  }

  return params;
}
