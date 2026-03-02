import { z } from "zod";

// ─── Banner Schemas ──────────────────────────────────────────

export const BannerSlideSchema = z.object({
  id: z.number(),
  image: z.string(),
  alt: z.string(),
  href: z.string().optional(),
});

export const HeroBannerSchema = z.object({
  image: z.string(),
  alt: z.string(),
  href: z.string().optional(),
});

// ─── Category Bar (emoji pills) ─────────────────────────────

export const CategoryPillSchema = z.object({
  name: z.string(),
  emoji: z.string(),
  slug: z.string().optional(),
});

// ─── Fresh Category Cards ────────────────────────────────────

export const FreshCategorySchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  price: z.number().optional(),
  image: z.string(),
  bgColor: z.string(),
  href: z.string().optional(),
});

// ─── Promotional Deals ───────────────────────────────────────

export const CountdownSchema = z.object({
  days: z.number(),
  hours: z.number(),
  minutes: z.number(),
  seconds: z.number(),
});

export const PromotionalDealSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  image: z.string(),
  variant: z.enum(["light", "dark"]),
  countdown: CountdownSchema,
  href: z.string().optional(),
});

// ─── Brand ───────────────────────────────────────────────────

export const BrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string(),
  href: z.string().optional(),
});

// ─── Trust Badge ─────────────────────────────────────────────

export const TrustBadgeSchema = z.object({
  iconName: z.enum(["truck", "award", "shield-check", "headphones"]),
  title: z.string(),
  subtitle: z.string(),
});

// ─── Deals of the Day sidebar card ──────────────────────────

export const DailyDealCardSchema = z.object({
  category: z.string(),
  title: z.string(),
  subtitle: z.string(),
  expiry: z.string(),
  image: z.string(),
  href: z.string().optional(),
});

// ─── Daily Best Sale product (horizontal card) ──────────────

export const DailyBestSaleProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional(),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number(),
  rating: z.number(),
  reviews: z.number(),
  store: z.string(),
  soldCount: z.number(),
  totalStock: z.number(),
  promoPercent: z.number().optional(),
  image: z.string().optional(),
});

// ─── Weekly Deal (featured single product) ──────────────────

export const WeeklyDealSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional(),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  rating: z.number(),
  reviews: z.number(),
  image: z.string().optional(),
});

// ─── Product Column (Produits Vedettes, etc.) ───────────────

export const ProductColumnItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string().optional(),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  rating: z.number(),
  reviews: z.number(),
  image: z.string().optional(),
});

// ─── Tags ────────────────────────────────────────────────────

export const TagSchema = z.object({
  label: z.string(),
  slug: z.string().optional(),
});

// ─── Derived Types ───────────────────────────────────────────

export type BannerSlide = z.infer<typeof BannerSlideSchema>;
export type HeroBanner = z.infer<typeof HeroBannerSchema>;
export type CategoryPill = z.infer<typeof CategoryPillSchema>;
export type FreshCategory = z.infer<typeof FreshCategorySchema>;
export type Countdown = z.infer<typeof CountdownSchema>;
export type PromotionalDeal = z.infer<typeof PromotionalDealSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type TrustBadge = z.infer<typeof TrustBadgeSchema>;
export type DailyDealCard = z.infer<typeof DailyDealCardSchema>;
export type DailyBestSaleProduct = z.infer<typeof DailyBestSaleProductSchema>;
export type WeeklyDeal = z.infer<typeof WeeklyDealSchema>;
export type ProductColumnItem = z.infer<typeof ProductColumnItemSchema>;
export type Tag = z.infer<typeof TagSchema>;
