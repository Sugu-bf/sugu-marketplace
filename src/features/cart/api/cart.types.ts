/**
 * Cart API Types — inferred from Zod schemas.
 *
 * UI components should use these types, never raw API shapes directly.
 */

import type { z } from "zod";
import type {
  ApiCartLineSchema,
  ApiCartTotalsSchema,
  CartWarningSchema,
  CartMetaSchema,
  CartDataSchema,
  ApiCartResponseSchema,
  ApiCouponApplyResponseSchema,
  ApiCouponRemoveResponseSchema,
  ApiCheckoutSessionResponseSchema,
  ApiPlaceOrderResponseSchema,
  CartItemFlagsSchema,
  DiscountLineSchema,
} from "./cart.schemas";

// ─── Raw API types ───────────────────────────────────────────

export type ApiCartLine = z.infer<typeof ApiCartLineSchema>;
export type ApiCartTotals = z.infer<typeof ApiCartTotalsSchema>;
export type CartWarning = z.infer<typeof CartWarningSchema>;
export type CartMeta = z.infer<typeof CartMetaSchema>;
export type CartData = z.infer<typeof CartDataSchema>;
export type ApiCartResponse = z.infer<typeof ApiCartResponseSchema>;
export type CartItemFlags = z.infer<typeof CartItemFlagsSchema>;
export type DiscountLine = z.infer<typeof DiscountLineSchema>;
export type ApiCouponApplyResponse = z.infer<typeof ApiCouponApplyResponseSchema>;
export type ApiCouponRemoveResponse = z.infer<typeof ApiCouponRemoveResponseSchema>;
export type ApiCheckoutSessionResponse = z.infer<typeof ApiCheckoutSessionResponseSchema>;
export type ApiPlaceOrderResponse = z.infer<typeof ApiPlaceOrderResponseSchema>;

// ─── UI-facing mapped types ──────────────────────────────────

/** A single cart line transformed for UI consumption */
export interface CartLineUI {
  id: number;
  productId: string | number;
  variantId: string | number;
  slug: string | null;
  name: string;
  vendorName?: string;
  image: string | null;
  variantTitle: string | null;
  qty: number;
  unitPrice: number;
  compareAtPrice: number | null;
  lineTotal: number;
  currency: string;
  maxQuantity?: number;
  flags: CartItemFlags;
  isOnSale: boolean;
}

/** Cart totals for the order summary */
export interface CartTotalsUI {
  subtotal: number;
  discount: number;
  shipping: number;
  shippingDiscount: number;
  fees: number;
  total: number;
  itemCount: number;
  qtyTotal: number;
  currency: string;
  shippingFree: boolean;
}

/** Full cart state for the UI */
export interface CartUI {
  lines: CartLineUI[];
  totals: CartTotalsUI;
  couponCode: string | null;
  warnings: CartWarning[];
  isEmpty: boolean;
}
