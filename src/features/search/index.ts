// ─── Models ──────────────────────────────────────────────────
export { SearchFilterSchema, SearchResultsSchema, RelatedSearchSchema, PriceRangeSchema } from "./models/search";
export type { SearchFilter, SearchResults, RelatedSearch, PriceRange } from "./models/search";

// ─── API Types ───────────────────────────────────────────────
export type {
  SearchQueryState,
  SortValue,
  ViewMode,
  SearchProductItem,
  FilterCategoryFacet,
  SearchBackendParams,
} from "./api/search.types";
export { SORT_VALUES } from "./api/search.types";

// ─── API ─────────────────────────────────────────────────────
export { fetchSearchResults, getStaticPriceRanges } from "./api/search.api";
export type { SearchResultData } from "./api/search.api";

// ─── Schemas ─────────────────────────────────────────────────
export { SearchResponseSchema } from "./api/search.schemas";

// ─── Utils ───────────────────────────────────────────────────
export {
  parseSearchParams,
  serializeSearchState,
  buildSearchPath,
  sanitizeQuery,
  DEFAULT_SEARCH_STATE,
} from "./utils/queryState";
export { buildBackendParams, SEARCH_PER_PAGE } from "./utils/buildBackendParams";

// ─── Queries (legacy compatibility) ──────────────────────────
export {
  querySearchResults,
  queryRelatedSearches,
  queryPriceRanges,
  queryFilterCategories,
  querySearchResultsCount,
} from "./queries/search-queries";
