import { z } from "zod";

// ─── Search Schemas ─────────────────────────────────────────

export const SearchFilterSchema = z.object({
  categories: z.array(z.string()).default([]),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(["relevance", "price-asc", "price-desc", "rating", "newest", "best-seller"]).default("relevance"),
});

export const SearchResultsSchema = z.object({
  query: z.string(),
  totalResults: z.number().nonnegative(),
  currentPage: z.number().positive(),
  totalPages: z.number().nonnegative(),
  filters: SearchFilterSchema,
});

export const RelatedSearchSchema = z.object({
  label: z.string(),
  query: z.string(),
});

export const PriceRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  label: z.string(),
});

// ─── Derived Types ───────────────────────────────────────────

export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type RelatedSearch = z.infer<typeof RelatedSearchSchema>;
export type PriceRange = z.infer<typeof PriceRangeSchema>;
