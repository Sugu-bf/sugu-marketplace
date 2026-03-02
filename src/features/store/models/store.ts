import { z } from "zod";

// ─── Store Category (inside the store) ──────────────────
export const StoreCategorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  slug: z.string(),
  productCount: z.number(),
  icon: z.string().optional(), // emoji ou lucide icon name
});

// ─── Store Review ───────────────────────────────────────
export const StoreReviewSchema = z.object({
  id: z.union([z.string(), z.number()]),
  author: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  date: z.string(), // "Il y a 2 jours"
});

// ─── Rating Distribution ────────────────────────────────
export const RatingDistributionSchema = z.object({
  stars5: z.number(), // pourcentage
  stars4: z.number(),
  stars3: z.number(),
  stars2: z.number(),
  stars1: z.number(),
});

// ─── Store (main model) ─────────────────────────────────
export const StoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  logoUrl: z.string(),           // URL ou initiales fallback
  coverUrl: z.string().optional(),
  location: z.string(),          // "Ouagadougou, Burkina Faso"
  memberSince: z.string(),       // "Janvier 2024"
  rating: z.number().min(0).max(5),
  reviewCount: z.number(),
  totalProducts: z.number(),
  totalSales: z.number(),
  followerCount: z.number(),
  categories: z.array(StoreCategorySchema),
  ratingDistribution: RatingDistributionSchema,
  recentReviews: z.array(StoreReviewSchema),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    hours: z.string().optional(), // "Lun-Sam: 8h-19h | Dim: Fermé"
  }),
});

// ─── Store List Item (for /stores listing page) ─────────
export const StoreListItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().optional(),
  logoInitials: z.string(),
  logoColor: z.string(),
  location: z.string(),
  memberSince: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  totalProducts: z.number(),
  totalSales: z.number(),
  isFeatured: z.boolean().default(false),
  categories: z.array(
    z.object({
      name: z.string(),
      icon: z.string().optional(),
    }),
  ),
});

// ─── Derived types ──────────────────────────────────────
export type Store = z.infer<typeof StoreSchema>;
export type StoreCategory = z.infer<typeof StoreCategorySchema>;
export type StoreReview = z.infer<typeof StoreReviewSchema>;
export type RatingDistribution = z.infer<typeof RatingDistributionSchema>;
export type StoreListItem = z.infer<typeof StoreListItemSchema>;
