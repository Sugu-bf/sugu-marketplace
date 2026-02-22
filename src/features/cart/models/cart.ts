import { z } from "zod";

// ─── Cart Item Variant ───────────────────────────────────────

export const CartItemVariantSchema = z.object({
  name: z.string(), // e.g. "Poids"
  value: z.string(), // e.g. "500g"
});

// ─── Cart Item ───────────────────────────────────────────────

export const CartItemSchema = z.object({
  productId: z.number(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  quantity: z.number().min(1),
  maxQuantity: z.number().optional(), // stock limit
  thumbnail: z.string(),
  vendorName: z.string(),
  variants: z.array(CartItemVariantSchema).optional(),
});

// ─── Cart Summary ────────────────────────────────────────────

export const CartSummarySchema = z.object({
  subtotal: z.number(),
  discount: z.number(),
  shipping: z.number(),
  total: z.number(),
  itemCount: z.number(),
  shippingFree: z.boolean(),
});

// ─── Cart ────────────────────────────────────────────────────

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  summary: CartSummarySchema.optional(),
  updatedAt: z.string(),
});

// ─── Derived Types ───────────────────────────────────────────

export type CartItemVariant = z.infer<typeof CartItemVariantSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type CartSummary = z.infer<typeof CartSummarySchema>;
export type Cart = z.infer<typeof CartSchema>;
