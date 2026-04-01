/**
 * Checkout Types — inferred from Zod schemas.
 *
 * These types are the single source of truth for checkout data shapes.
 * Generated from checkout.schemas.ts — never define types manually.
 */

import type { z } from "zod";
import type {
  CheckoutLineItemSchema,
  PricingSnapshotSchema,
  CheckoutWarningSchema,
  CartSnapshotSchema,
  CheckoutAddressSchema,
  CheckoutSessionApiSchema,
  CreateSessionResponseSchema,
  ShowSessionResponseSchema,
  DeliveryPartnerSchema,
  DeliveryRateSchema,
  DeliveryServiceSchema,
  DeliveryZoneSchema,
  ShippingOptionsResponseSchema,
  ApplyCouponResponseSchema,
  RemoveCouponResponseSchema,
  PlaceOrderResponseSchema,
  ConflictErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "./checkout.schemas";

// ─── Core Types ──────────────────────────────────────────────

export type CheckoutLineItem = z.infer<typeof CheckoutLineItemSchema>;
export type PricingSnapshot = z.infer<typeof PricingSnapshotSchema>;
export type CheckoutWarning = z.infer<typeof CheckoutWarningSchema>;
export type CartSnapshot = z.infer<typeof CartSnapshotSchema>;
export type CheckoutAddress = z.infer<typeof CheckoutAddressSchema>;
export type CheckoutSessionApi = z.infer<typeof CheckoutSessionApiSchema>;

// ─── API Response Types ──────────────────────────────────────

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type ShowSessionResponse = z.infer<typeof ShowSessionResponseSchema>;

export type DeliveryPartner = z.infer<typeof DeliveryPartnerSchema>;
export type DeliveryRate = z.infer<typeof DeliveryRateSchema>;
export type DeliveryService = z.infer<typeof DeliveryServiceSchema>;
export type DeliveryZone = z.infer<typeof DeliveryZoneSchema>;
export type ShippingOptionsResponse = z.infer<typeof ShippingOptionsResponseSchema>;

export type ApplyCouponResponse = z.infer<typeof ApplyCouponResponseSchema>;
export type RemoveCouponResponse = z.infer<typeof RemoveCouponResponseSchema>;

export type PlaceOrderResponse = z.infer<typeof PlaceOrderResponseSchema>;
export type ConflictErrorResponse = z.infer<typeof ConflictErrorResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;

// ─── Composite Client State ─────────────────────────────────

/**
 * The unified checkout page state used by the Orchestrator component.
 * Combines data from checkout session + shipping options.
 * The front NEVER computes totals — all come from backend.
 */
export interface CheckoutPageState {
  /** The checkout session from backend */
  session: CheckoutSessionApi;
  /** Line items from the checkout session's pricing snapshot */
  lineItems: CheckoutLineItem[];
  /** Available delivery partners (from shipping-options endpoint) */
  partners: DeliveryPartner[];
  /** Available delivery zones */
  zones: DeliveryZone[];
  /** Shipping address on the session (if set) */
  shippingAddress: CheckoutAddress | null;
  /** Currently applied coupon code */
  couponCode: string | null;
  /** Currently selected partner ID */
  selectedPartnerId: string | null;
  /** Currently selected rate ID (shipping method) */
  selectedRateId: string | null;
  /** Selected payment method */
  selectedPaymentMethod: "cod" | "ligdicash" | null;
}

// ─── Request Payloads ────────────────────────────────────────

export interface CreateCheckoutSessionPayload {
  shipping_address?: CheckoutAddress;
  billing_address?: CheckoutAddress | null;
  shipping_method_id?: string | null;
  coupon_code?: string | null;
  country_code?: string;
  locale?: string;
  notes?: string | null;
}

export interface PlaceOrderPayload {
  checkout_session_id: string;
  payment_method: "cod" | "ligdicash";
}

export interface UpdateCheckoutSessionPayload {
  shipping_address?: {
    full_name: string;
    phone: string;
    email?: string | null;
    line1: string;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    zone?: string | null;
    country_code?: string;
  };
  shipping_partner_id?: string | null;
  shipping_rate_id?: string | null;
  payment_method?: "cod" | "ligdicash" | null;
}
