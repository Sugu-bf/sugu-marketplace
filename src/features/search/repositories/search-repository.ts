import type { ProductListItem } from "@/features/product";
import type { RelatedSearch, PriceRange } from "../models/search";

/**
 * SearchRepository interface — contract for all search data access.
 * Implementations: MockSearchService (now), ApiSearchService (later).
 */
export interface SearchRepository {
  search(query: string, count?: number): Promise<ProductListItem[]>;
  getRelatedSearches(query: string): Promise<RelatedSearch[]>;
  getPriceRanges(): Promise<PriceRange[]>;
  getFilterCategories(): Promise<{ slug: string; name: string; count: number }[]>;
  getResultsCount(query: string): Promise<number>;
}
