/**
 * Checkout Zod Schemas — Canonical types derived from real backend API.
 *
 * These schemas match exactly what the Laravel backend returns.
 * Amounts are in minor units (XOF centimes — effectively whole numbers since XOF has no decimals).
 *
 * RULE: The frontend NEVER calculates totals. All pricing comes from the backend.
 */

import { z } from "zod";

// ─── Line Item (from pricing_snapshot.lineItems) ─────────────

export const CheckoutLineItemSchema = z.object({
  product_id: z.string(),
  variant_id: z.string().nullable(),
  vendor_id: z.string().nullable(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  qty: z.number().int().min(1),
  unit_price: z.number(),
  compare_at: z.number().nullable().optional(),
  line_subtotal: z.number(),
  line_discount: z.number(),
  line_tax: z.number(),
  line_total: z.number(),
  stock: z.number().nullable().optional(),
  allow_backorder: z.boolean().optional(),
});

// ─── Pricing Snapshot (from checkout session) ────────────────

export const PricingSnapshotSchema = z.object({
  subtotal: z.number(),
  discount_amount: z.number(),
  tax_amount: z.number(),
  shipping_amount: z.number(),
  fees_amount: z.number(),
  cod_fee: z.number().optional(),
  grand_total: z.number(),
  currency: z.string(),
  line_items: z.array(CheckoutLineItemSchema).optional(),
  lineItems: z.array(CheckoutLineItemSchema).optional(),
});

// ─── Warning (stock/price changes detected) ──────────────────

export const CheckoutWarningSchema = z.object({
  type: z.enum(["stock_limited", "price_changed"]),
  variant_id: z.string().nullable(),
  product_id: z.string(),
  available: z.number().optional(),
  requested: z.number().optional(),
  old_price: z.number().optional(),
  new_price: z.number().optional(),
});

// ─── Cart Snapshot ───────────────────────────────────────────

export const CartSnapshotSchema = z.object({
  cart_id: z.string(),
  items: z.array(CheckoutLineItemSchema),
  vendors: z
    .array(
      z.object({
        vendor_id: z.string(),
        items: z.array(CheckoutLineItemSchema),
        subtotal: z.number(),
      })
    )
    .optional(),
});

// ─── Shipping Address (inline on session) ────────────────────

export const CheckoutAddressSchema = z.object({
  full_name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  country_code: z.string().optional(),
  postal_code: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// ─── Checkout Session (GET /api/v1/checkout/sessions/{id}) ───

export const CheckoutSessionApiSchema = z.object({
  id: z.string(),
  status: z.string(),
  currency: z.string(),
  totals: PricingSnapshotSchema,
  warnings: z.array(CheckoutWarningSchema).nullable(),
  expires_at: z.string(),
  is_active: z.boolean().optional(),
  cart_items_count: z.number().optional(),
});

// ─── Create Session Response ─────────────────────────────────

export const CreateSessionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    session: z.object({
      id: z.string(),
      status: z.string(),
      currency: z.string(),
      totals: PricingSnapshotSchema,
      warnings: z.array(CheckoutWarningSchema).nullable(),
      expires_at: z.string(),
      cart_items_count: z.number(),
    }),
  }),
});

// ─── Show Session Response ───────────────────────────────────

export const ShowSessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    session: CheckoutSessionApiSchema,
  }),
});

// ─── Shipping Partner / Rate (GET /checkout/shipping-options) ─

export const DeliveryServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
});

export const DeliveryRateSchema = z.object({
  id: z.string(),
  zone_id: z.string(),
  zone_name: z.string().nullable(),
  service_id: z.string().nullable(),
  service_name: z.string().nullable(),
  service_code: z.string().nullable(),
  flat_amount: z.number(),
  currency: z.string(),
  min_weight_grams: z.number().nullable(),
  max_weight_grams: z.number().nullable(),
  cod_supported: z.boolean(),
});

export const DeliveryPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  logo_url: z.string().nullable(),
  contact_phone: z.string().nullable(),
  rating_avg: z.number(),
  rating_count: z.number(),
  capabilities: z
    .union([z.array(z.string()), z.record(z.string(), z.unknown())])
    .optional()
    .transform((val) => {
      // Backend may return {} (empty object) instead of [] (empty array)
      if (!val || typeof val !== "object") return [];
      return Array.isArray(val) ? val : Object.keys(val);
    }),
  services: z.array(DeliveryServiceSchema),
  rates: z.array(DeliveryRateSchema),
});

export const DeliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  country_code: z.string(),
});

export const ShippingOptionsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    zones: z.array(DeliveryZoneSchema),
    partners: z.array(DeliveryPartnerSchema),
  }),
});

// ─── Coupon Response (POST /cart/coupon/apply) ────────────────

export const ApplyCouponResponseSchema = z.object({
  message: z.string(),
  coupon: z
    .object({
      code: z.string(),
      name: z.string(),
      discount_type: z.string(),
    })
    .optional(),
  cart: z
    .object({
      items: z.array(z.unknown()),
      totals: z.record(z.string(), z.unknown()),
      warnings: z.array(z.unknown()).nullable().optional(),
    })
    .optional(),
});

export const RemoveCouponResponseSchema = z.object({
  message: z.string(),
  cart: z
    .object({
      items: z.array(z.unknown()),
      totals: z.record(z.string(), z.unknown()),
      warnings: z.array(z.unknown()).nullable().optional(),
    })
    .optional(),
});

// ─── Place Order Response (POST /checkout/orders) ────────────

export const PlaceOrderResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    order: z.object({
      id: z.string(),
      number: z.string(),
      status: z.string(),
      payment_status: z.string(),
      total_amount: z.number(),
      currency: z.string(),
      items_count: z.number(),
      is_cod: z.boolean(),
      placed_at: z.string().nullable(),
      guest_order_token: z.string().nullable(),
    }),
    payment_transaction: z
      .object({
        id: z.string(),
        provider: z.string(),
        status: z.string(),
        amount: z.number(),
        currency: z.string(),
      })
      .nullable(),
    payment_url: z.string().nullable(),
    next_step: z.enum(["order_confirmed", "redirect_to_payment"]),
  }),
});

// ─── Error Response (409 conflict — stock/price) ─────────────

export const ConflictErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error_code: z.enum(["OUT_OF_STOCK", "PRICE_CHANGED"]).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// ─── Validation Error Response (422) ─────────────────────────

export const ValidationErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});
