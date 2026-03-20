/**
 * Product Detail — Zod Schemas matching the real Laravel API response.
 *
 * Source of truth: App\Services\Products\ProductDetailService
 *
 * RULE: Every field here exists in the backend response.
 * We never invent fields — we only validate what the API sends.
 */

import { z } from "zod";

// ─── Shared sub-schemas ──────────────────────────────────────

export const ApiImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional().default(""),
});

export const ApiBrandSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  slug: z.string(),
});

export const ApiCategorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  slug: z.string(),
});

export const ApiPricingSchema = z.object({
  currency: z.string(),
  price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  discount_percent: z.number().default(0),
  unit_label: z.string().optional().default("/Qty"),
  formatted: z.string(),
  formatted_compare: z.string().nullable().optional(),
  promo_ends_at: z.string().nullable().optional(),
});

export const ApiBulkPriceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  minQty: z.number(),
  price: z.number(),
  currency: z.string().default("XOF"),
  isActive: z.boolean().default(true),
});

export const ApiStockSchema = z.object({
  in_stock: z.boolean(),
  quantity_available: z.number(),
  low_stock: z.boolean().default(false),
});

export const ApiOptionValueSchema = z.object({
  id: z.union([z.string(), z.number()]),
  label: z.string(),
});

export const ApiOptionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  values: z.array(ApiOptionValueSchema),
});

export const ApiVariantPricingSchema = z.object({
  price: z.number(),
  compare_at_price: z.number().nullable().optional(),
  formatted: z.string(),
  formatted_compare: z.string().nullable().optional(),
});

export const ApiVariantStockSchema = z.object({
  in_stock: z.boolean(),
  quantity: z.number(),
});

/**
 * Normalize PHP's option_values which can be:
 * - `{}` → valid Record (when associative array has entries)
 * - `[]` → empty JSON array (PHP's empty associative array serializes as [])
 * - `{"Poids":"500g"}` → valid Record
 *
 * We always normalize to Record<string, string>.
 */
const OptionValuesSchema = z.preprocess(
  (val) => (Array.isArray(val) ? {} : val ?? {}),
  z.record(z.string(), z.string()).default({})
);

export const ApiVariantSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sku: z.string().default(""),
  option_values: OptionValuesSchema,
  pricing: ApiVariantPricingSchema,
  stock: ApiVariantStockSchema,
  image_url: z.string().nullable().optional(),
});

export const ApiSellerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().nullable().optional(),
  rating: z.object({
    avg: z.number(),
    count: z.number(),
  }),
});

export const ApiShippingFeesSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  label: z.string(),
});

export const ApiShippingSchema = z.object({
  deliverable: z.boolean().optional().default(true),
  estimated_time: z.string().optional().default("24-72h"),
  fees: ApiShippingFeesSchema.optional(),
});

export const ApiRatingSchema = z.object({
  avg: z.number(),
  count: z.number(),
  distribution: z.array(z.number()).optional().default([0, 0, 0, 0, 0]),
});

export const ApiSeoSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonical: z.string(),
  /** Optional Facebook catalogue data returned by buildSeo() in ProductDetailService */
  facebook: z
    .object({
      item_id: z.string(),
      condition: z.string().default("new"),
      availability: z.string(),
    })
    .optional(),
});

export const ApiMediaSchema = z.object({
  images: z.array(ApiImageSchema),
  video_url: z.string().nullable().optional(),
});

// ─── Main Product Detail Schema ──────────────────────────────

export const ApiProductDetailSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  sku: z.string().default(""),
  brand: ApiBrandSchema.nullable().optional(),
  category: ApiCategorySchema.nullable().optional(),
  short_description: z.string().default(""),
  description_html: z.string().default(""),
  media: ApiMediaSchema,
  pricing: ApiPricingSchema,
  bulkPrices: z.array(ApiBulkPriceSchema).default([]),
  stock: ApiStockSchema,
  options: z.array(ApiOptionSchema).default([]),
  variants: z.array(ApiVariantSchema).default([]),
  default_variant_id: z.union([z.string(), z.number()]).nullable().optional(),
  seller: ApiSellerSchema.nullable().optional(),
  shipping: ApiShippingSchema.optional(),
  rating: ApiRatingSchema,
  seo: ApiSeoSchema.optional(),
});

// ─── API Response Wrappers ───────────────────────────────────

export const ProductDetailResponseSchema = z.object({
  success: z.literal(true),
  product: ApiProductDetailSchema,
});

// ─── Related Products ────────────────────────────────────────

export const ApiRelatedProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  image: ApiImageSchema,
  pricing: ApiPricingSchema.extend({
    unit_label: z.string().optional().default("/Qty"),
  }),
  rating: z.object({
    avg: z.number(),
    count: z.number(),
  }),
  in_stock: z.boolean(),
  seller: z.object({
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
});

export const RelatedProductsResponseSchema = z.object({
  success: z.literal(true),
  items: z.array(ApiRelatedProductSchema),
});

// ─── Reviews ─────────────────────────────────────────────────

export const ApiReviewSchema = z.object({
  id: z.union([z.string(), z.number()]),
  rating: z.number(),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  is_verified_purchase: z.boolean().default(false),
  helpful_count: z.number().default(0),
  author: z.string(),
  images: z.array(z.string()).default([]),
  created_at: z.string().nullable().optional(),
});

export const ReviewsResponseSchema = z.object({
  success: z.literal(true),
  reviews: z.array(ApiReviewSchema),
  meta: z.object({
    total: z.number(),
    limit: z.number(),
    next_cursor: z.union([z.string(), z.number()]).nullable(),
    has_more: z.boolean(),
  }),
});

// ─── Cart Actions ────────────────────────────────────────────

export const CartItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  variant_id: z.union([z.string(), z.number()]),
  product_name: z.string().optional(),
  qty: z.number(),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  image_url: z.string().nullable().optional(),
}).passthrough(); // allow extra fields from backend

export const CartTotalsSchema = z.object({
  subtotal: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
}).passthrough();

export const CartResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(CartItemSchema),
    totals: CartTotalsSchema,
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
  warnings: z.array(z.string()).default([]),
});

export const CartCountResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    qty_total: z.number(),
    item_count: z.number(),
  }),
});

// ─── Wishlist Actions ────────────────────────────────────────

export const WishlistItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  variant_id: z.union([z.string(), z.number()]).optional(),
  product_id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const WishlistResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(WishlistItemSchema),
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// ─── Derived Types ───────────────────────────────────────────

export type ApiProductDetail = z.infer<typeof ApiProductDetailSchema>;
export type ApiRelatedProduct = z.infer<typeof ApiRelatedProductSchema>;
export type ApiReview = z.infer<typeof ApiReviewSchema>;
export type ApiPricing = z.infer<typeof ApiPricingSchema>;
export type ApiVariant = z.infer<typeof ApiVariantSchema>;
export type ApiOption = z.infer<typeof ApiOptionSchema>;
export type ApiBulkPrice = z.infer<typeof ApiBulkPriceSchema>;
export type ApiStock = z.infer<typeof ApiStockSchema>;
export type ApiSeller = z.infer<typeof ApiSellerSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;
