/**
 * Category API — fetches categories from the backend.
 *
 * Endpoints consumed:
 * - GET /api/v1/categories          → All categories (tree)
 * - GET /api/v1/categories/featured → Featured categories
 * - GET /api/v1/categories/{slug}   → Category detail by slug
 */

import { z } from "zod";
import { api, v1Url, CacheTags, RevalidatePresets } from "@/lib/api";

// ─── Zod Schemas ─────────────────────────────────────────────

const ApiCategorySchema: z.ZodType<ApiCategory> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    parent_id: z.string().nullable().optional(),
    depth: z.number().optional(),
    product_count: z.number().optional(),
    icon_url: z.string().nullable().optional(),
    children: z.array(ApiCategorySchema).optional(),
  })
);

const CategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    categories: z.array(ApiCategorySchema),
  }),
});

const CategoryDetailResponseSchema = z.object({
  success: z.boolean(),
  category: ApiCategorySchema,
});

// ─── Types ───────────────────────────────────────────────────

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent_id?: string | null;
  depth?: number;
  product_count?: number;
  icon_url?: string | null;
  children?: ApiCategory[];
}

// ─── API Functions ───────────────────────────────────────────

/**
 * Fetch all categories (hierarchical tree).
 * SSR-friendly with ISR caching.
 */
export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const { data } = await api.get(v1Url("categories"), {
      schema: CategoriesResponseSchema,
      revalidate: RevalidatePresets.static,
      tags: [CacheTags.categories()],
    });
    return data.data.categories;
  } catch (error) {
    console.error("[Categories] Failed to fetch categories:", (error as Error).message);
    return [];
  }
}

/**
 * Fetch featured categories for the category bar.
 */
export async function fetchFeaturedCategories(): Promise<ApiCategory[]> {
  try {
    const { data } = await api.get(v1Url("categories/featured"), {
      schema: CategoriesResponseSchema,
      revalidate: RevalidatePresets.static,
      tags: [CacheTags.categories()],
    });
    return data.data.categories;
  } catch (error) {
    console.error("[Categories] Failed to fetch featured categories:", (error as Error).message);
    return [];
  }
}

/**
 * Fetch a single category by slug.
 */
export async function fetchCategoryBySlug(slug: string): Promise<ApiCategory | null> {
  try {
    const { data } = await api.get(v1Url(`categories/${encodeURIComponent(slug)}`), {
      schema: CategoryDetailResponseSchema,
      revalidate: RevalidatePresets.standard,
      tags: [CacheTags.categories()],
    });
    return data.category;
  } catch (error) {
    console.error(`[Categories] Failed to fetch category "${slug}":`, (error as Error).message);
    return null;
  }
}
