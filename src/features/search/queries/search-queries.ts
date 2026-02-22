import { MockSearchService } from "../services/search-service";
import type { ProductListItem } from "@/features/product";
import type { RelatedSearch, PriceRange } from "../models/search";

/**
 * Query functions for search data.
 * These are the ONLY entry points components should use to access search data.
 * They abstract away the data source (mock now, API later).
 */

const searchService = new MockSearchService();

export async function querySearchResults(
  query: string,
  count?: number
): Promise<ProductListItem[]> {
  return searchService.search(query, count);
}

export async function queryRelatedSearches(
  query: string
): Promise<RelatedSearch[]> {
  return searchService.getRelatedSearches(query);
}

export async function queryPriceRanges(): Promise<PriceRange[]> {
  return searchService.getPriceRanges();
}

export async function queryFilterCategories(): Promise<
  { slug: string; name: string; count: number }[]
> {
  return searchService.getFilterCategories();
}

export async function querySearchResultsCount(query: string): Promise<number> {
  return searchService.getResultsCount(query);
}
