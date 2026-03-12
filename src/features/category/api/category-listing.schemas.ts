/**
 * Zod schemas for the Category Listing page.
 *
 * Validates API responses for:
 * - GET /api/v1/categories/{slug}   → Category detail (hero, children)
 * - GET /api/v1/web-products?...    → Paginated product listing
 */

import { z } from "zod";

// ─── Category Detail (from /api/v1/categories/{slug}) ────────

const CategoryIconSchema = z.object({
  provider: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

const CategoryChildSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  product_count: z.number().default(0),
  icon: CategoryIconSchema.optional(),
});

const CategoryParentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

export const CategoryDetailApiSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  icon: CategoryIconSchema.optional(),
  parent: CategoryParentSchema.nullable().optional(),
  children: z.array(CategoryChildSchema).default([]),
  product_count: z.number().default(0),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonical: z.string().optional(),
  }).optional(),
});

export const CategoryDetailResponseSchema = z.object({
  success: z.boolean(),
  category: CategoryDetailApiSchema,
});

// ─── Product Listing Item (from /api/v1/web-products) ────────

export const ProductListingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  compare_price: z.number().nullable().optional(),
  sale_price: z.number().nullable().optional(),
  currency: z.string().default("XOF"),
  discount_percent: z.number().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  avg_rating: z.number().default(0),
  review_count: z.number().default(0),
  total_stock: z.number().default(0),
  sales_count: z.number().default(0),
  store: z.object({
    id: z.string().optional(),
    name: z.string(),
    slug: z.string().default(""),
  }).nullable().optional(),
  primary_category: z.object({
    id: z.string().optional(),
    name: z.string(),
    slug: z.string().optional(),
  }).nullable().optional(),
  images: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    url: z.string(),
    alt: z.string().nullable().optional(),
  })).default([]),
});

// ─── Pagination Meta ─────────────────────────────────────────

export const PaginationMetaSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  from: z.number().nullable().optional(),
  to: z.number().nullable().optional(),
});

// ─── Paginated Products Response ─────────────────────────────

export const ProductListingResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    products: z.array(ProductListingItemSchema),
    pagination: PaginationMetaSchema,
    filters_applied: z.record(z.string(), z.unknown()).optional(),
  }),
});

// ─── Derived Types ───────────────────────────────────────────

export type ApiCategoryDetail = z.infer<typeof CategoryDetailApiSchema>;
export type ApiCategoryChild = z.infer<typeof CategoryChildSchema>;
export type ApiCategoryParent = z.infer<typeof CategoryParentSchema>;
export type ApiProductListingItem = z.infer<typeof ProductListingItemSchema>;
export type ApiPaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ApiProductListingResponse = z.infer<typeof ProductListingResponseSchema>;
