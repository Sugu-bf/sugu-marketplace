import type { ProductListItem } from "@/features/product";
import type { RelatedSearch, PriceRange } from "../models/search";
import type { SearchRepository } from "../repositories/search-repository";
import {
  getMockSearchProducts,
  getMockRelatedSearches,
  getMockPriceRanges,
  getMockFilterCategories,
  getMockSearchResultsCount,
} from "../mocks/search";

/**
 * Mock implementation of SearchRepository.
 * Returns static fixture data — no network calls.
 */
export class MockSearchService implements SearchRepository {
  async search(query: string, count?: number): Promise<ProductListItem[]> {
    return getMockSearchProducts(query, count);
  }

  async getRelatedSearches(_query: string): Promise<RelatedSearch[]> {
    return getMockRelatedSearches();
  }

  async getPriceRanges(): Promise<PriceRange[]> {
    return getMockPriceRanges();
  }

  async getFilterCategories(): Promise<{ slug: string; name: string; count: number }[]> {
    return getMockFilterCategories();
  }

  async getResultsCount(_query: string): Promise<number> {
    return getMockSearchResultsCount();
  }
}
