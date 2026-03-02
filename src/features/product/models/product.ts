import { z } from "zod";
import { CURRENCY } from "@/lib/constants";

// ─── Product Schemas ─────────────────────────────────────────

export const ProductImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  alt: z.string(),
});

export const BulkPriceTierSchema = z.object({
  minQty: z.number().positive(),
  maxQty: z.number().positive().optional(), // undefined = no upper limit
  unitPrice: z.number().nonnegative(),
  label: z.string(), // e.g. "1-4 unités"
});

export const ProductVariantOptionSchema = z.object({
  id: z.number(),
  value: z.string(), // e.g. "500g", "Rouge"
  available: z.boolean().default(true),
  priceAdjustment: z.number().default(0), // delta from base price
});

export const ProductVariantSchema = z.object({
  id: z.number(),
  name: z.string(), // e.g. "Poids", "Conditionnement"
  options: z.array(ProductVariantOptionSchema),
});

export const ProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  currency: z.string().default(CURRENCY.code),
  discount: z.number().min(0).max(100).optional(),
  images: z.array(ProductImageSchema),
  thumbnail: z.string(),
  categoryId: z.number(),
  categoryName: z.string(),
  vendorId: z.number(),
  vendorName: z.string(),
  vendorSlug: z.string().optional(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().nonnegative(),
  stock: z.number().nonnegative(),
  sold: z.number().nonnegative(),
  tags: z.array(z.string()),
  isFeatured: z.boolean().default(false),
  createdAt: z.string(),
  // ── New: Pricing & Variants ──
  promoPrice: z.number().nonnegative().optional(),
  promoEndsAt: z.string().optional(), // ISO date string
  bulkPrices: z.array(BulkPriceTierSchema).optional(),
  variants: z.array(ProductVariantSchema).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
});

export const ProductListItemSchema = ProductSchema.pick({
  id: true,
  slug: true,
  name: true,
  price: true,
  originalPrice: true,
  discount: true,
  thumbnail: true,
  rating: true,
  reviewCount: true,
  stock: true,
  sold: true,
  vendorName: true,
  categoryName: true,
});

// ─── Derived Types ───────────────────────────────────────────

export type Product = z.infer<typeof ProductSchema>;
export type ProductListItem = z.infer<typeof ProductListItemSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type BulkPriceTier = z.infer<typeof BulkPriceTierSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductVariantOption = z.infer<typeof ProductVariantOptionSchema>;
