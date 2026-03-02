/**
 * Home API Schemas — Zod contracts aligned with actual backend responses.
 *
 * IMPORTANT: These schemas were reverse-engineered from the live API at
 * https://api.mysugu.com to match the exact JSON structure returned by
 * each endpoint. All fields use .optional()/.nullable() generously to
 * tolerate missing data gracefully.
 */

import { z } from "zod";

// ─── Shared nested objects ───────────────────────────────────

/** Image object returned by most API resources */
const ApiImageSchema = z.object({
  url: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
}).nullable().optional();

/** Icon object used by categories */
const ApiIconSchema = z.object({
  provider: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
}).nullable().optional();

/** Pricing object used across products */
const ApiPricingSchema = z.object({
  currency: z.string().optional(),
  price: z.number().nullable().optional(),
  compare_at_price: z.number().nullable().optional(),
  formatted: z.string().nullable().optional(),
  formatted_compare: z.string().nullable().optional(),
  unit_label: z.string().nullable().optional(),
}).nullable().optional();

/** Rating object used across products */
const ApiRatingSchema = z.object({
  avg: z.number().nullable().optional(),
  count: z.number().nullable().optional(),
}).nullable().optional();

/** Store object */
const ApiStoreSchema = z.object({
  id: z.union([z.string(), z.number()]).nullable().optional(),
  name: z.string().nullable().optional(),
}).nullable().optional();

/** Category ref object */
const ApiCategoryRefSchema = z.object({
  slug: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
}).nullable().optional();

/** Countdown object */
const ApiCountdownSchema = z.object({
  ends_at: z.string().nullable().optional(),
  server_now: z.string().nullable().optional(),
}).nullable().optional();

// ─── Banner Slot API ─────────────────────────────────────────

export const ApiBannerItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  cta_label: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
  media: ApiImageSchema,
  price: z.number().nullable().optional(),
  title_highlight: z.string().nullable().optional(),
  bg_color: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

export const BannerSlotResponseSchema = z.object({
  slot: z.object({
    key: z.string(),
    max_items: z.number(),
    rotation_mode: z.string(),
    aspect_ratio: z.string().nullable().optional(),
  }),
  items: z.array(ApiBannerItemSchema),
  meta: z.object({
    cache_ttl: z.number().optional(),
  }),
});

// ─── Categories API ──────────────────────────────────────────

export const ApiCategorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  icon: ApiIconSchema,
  parent_id: z.union([z.string(), z.number()]).nullable().optional(),
  depth: z.number().optional(),
  product_count: z.number().optional(),
  // Use passthrough for children to avoid self-referencing type issue
}).passthrough();

export const CategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    categories: z.array(ApiCategorySchema),
  }),
});

// ─── Home Brands API ─────────────────────────────────────────

export const ApiBrandLogoSchema = z.object({
  url: z.string(),
  alt: z.string().optional(),
});

export const ApiBrandSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  logo: ApiBrandLogoSchema.nullable().optional(),
  position: z.number().optional(),
});

export const BrandsResponseSchema = z.object({
  items: z.array(ApiBrandSchema),
  meta: z.object({
    limit: z.number(),
    count: z.number(),
  }),
});

// ─── Home Recommended API ────────────────────────────────────

export const ApiRecommendedTabSchema = z.object({
  label: z.string(),
  slug: z.string(),
});

/**
 * Recommended product item — actual shape from API:
 * { id, slug, name, image: {url, alt}, store: {id, name},
 *   pricing: {price, compare_at_price, ...}, rating: {avg, count},
 *   category: {slug, name}, in_stock, badges[] }
 */
export const ApiRecommendedProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional().default(""),
  name: z.string(),
  image: ApiImageSchema,
  store: ApiStoreSchema,
  pricing: ApiPricingSchema,
  rating: ApiRatingSchema,
  category: ApiCategoryRefSchema,
  in_stock: z.boolean().optional(),
  badges: z.array(z.string()).optional(),
});

export const RecommendedResponseSchema = z.object({
  success: z.boolean(),
  tabs: z.array(ApiRecommendedTabSchema),
  items: z.array(ApiRecommendedProductSchema),
  meta: z.object({
    limit: z.number(),
    count: z.number(),
    category: z.string(),
  }),
});

// ─── Home Hot Deals API ──────────────────────────────────────

export const ApiHotDealBannerSchema = z.object({
  badge_label: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  cta_label: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  thumb_url: z.string().nullable().optional(),
});

/**
 * Hot deal item — actual shape from API:
 * { deal_id, sold_qty, total_qty, ends_at,
 *   product: {id, slug, name, image: {url, alt}},
 *   store: {id, name}, pricing: {...}, rating: {...}, in_stock }
 */
export const ApiHotDealItemSchema = z.object({
  deal_id: z.union([z.string(), z.number()]).optional(),
  sold_qty: z.number().optional().default(0),
  total_qty: z.number().optional().default(0),
  ends_at: z.string().nullable().optional(),
  product: z.object({
    id: z.union([z.string(), z.number()]),
    slug: z.string().optional().default(""),
    name: z.string(),
    image: ApiImageSchema,
  }),
  store: ApiStoreSchema,
  pricing: ApiPricingSchema,
  rating: ApiRatingSchema,
  in_stock: z.boolean().optional(),
});

