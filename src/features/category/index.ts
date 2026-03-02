// ─── Models ──────────────────────────────────────────────────
export { CategorySchema, SubcategorySchema, CategoryPageDataSchema } from "./models/category";
export type { Category, Subcategory, CategoryPageData } from "./models/category";

// ─── Queries ─────────────────────────────────────────────────
export {
  queryCategoryBySlug,
  querySubcategories,
  queryCategoryProducts,
  queryCategoryProductCount,
  queryCategoryPageData,
} from "./queries/category-queries";
export type {
  CategoryProductsResult,
  CategoryPageServerData,
} from "./queries/category-queries";

// ─── URL State ───────────────────────────────────────────────
export {
  parseCategorySearchParams,
  serializeCategoryFilters,
  buildCategorySearchString,
  buildBackendQueryParams,
  countActiveFilters,
  filtersAreEqual,
  DEFAULT_FILTERS,
  SORT_VALUES,
} from "./utils/category-url-state";
export type {
  CategoryFiltersState,
  SortValue,
  ViewMode,
} from "./utils/category-url-state";

// ─── API (raw, for advanced use) ─────────────────────────────
export { fetchCategoryDetail, fetchCategoryProducts } from "./api/category-listing.api";
export type { ProductListingResult } from "./api/category-listing.api";

// ─── Schemas ─────────────────────────────────────────────────
export {
  CategoryDetailApiSchema,
  CategoryDetailResponseSchema,
  ProductListingItemSchema,
  ProductListingResponseSchema,
} from "./api/category-listing.schemas";
export type {
  ApiCategoryDetail,
  ApiCategoryChild,
  ApiProductListingItem,
  ApiPaginationMeta,
} from "./api/category-listing.schemas";
