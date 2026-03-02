/**
 * Search Query State — parse/serialize for URL ↔ state.
 *
 * DRY: single parse, single serialize.
 * SEO-stable: canonical ordering, empty params stripped, page=1 omitted.
 */

import type { SearchQueryState, SortValue, ViewMode } from "../api/search.types";
import { SORT_VALUES } from "../api/search.types";

// ─── Constants ───────────────────────────────────────────────

const MAX_QUERY_LENGTH = 200;
const MAX_PAGE = 500;

/** Default state — used when a param is missing */
export const DEFAULT_SEARCH_STATE: SearchQueryState = {
  q: "",
  categories: [],
  price_min: null,
  price_max: null,
  rating_min: null,
  in_stock: false,
  sort: "relevance",
  view: "grid",
  page: 1,
};

// ─── Sanitize ────────────────────────────────────────────────

/**
 * Sanitize a search query string:
 * - trim whitespace
 * - collapse multiple spaces
 * - remove control characters
 * - cap length
 */
export function sanitizeQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // remove control chars
    .replace(/\s+/g, " ")            // collapse whitespace
    .slice(0, MAX_QUERY_LENGTH);
}

// ─── Parse from URLSearchParams ──────────────────────────────

/**
 * Parse search params from Next.js searchParams into typed SearchQueryState.
 * Every invalid value falls back to the default.
 */
export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): SearchQueryState {
  // q
  const rawQ = typeof params.q === "string" ? params.q : "";
  const q = sanitizeQuery(rawQ);

  // categories (comma-separated)
  const rawCat = typeof params.categories === "string" ? params.categories : "";
  const categories = rawCat
    ? rawCat.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // price_min / price_max
  const price_min = parsePositiveInt(params.price_min);
  const price_max = parsePositiveInt(params.price_max);

  // rating_min (1-5)
  const rawRating = parsePositiveInt(params.rating_min);
  const rating_min =
    rawRating !== null && rawRating >= 1 && rawRating <= 5
      ? rawRating
      : null;

  // in_stock
  const in_stock = params.in_stock === "1" || params.in_stock === "true";

  // sort
  const rawSort = typeof params.sort === "string" ? params.sort : "";
  const sort: SortValue = (SORT_VALUES as readonly string[]).includes(rawSort)
    ? (rawSort as SortValue)
    : "relevance";

  // view
  const rawView = typeof params.view === "string" ? params.view : "";
  const view: ViewMode = rawView === "list" ? "list" : "grid";

  // page
  const rawPage = parsePositiveInt(params.page);
  const page =
    rawPage !== null && rawPage >= 1 && rawPage <= MAX_PAGE ? rawPage : 1;

  return { q, categories, price_min, price_max, rating_min, in_stock, sort, view, page };
}

// ─── Serialize to URLSearchParams ────────────────────────────

/**
 * Serialize SearchQueryState into URLSearchParams with:
 * - stable alphabetical key order
 * - page=1 omitted (canonical)
 * - empty/default values omitted
 */
export function serializeSearchState(state: SearchQueryState): URLSearchParams {
  const entries: [string, string][] = [];

  // categories
  if (state.categories.length > 0) {
    entries.push(["categories", state.categories.join(",")]);
  }

  // in_stock
  if (state.in_stock) {
    entries.push(["in_stock", "1"]);
  }

  // page (omit page=1)
  if (state.page > 1) {
    entries.push(["page", String(state.page)]);
  }

  // price_max
  if (state.price_max !== null) {
    entries.push(["price_max", String(state.price_max)]);
  }

  // price_min
  if (state.price_min !== null) {
    entries.push(["price_min", String(state.price_min)]);
  }

  // q
  if (state.q) {
    entries.push(["q", state.q]);
  }

  // rating_min
  if (state.rating_min !== null) {
    entries.push(["rating_min", String(state.rating_min)]);
  }

  // sort (omit default)
  if (state.sort !== "relevance") {
    entries.push(["sort", state.sort]);
  }

  // view (omit default)
  if (state.view !== "grid") {
    entries.push(["view", state.view]);
  }

  // Sort alphabetically for canonical URL
  entries.sort(([a], [b]) => a.localeCompare(b));

  return new URLSearchParams(entries);
}

/**
 * Build a canonical search path string (for Next.js navigation).
 * @example "/search?q=fruits&sort=price_asc"
 */
export function buildSearchPath(state: SearchQueryState): string {
  const params = serializeSearchState(state);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

// ─── Helpers ─────────────────────────────────────────────────

function parsePositiveInt(
  value: string | string[] | undefined
): number | null {
  if (typeof value !== "string") return null;
  const num = parseInt(value, 10);
  return Number.isFinite(num) && num >= 0 ? num : null;
}