export const HotDealsResponseSchema = z.object({
  success: z.boolean(),
  banner: ApiHotDealBannerSchema.nullable().optional(),
  countdown: ApiCountdownSchema.nullable().optional(),
  items: z.array(ApiHotDealItemSchema),
  meta: z.object({
    limit: z.number(),
    count: z.number(),
  }),
});

// ─── Home Product Lists API ──────────────────────────────────

/**
 * Product lists item — actual shape from API:
 * { id, slug, name, image: {url, alt}, pricing: {...}, rating: {...}, in_stock }
 */
export const ApiProductListItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional().default(""),
  name: z.string(),
  image: ApiImageSchema,
  pricing: ApiPricingSchema,
  rating: ApiRatingSchema,
  in_stock: z.boolean().optional(),
});

export const ApiProductListSchema = z.object({
  title: z.string(),
  items: z.array(ApiProductListItemSchema),
});

/**
 * Deal of week product — has extended fields beyond the base item
 */
export const ApiDealOfWeekProductSchema = ApiProductListItemSchema.extend({
  short_note: z.string().nullable().optional(),
  stock: z.object({
    sold_qty: z.number().optional().default(0),
    total_qty: z.number().optional().default(0),
    progress: z.number().optional().default(0),
  }).nullable().optional(),
  deal_label: z.string().nullable().optional(),
  deal_price: z.number().nullable().optional(),
});

export const ApiDealOfWeekSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  product: ApiDealOfWeekProductSchema.nullable().optional(),
  countdown: ApiCountdownSchema.nullable().optional(),
});

export const ProductListsResponseSchema = z.object({
  success: z.boolean(),
  lists: z.object({
    featured: ApiProductListSchema,
    top_selling: ApiProductListSchema,
    on_sale: ApiProductListSchema,
  }),
  deal_of_week: ApiDealOfWeekSchema.nullable().optional(),
  meta: z.object({
    limit: z.number(),
  }),
});

// ─── Home Daily Best Sells API ───────────────────────────────

/**
 * Daily best sell item — actual shape from API:
 * { deal_id, discount_percent, countdown, sold_qty, total_qty,
 *   product: {id, slug, name, image:{url,alt}},
 *   store: {id, name}, pricing: {price, compare_at_price, unit_label, formatted,...},
 *   rating: {avg, count}, in_stock }
 */
export const ApiDailyBestSellItemSchema = z.object({
  deal_id: z.union([z.string(), z.number()]).optional(),
  discount_percent: z.number().nullable().optional(),
  countdown: z.unknown().nullable().optional(),
  sold_qty: z.number().optional().default(0),
  total_qty: z.number().optional().default(0),
  product: z.object({
    id: z.union([z.string(), z.number()]),
    slug: z.string().optional().default(""),
    name: z.string(),
    image: ApiImageSchema,
  }),
  store: ApiStoreSchema,
  pricing: ApiPricingSchema,
  rating: ApiRatingSchema,
  in_stock: z.boolean().optional(),
});

export const ApiPromoBannerSchema = z.object({
  logo_url: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  expire_at: z.string().nullable().optional(),
  delivery_by_text: z.string().nullable().optional(),
  cta_label: z.string().nullable().optional(),
  cta_url: z.string().nullable().optional(),
  bg_image_url: z.string().nullable().optional(),
});

export const DailyBestSellsResponseSchema = z.object({
  success: z.boolean(),
  items: z.array(ApiDailyBestSellItemSchema),
  promo_banner: ApiPromoBannerSchema.nullable().optional(),
  meta: z.object({
    limit: z.number(),
    count: z.number(),
    server_now: z.string().optional(),
  }),
});

// ─── Cart Add Item API ───────────────────────────────────────

export const CartAddResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      items: z.array(z.unknown()),
      totals: z.unknown(),
    })
    .optional(),
  meta: z.unknown().optional(),
  warnings: z.array(z.string()).optional(),
  message: z.string().optional(),
});

// ─── Newsletter Subscribe API ────────────────────────────────

export const NewsletterSubscribeResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
});

// ─── Inferred Types ──────────────────────────────────────────

export type ApiBannerItem = z.infer<typeof ApiBannerItemSchema>;
export type ApiCategory = z.infer<typeof ApiCategorySchema>;
export type ApiBrand = z.infer<typeof ApiBrandSchema>;
export type ApiRecommendedTab = z.infer<typeof ApiRecommendedTabSchema>;
export type ApiRecommendedProduct = z.infer<typeof ApiRecommendedProductSchema>;
export type ApiHotDealItem = z.infer<typeof ApiHotDealItemSchema>;
export type ApiProductListItem = z.infer<typeof ApiProductListItemSchema>;
export type ApiDealOfWeekProduct = z.infer<typeof ApiDealOfWeekProductSchema>;
export type ApiDailyBestSellItem = z.infer<typeof ApiDailyBestSellItemSchema>;
