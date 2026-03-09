/**
 * Search Feature — Zod Schemas
 *
 * Runtime validation for search API response data.
 * Matches the WebProductController.public() response shape exactly.
 */

import { z } from "zod";

// ─── Product Store (embedded) ────────────────────────────────

const ApiProductStoreSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
  name: z.string(),
  slug: z.string().default("").optional(),
});

// ─── Product Category (embedded) ─────────────────────────────

const ApiProductCategorySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).optional(),
  name: z.string(),
  slug: z.string().optional(),
});

// ─── Product Item ────────────────────────────────────────────

const ApiProductItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  slug: z.string(),
  short_description: z.string().nullable().optional(),
  price: z.number(),
  compare_price: z.number().nullable().optional(),
  sale_price: z.number().nullable().optional(),
  currency: z.string().default("XOF"),
  thumbnail: z.string().nullable().optional(),
  avg_rating: z.number().default(0),
  review_count: z.number().default(0),
  total_stock: z.number().default(0),
  sales_count: z.number().default(0),
  discount_percent: z.number().nullable().optional(),
  /** Typesense highlight with <mark> tags (search only) */
  highlight_name: z.string().optional(),
  store: ApiProductStoreSchema.nullable().optional(),
  primary_category: ApiProductCategorySchema.nullable().optional(),
});

// ─── Pagination ──────────────────────────────────────────────

const ApiSearchPaginationSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  from: z.number().nullable(),
  to: z.number().nullable(),
});

// ─── Facet Value ─────────────────────────────────────────────

const ApiFacetValueSchema = z.object({
  value: z.string(),
  count: z.number(),
  label: z.string().optional(),
});

const ApiFacetsSchema = z.record(
  z.string(),
  z.array(ApiFacetValueSchema)
).optional();

// ─── Full Search Response ────────────────────────────────────

export const SearchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    products: z.array(ApiProductItemSchema),
    pagination: ApiSearchPaginationSchema,
    /** Typesense native facets (category_name, brand_name, price) */
    facets: ApiFacetsSchema,
    filters_applied: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type SearchResponseData = z.infer<typeof SearchResponseSchema>;

// ─── Re-export sub-schemas for testing ───────────────────────

export {
  ApiProductItemSchema,
  ApiProductStoreSchema,
  ApiProductCategorySchema,
  ApiSearchPaginationSchema,
};
