import { z } from "zod";

// ─── Vendor BFF Response Schemas ─────────────────────────────
// Mirror of the enriched VendorPageService backend response.

export const VendorImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
});

export const VendorRatingSchema = z.object({
  avg: z.number(),
  count: z.number(),
});

export const VendorContactSchema = z.object({
  address_line: z.string(),
  city: z.string(),
  zip: z.string(),
  country: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const VendorCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  product_count: z.number(),
});

export const VendorProfileSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: VendorImageSchema,
  cover: VendorImageSchema,
  rating: VendorRatingSchema,
  contact: VendorContactSchema,
  created_year: z.number(),
  description: z.string(),
  is_followed: z.boolean(),
  followers_count: z.number(),
  products_count: z.number(),
  sales_count: z.number(),
  member_since: z.string(),
  location_text: z.string(),
  categories: z.array(VendorCategorySchema),
  hours: z.string().nullable().optional(),
  social_links: z.object({
    facebook: z.string().nullable(),
    instagram: z.string().nullable(),
    x: z.string().nullable(),
    linkedin: z.string().nullable(),
  }),
});

// ─── Product Card (from BFF) ─────────────────────────────────

export const ProductCardPricingSchema = z.object({
  currency: z.string(),
  price: z.number(),
  compare_at_price: z.number().nullable(),
  unit_label: z.string(),
  formatted: z.string(),
  formatted_compare: z.string().nullable(),
});

export const ProductCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  image: VendorImageSchema,
  pricing: ProductCardPricingSchema,
  rating: z.object({ avg: z.number().nullable(), count: z.number().nullable() }),
  badge: z.object({ text: z.string(), color: z.string() }).nullable(),
  sold: z.object({ qty: z.number(), total: z.number() }),
  in_stock: z.boolean(),
});

export const ProductsMetaSchema = z.object({
  total: z.number(),
  limit: z.number(),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
});

// ─── Reviews Summary ─────────────────────────────────────────

export const ReviewDistributionSchema = z.record(
  z.string(), // "5", "4", "3", "2", "1"
  z.object({ count: z.number(), percentage: z.number() }),
);

export const LatestReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string(),
  author: z.string(),
  date_human: z.string(),
});

export const ReviewsSummarySchema = z.object({
  distribution: ReviewDistributionSchema,
  latest: z.array(LatestReviewSchema),
  total: z.number(),
});

// ─── Sidebar Banner ──────────────────────────────────────────

export const SidebarBannerSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  image_url: z.string(),
  cta_label: z.string(),
  cta_url: z.string(),
  discount_percent: z.number(),
});

// ─── Full BFF Response ───────────────────────────────────────

export const VendorPageResponseSchema = z.object({
  success: z.literal(true),
  vendor: VendorProfileSchema,
  sidebar_banner: SidebarBannerSchema,
  products: z.object({
    items: z.array(ProductCardSchema),
    meta: ProductsMetaSchema,
  }),
  reviews: ReviewsSummarySchema,
});

// ─── Follow / Unfollow ───────────────────────────────────────

export const FollowResponseSchema = z.object({
  success: z.boolean(),
  is_followed: z.boolean(),
  message: z.string(),
});

// ─── Type Exports ────────────────────────────────────────────

export type VendorProfile = z.infer<typeof VendorProfileSchema>;
export type VendorCategory = z.infer<typeof VendorCategorySchema>;
export type VendorProductCard = z.infer<typeof ProductCardSchema>;
export type VendorPageResponse = z.infer<typeof VendorPageResponseSchema>;
export type ReviewsSummary = z.infer<typeof ReviewsSummarySchema>;
export type FollowResponse = z.infer<typeof FollowResponseSchema>;
export type SidebarBanner = z.infer<typeof SidebarBannerSchema>;
export type ProductsMeta = z.infer<typeof ProductsMetaSchema>;
