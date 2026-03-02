/**
 * Category URL State — single source of truth for filters in the URL.
 *
 * Canonical query params (stable order for SEO):
 *   subcats=slug1,slug2
 *   price_min=1000
 *   price_max=5000
 *   rating_min=3
 *   in_stock=1
 *   sort=relevance|price_asc|price_desc|newest|best_selling|rating
 *   view=grid|list
 *   page=2
 *
 * RULES:
 * - Default values are OMITTED from URL (page=1, sort=relevance, view=grid)
 * - Stable alphabetical param order for canonical URLs
 * - Single builder/parser — no duplicated logic
 */

// ─── Types ───────────────────────────────────────────────────

export const SORT_VALUES = [
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "best_selling",
  "rating",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export type ViewMode = "grid" | "list";

export interface CategoryFiltersState {
  /** Selected subcategory slugs (multi-select) */
  subcats: string[];
  /** Minimum price filter */
  priceMin: number | null;
  /** Maximum price filter */
  priceMax: number | null;
  /** Minimum star rating */
  ratingMin: number | null;
  /** In stock only */
  inStock: boolean;
  /** Sort order */
  sort: SortValue;
  /** View mode */
  view: ViewMode;
  /** Current page (1-indexed) */
  page: number;
}

// ─── Defaults ────────────────────────────────────────────────

export const DEFAULT_FILTERS: CategoryFiltersState = {
  subcats: [],
  priceMin: null,
  priceMax: null,
  ratingMin: null,
  inStock: false,
  sort: "relevance",
  view: "grid",
  page: 1,
};

// ─── Parser: URL → State ─────────────────────────────────────

function parseIntOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseFloatOrNull(value: string | null): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Parse search params (from Next.js page props) into a typed filter state.
 * Handles both `ReadonlyURLSearchParams` and plain `Record<string, string | string[]>`.
 */
export function parseCategorySearchParams(
  searchParams: Record<string, string | string[] | undefined>
): CategoryFiltersState {
  const get = (key: string): string | null => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0] || null;
    return val ?? null;
  };

  const subcatsRaw = get("subcats");
  const subcats = subcatsRaw
    ? subcatsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const sortRaw = get("sort");
  const sort: SortValue = SORT_VALUES.includes(sortRaw as SortValue)
    ? (sortRaw as SortValue)
    : DEFAULT_FILTERS.sort;

  const viewRaw = get("view");
  const view: ViewMode =
    viewRaw === "list" ? "list" : viewRaw === "grid" ? "grid" : DEFAULT_FILTERS.view;

  const page = parseIntOrNull(get("page")) || DEFAULT_FILTERS.page;

  return {
    subcats,
    priceMin: parseFloatOrNull(get("price_min")),
    priceMax: parseFloatOrNull(get("price_max")),
    ratingMin: parseIntOrNull(get("rating_min")),
    inStock: get("in_stock") === "1",
    sort,
    view,
    page: Math.max(1, page),
  };
}

// ─── Serializer: State → URL Search Params ───────────────────

/**
 * Serialize filter state to URLSearchParams.
 * Omits defaults for clean/canonical URLs.
 * Params are always in stable alphabetical order.
 */
export function serializeCategoryFilters(
  state: CategoryFiltersState
): URLSearchParams {
  const params = new URLSearchParams();

  // Alphabetical order for canonical URLs
  if (state.inStock) {
    params.set("in_stock", "1");
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  if (state.priceMax !== null) {
    params.set("price_max", String(state.priceMax));
  }

  if (state.priceMin !== null) {
    params.set("price_min", String(state.priceMin));
  }

  if (state.ratingMin !== null) {
    params.set("rating_min", String(state.ratingMin));
  }

  if (state.sort !== DEFAULT_FILTERS.sort) {
    params.set("sort", state.sort);
  }

  if (state.subcats.length > 0) {
    params.set("subcats", state.subcats.sort().join(","));
  }

  if (state.view !== DEFAULT_FILTERS.view) {
    params.set("view", state.view);
  }

  return params;
}

/**
 * Build the full pathname + search string for URL navigation.
 * Returns just the search portion (e.g. "?subcats=fruits&page=2" or "").
 */
export function buildCategorySearchString(
  state: CategoryFiltersState
): string {
  const params = serializeCategoryFilters(state);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ─── Backend Query Builder ───────────────────────────────────

/**
 * Build the query params for the backend API call.
 * Maps frontend filter names to backend field names.
 */
export function buildBackendQueryParams(
  categorySlug: string,
  state: CategoryFiltersState,
  perPage = 24
): Record<string, string | number | boolean | undefined> {
  return {
    category_slug: categorySlug,
    subcategory_slugs: state.subcats.length > 0 ? state.subcats.join(",") : undefined,
    min_price: state.priceMin ?? undefined,
    max_price: state.priceMax ?? undefined,
    rating_min: state.ratingMin ?? undefined,
    in_stock: state.inStock ? 1 : undefined,
    sort: state.sort,
    page: state.page,
    per_page: perPage,
  };
}

// ─── Equality check ──────────────────────────────────────────

/** Check if two filter states are equal (for debounce/memoization) */
export function filtersAreEqual(
  a: CategoryFiltersState,
  b: CategoryFiltersState
): boolean {
  return (
    a.sort === b.sort &&
    a.view === b.view &&
    a.page === b.page &&
    a.inStock === b.inStock &&
    a.priceMin === b.priceMin &&
    a.priceMax === b.priceMax &&
    a.ratingMin === b.ratingMin &&
    a.subcats.length === b.subcats.length &&
    a.subcats.every((s, i) => b.subcats[i] === s)
  );
}

/** Count of active (non-default) filters */
export function countActiveFilters(state: CategoryFiltersState): number {
  let count = 0;
  if (state.subcats.length > 0) count += state.subcats.length;
  if (state.priceMin !== null || state.priceMax !== null) count++;
  if (state.ratingMin !== null) count++;
  if (state.inStock) count++;
  return count;
}
