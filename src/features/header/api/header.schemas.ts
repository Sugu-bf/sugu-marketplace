/**
 * Header API Schemas — Zod validation for header-related endpoints.
 *
 * Covers: categories tree, cart preview, wishlist preview, popular searches.
 * All schemas match the actual Laravel backend response shapes.
 */

import { z } from "zod";

// ─── Category Schemas ────────────────────────────────────────

export const HeaderSubCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string().nullable().optional(),
  product_count: z.number().optional(),
});

export const HeaderCategorySchema: z.ZodType<HeaderCategory> = z.lazy(() =>
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
    children: z.array(HeaderCategorySchema).optional(),
  })
);

export const CategoriesTreeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    categories: z.array(HeaderCategorySchema),
  }),
});

// ─── Cart Preview Schemas ────────────────────────────────────

export const CartPreviewItemSchema = z.object({
  id: z.number(),
  product_id: z.string().or(z.number()),
  variant_id: z.string().or(z.number()).nullable(),
  qty: z.number(),
  unit_price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  line_total: z.number(),
  name: z.string(),
  variant_title: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  product_slug: z.string().nullable().optional(),
  currency: z.string().optional(),
  flags: z
    .object({
      price_changed: z.boolean().optional(),
      stock_limited: z.boolean().optional(),
      unavailable: z.boolean().optional(),
      bulk_price: z.boolean().optional(),
    })
    .optional(),
});

export const CartPreviewTotalsSchema = z.object({
  subtotal: z.number(),
  shipping: z.number().optional(),
  discount: z.number().optional(),
  total: z.number(),
  item_count: z.number(),
  qty_total: z.number(),
});

export const CartPreviewResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(CartPreviewItemSchema),
    totals: CartPreviewTotalsSchema,
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
  warnings: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const CartCountResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    qty_total: z.number(),
    item_count: z.number(),
  }),
});

// ─── Wishlist Preview Schemas ────────────────────────────────

export const WishlistPreviewItemSchema = z.object({
  id: z.number(),
  product_id: z.string().or(z.number()),
  variant_id: z.string().or(z.number()).nullable(),
  name: z.string(),
  variant_title: z.string().nullable().optional(),
  product_slug: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  currency: z.string().optional(),
  available: z.boolean().optional(),
  in_stock: z.boolean().optional(),
  added_at: z.string().nullable().optional(),
});

export const WishlistPreviewResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(WishlistPreviewItemSchema),
  }),
  meta: z
    .object({
      wishlist_id: z.union([z.string(), z.number()]).optional(),
      count: z.number(),
    })
    .optional(),
});

export const WishlistCountResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    count: z.number(),
  }),
});

// ─── Derived Types ───────────────────────────────────────────

export interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent_id?: string | null;
  depth?: number;
  product_count?: number;
  icon_url?: string | null;
  children?: HeaderCategory[];
}

export type CartPreviewItem = z.infer<typeof CartPreviewItemSchema>;
export type CartPreviewTotals = z.infer<typeof CartPreviewTotalsSchema>;
export type CartPreviewResponse = z.infer<typeof CartPreviewResponseSchema>;
export type CartCountData = z.infer<typeof CartCountResponseSchema>;

export type WishlistPreviewItem = z.infer<typeof WishlistPreviewItemSchema>;
export type WishlistPreviewResponse = z.infer<typeof WishlistPreviewResponseSchema>;
export type WishlistCountData = z.infer<typeof WishlistCountResponseSchema>;
