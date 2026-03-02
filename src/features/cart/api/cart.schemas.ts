/**
 * Cart API Zod Schemas — mirrors the real backend response shapes.
 *
 * Source of truth: App\Domain\Cart\Actions\GetCartAction
 * These schemas validate every API response at runtime.
 */

import { z } from "zod";

// ─── Cart Item Flags ─────────────────────────────────────────

export const CartItemFlagsSchema = z.object({
  price_changed: z.boolean(),
  stock_limited: z.boolean(),
  unavailable: z.boolean(),
  bulk_price: z.boolean(),
});

// ─── Bulk Tier ───────────────────────────────────────────────

export const BulkTierSchema = z.object({
  min_qty: z.number(),
  max_qty: z.number().nullable().optional(),
  price: z.number(),
  discount_percent: z.number().nullable().optional(),
}).nullable();

// ─── Cart Line Item (from backend) ───────────────────────────

export const ApiCartLineSchema = z.object({
  id: z.number(),
  product_id: z.union([z.string(), z.number()]),
  variant_id: z.union([z.string(), z.number()]),
  vendor_id: z.union([z.string(), z.number()]).nullable().optional(),
  qty: z.number().min(0),
  unit_price: z.number(),
  compare_at_price: z.number().nullable(),
  line_total: z.number(),
  name: z.string(),
  variant_title: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  product_slug: z.string().nullable().optional(),
  variant_sku: z.string().nullable().optional(),
  currency: z.string().default("XOF"),
  flags: CartItemFlagsSchema,
  bulk_tier: BulkTierSchema.optional(),
  bulk_tiers: z.array(z.record(z.string(), z.unknown())).optional(),
  brand_id: z.union([z.string(), z.number()]).nullable().optional(),
  category_ids: z.array(z.union([z.string(), z.number()])).optional(),
  is_on_sale: z.boolean().optional(),
});

// ─── Cart Totals ─────────────────────────────────────────────

export const ApiCartTotalsSchema = z.object({
  subtotal: z.number(),
  shipping: z.number(),
  shipping_discount: z.number().optional().default(0),
  discount: z.number(),
  fees: z.number().optional().default(0),
  total: z.number(),
  item_count: z.number(),
  qty_total: z.number(),
});

// ─── Warning ─────────────────────────────────────────────────

export const CartWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  item_id: z.number().optional(),
  available: z.number().optional(),
  requested: z.number().optional(),
  old_price: z.number().optional(),
  new_price: z.number().optional(),
});

// ─── Discount Line ───────────────────────────────────────────

export const DiscountLineSchema = z.object({
  type: z.string().optional(),
  label: z.string().optional(),
  amount: z.number().optional(),
}).passthrough();

// ─── Cart Meta ───────────────────────────────────────────────

export const CartMetaSchema = z.object({
  cart_id: z.union([z.string(), z.number()]),
  currency: z.string().default("XOF"),
  cart_token: z.string().optional(),
});

// ─── Full Cart API Response ──────────────────────────────────

export const CartDataSchema = z.object({
  items: z.array(ApiCartLineSchema),
  totals: ApiCartTotalsSchema,
});

export const ApiCartResponseSchema = z.object({
  success: z.literal(true),
  data: CartDataSchema,
  meta: CartMetaSchema,
  warnings: z.array(CartWarningSchema).default([]),
}).passthrough();

// ─── Coupon Apply Response ───────────────────────────────────

export const ApiCouponApplyResponseSchema = z.object({
  message: z.string(),
  coupon: z.object({
    code: z.string(),
    name: z.string().nullable().optional(),
    discount_type: z.string().optional(),
  }).optional(),
  cart: z.object({
    items: z.array(ApiCartLineSchema),
    totals: ApiCartTotalsSchema,
    warnings: z.array(CartWarningSchema).default([]),
  }).passthrough().optional(),
});

// ─── Coupon Remove Response ──────────────────────────────────

export const ApiCouponRemoveResponseSchema = z.object({
  message: z.string(),
  cart: z.object({
    items: z.array(ApiCartLineSchema),
    totals: ApiCartTotalsSchema,
    warnings: z.array(CartWarningSchema).default([]),
  }).passthrough().optional(),
});

// ─── Checkout Session Response ───────────────────────────────

export const ApiCheckoutSessionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    session: z.object({
      id: z.string(),
      status: z.string(),
      currency: z.string(),
      totals: z.record(z.string(), z.unknown()),
      warnings: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
      expires_at: z.string(),
      cart_items_count: z.number().optional(),
    }),
  }),
});

// ─── Place Order Response ────────────────────────────────────

export const ApiPlaceOrderResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.object({
    order: z.object({
      id: z.union([z.string(), z.number()]),
      number: z.string(),
      status: z.string(),
      payment_status: z.string().nullable().optional(),
      total_amount: z.number(),
      currency: z.string(),
      items_count: z.number().optional(),
      is_cod: z.boolean().optional(),
      placed_at: z.string().nullable().optional(),
      guest_order_token: z.string().nullable().optional(),
    }),
    payment_transaction: z.object({
      id: z.union([z.string(), z.number()]),
      provider: z.string(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
    }).nullable().optional(),
    payment_url: z.string().nullable().optional(),
    next_step: z.string().optional(),
  }),
});

// ─── Error Response ──────────────────────────────────────────

export const ApiCartErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error_code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});
