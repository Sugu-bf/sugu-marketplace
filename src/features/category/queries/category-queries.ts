/**
 * Query functions for category listing page.
 *
 * These are the ONLY entry points the page/components should use.
 * They abstract away the data source (real API).
 */

import type { Category, Subcategory } from "../models/category";
import type { ProductListItem } from "@/features/product";
import {
  fetchCategoryDetail,
  fetchCategoryProducts,
  type ProductListingResult,
} from "../api/category-listing.api";
import {
  mapApiCategoryToCategory,
  mapApiChildrenToSubcategories,
  mapApiProductsToListItems,
} from "../api/category-listing.mappers";
import type { ApiPaginationMeta } from "../api/category-listing.schemas";
import type { CategoryFiltersState } from "../utils/category-url-state";
import { DEFAULT_FILTERS } from "../utils/category-url-state";

// ─── Existing API: Categories list (used by header/nav) ──────

export { fetchCategories, fetchFeaturedCategories } from "../api";

// ─── Category detail by slug (hero/meta) ─────────────────────

export async function queryCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const apiCategory = await fetchCategoryDetail(slug);
  if (!apiCategory) return null;
  return mapApiCategoryToCategory(apiCategory);
}

// ─── Subcategories ───────────────────────────────────────────

export async function querySubcategories(
  parentSlug: string
): Promise<Subcategory[]> {
  const apiCategory = await fetchCategoryDetail(parentSlug);
  if (!apiCategory) return [];
  return mapApiChildrenToSubcategories(apiCategory.children, parentSlug);
}

// ─── Category products with filters + pagination (SSR) ───────

export interface CategoryProductsResult {
  products: ProductListItem[];
  meta: ApiPaginationMeta;
}

export async function queryCategoryProducts(
  categorySlug: string,
  filters: CategoryFiltersState = DEFAULT_FILTERS,
  perPage = 24
): Promise<CategoryProductsResult> {
  const result: ProductListingResult = await fetchCategoryProducts(
    categorySlug,
    filters,
    perPage
  );

  return {
    products: mapApiProductsToListItems(result.products),
    meta: result.meta,
  };
}

// ─── Convenience: total product count ────────────────────────

export async function queryCategoryProductCount(
  categorySlug: string
): Promise<number> {
  const apiCategory = await fetchCategoryDetail(categorySlug);
  return apiCategory?.product_count ?? 0;
}

// ─── Full page data (parallel fetch) ─────────────────────────

export interface CategoryPageServerData {
  category: Category;
  subcategories: Subcategory[];
  products: ProductListItem[];
  meta: ApiPaginationMeta;
  totalProducts: number;
}

/**
 * Fetch all data needed for the category page in parallel.
 * Called from the RSC page component.
 */
export async function queryCategoryPageData(
  slug: string,
  filters: CategoryFiltersState = DEFAULT_FILTERS,
  perPage = 24
): Promise<CategoryPageServerData | null> {
  // Parallel fetch: category detail + products
  const [apiCategory, productsResult] = await Promise.all([
    fetchCategoryDetail(slug),
    fetchCategoryProducts(slug, filters, perPage),
  ]);

  if (!apiCategory) return null;

  return {
    category: mapApiCategoryToCategory(apiCategory),
    subcategories: mapApiChildrenToSubcategories(apiCategory.children, slug),
    products: mapApiProductsToListItems(productsResult.products),
    meta: productsResult.meta,
    totalProducts: apiCategory.product_count,
  };
}
