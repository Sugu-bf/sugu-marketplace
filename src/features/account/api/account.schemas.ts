/**
 * Account API Zod Schemas — mirrors the real backend response shapes.
 *
 * These schemas validate every API response at runtime.
 * They match the { success: bool, data: {...} } envelope from the backend.
 */

import { z } from "zod";

// ─── Profile ─────────────────────────────────────────────────

export const ApiProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  email_verified: z.boolean(),
  phone_e164: z.string().nullable(),
  phone_verified: z.boolean(),
  avatar_url: z.string().nullable(),
  user_type: z.string(),
  referral_code: z.string().nullable(),
  created_at: z.string(),
});

// ─── Security ────────────────────────────────────────────────

export const ApiSecuritySchema = z.object({
  two_factor_enabled: z.boolean(),
  password_updated_at: z.string().nullable(),
});

// ─── Preferences ─────────────────────────────────────────────

export const ApiPreferencesSchema = z.object({
  newsletter_subscribed: z.boolean(),
  push_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  language: z.string(),
  currency: z.string(),
});

// ─── Account Page (aggregated) ───────────────────────────────

export const ApiAccountPageResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    profile: ApiProfileSchema,
    security: ApiSecuritySchema,
    preferences: ApiPreferencesSchema,
  }),
});

// ─── Addresses ───────────────────────────────────────────────

export const ApiAddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  full_name: z.string().nullable(),
  phone: z.string().nullable(),
  address_line: z.string().nullable(),
  address_complement: z.string().nullable(),
  city: z.string(),
  state: z.string().nullable(),
  country_code: z.string(),
  is_default: z.boolean(),
  is_verified: z.boolean(),
});

export const ApiAddressListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ApiAddressSchema),
});

export const ApiAddressSingleResponseSchema = z.object({
  success: z.boolean(),
  data: ApiAddressSchema,
  message: z.string().optional(),
});

// ─── Orders (from existing endpoint) ─────────────────────────

export const ApiOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  image: z.string().nullable(),
});

export const ApiOrderListItemSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  date: z.string(),
  relativeDate: z.string(),
  statusCode: z.string().nullable(),
  status: z.string(),
  totalAmount: z.number(),
  currency: z.string().default("XOF"),
  itemCount: z.number(),
  items: z.array(ApiOrderItemSchema),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  shippingStatus: z.string().optional(),
  // COD Mixte fields
  is_cod: z.boolean().optional(),
  cod_flow_type: z.enum(["mixte", "legacy"]).nullable().optional(),
  delivery_fee_paid: z.boolean().optional(),
  product_fee_paid: z.boolean().optional(),
  cod_current_step: z.string().nullable().optional(),
});

export const ApiOrderListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    orders: z.array(ApiOrderListItemSchema),
    pagination: z.object({
      current_page: z.number(),
      last_page: z.number(),
      per_page: z.number(),
      total: z.number(),
      from: z.number().nullable(),
      to: z.number().nullable(),
    }),
  }),
});

// ─── Notifications (from mobile endpoint) ────────────────────

export const ApiNotificationItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  action_url: z.string().nullable().optional(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export const ApiNotificationGroupSchema = z.object({
  label: z.string(),
  items: z.array(ApiNotificationItemSchema),
});

export const ApiNotificationListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    groups: z.array(ApiNotificationGroupSchema),
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
    unread_count: z.number(),
  }),
});

// ─── Referral ────────────────────────────────────────────────

export const ApiReferredUserSchema = z.object({
  name: z.string(),
  date: z.string(),
  status: z.union([z.string(), z.number()]).transform(String),
});

export const ApiReferralResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    referral_code: z.string().nullable(),
    referral_link: z.string().nullable(),
    total_referred: z.number(),
    total_earnings: z.number(),
    reward_per_referral: z.number(),
    referred_users: z.array(ApiReferredUserSchema),
  }),
});

// ─── Message Response (generic) ──────────────────────────────

export const ApiMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const ApiMarkedReadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    marked_count: z.number(),
  }).optional(),
});
