/**
 * Group buying — response schemas (docs/GROUP_BUYING.md §6 in the API repo).
 *
 * Amounts are in centimes, like the rest of the API; dates are ISO 8601 and
 * every response carries `server_now`, so a countdown never relies on the
 * phone's clock. Public views hold no personal data (first name + initial).
 */
import { z } from "zod";

export const GroupBuyStatusSchema = z.enum(["open", "locked", "failed", "finished", "cancelled"]);
export type GroupBuyStatus = z.infer<typeof GroupBuyStatusSchema>;

export const GroupBuyMemberStatusSchema = z.enum(["reserved", "ordered", "left", "expired", "removed"]);
export type GroupBuyMemberStatus = z.infer<typeof GroupBuyMemberStatusSchema>;

export const GroupBuyDeliveryModeSchema = z.enum(["individual", "grouped"]);
export type GroupBuyDeliveryMode = z.infer<typeof GroupBuyDeliveryModeSchema>;

export const GroupBuyTierSchema = z.object({
  min_qty: z.number().int(),
  unit_price: z.number().int(),
  saving_percent: z.number(),
  reached: z.boolean().optional(),
});
export type GroupBuyTier = z.infer<typeof GroupBuyTierSchema>;

export const GroupBuyNextTierSchema = z.object({
  min_qty: z.number().int(),
  unit_price: z.number().int(),
  missing_qty: z.number().int(),
  saving_percent: z.number(),
});

/** The live part of a group: also what the realtime channel sends. */
export const GroupBuyProgressSchema = z.object({
  code: z.string(),
  status: GroupBuyStatusSchema,
  reserved_qty: z.number().int(),
  members_count: z.number().int(),
  max_qty: z.number().int(),
  current_unit_price: z.number().int(),
  current_tier_min_qty: z.number().int().nullable(),
  saving_percent: z.number(),
  next_tier: GroupBuyNextTierSchema.nullable(),
  closes_at: z.string().nullable(),
  order_deadline_at: z.string().nullable(),
  server_now: z.string(),
});
export type GroupBuyProgress = z.infer<typeof GroupBuyProgressSchema>;

export const GroupBuySummarySchema = GroupBuyProgressSchema.extend({
  delivery_mode: GroupBuyDeliveryModeSchema,
  visibility: z.enum(["public", "private"]),
  currency: z.string(),
  base_unit_price: z.number().int(),
  best_unit_price: z.number().int(),
  tiers: z.array(GroupBuyTierSchema),
  product: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string().nullable(),
      image_url: z.string().nullable(),
    })
    .nullable(),
  variant_id: z.string(),
  store: z.object({ name: z.string(), slug: z.string().nullable() }).nullable(),
  initiator_name: z.string().nullable(),
  city: z.string().nullable(),
  share_url: z.string(),
  opens_at: z.string().nullable(),
});
export type GroupBuySummary = z.infer<typeof GroupBuySummarySchema>;

export const GroupBuyMembershipSchema = z.object({
  qty: z.number().int(),
  status: GroupBuyMemberStatusSchema,
  is_initiator: z.boolean(),
  can_leave: z.boolean(),
  can_change_qty: z.boolean(),
  can_order: z.boolean(),
  /** In grouped delivery the initiator orders the whole group quantity. */
  order_qty: z.number().int(),
  my_share_amount: z.number().int(),
  order: z
    .object({ id: z.string(), number: z.string().nullable(), status: z.string().nullable() })
    .nullable(),
  joined_at: z.string().nullable(),
});
export type GroupBuyMembership = z.infer<typeof GroupBuyMembershipSchema>;

export const GroupBuyDetailSchema = GroupBuySummarySchema.extend({
  members: z.array(
    z.object({
      name: z.string(),
      qty: z.number().int(),
      is_initiator: z.boolean(),
      has_ordered: z.boolean(),
    }),
  ),
  members_hidden: z.number().int(),
  max_member_qty: z.number().int(),
  remaining_qty: z.number().int(),
  can_join: z.boolean(),
  my_membership: GroupBuyMembershipSchema.nullable(),
  /** The viewer's own invitation code, added to the links they share. */
  share_ref: z.string().nullable().optional(),
});
export type GroupBuyDetail = z.infer<typeof GroupBuyDetailSchema>;

export const MyGroupBuySchema = GroupBuySummarySchema.extend({
  my_membership: GroupBuyMembershipSchema,
});
export type MyGroupBuy = z.infer<typeof MyGroupBuySchema>;

// ─── Envelopes ───────────────────────────────────────────────

export const GroupBuyListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(GroupBuySummarySchema),
    has_more: z.boolean(),
    page: z.number().int().optional(),
  }),
  server_now: z.string(),
});
export type GroupBuyListResponse = z.infer<typeof GroupBuyListResponseSchema>;

export const GroupBuyStatsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ open_count: z.number().int() }),
});

const OfferTierSchema = z.object({
  min_qty: z.number().int(),
  unit_price: z.number().int(),
  saving_percent: z.number(),
});

export const GroupBuyOfferSchema = z.discriminatedUnion("groupable", [
  z.object({
    groupable: z.literal(true),
    product_id: z.string(),
    variant_id: z.string(),
    currency: z.string(),
    base_unit_price: z.number().int(),
    best_unit_price: z.number().int(),
    best_saving_percent: z.number(),
    tiers: z.array(OfferTierSchema),
    max_qty: z.number().int(),
    min_order_quantity: z.number().int(),
    delivery_modes: z.array(GroupBuyDeliveryModeSchema),
    open_hours: z.number().int(),
    max_member_qty: z.number().int(),
    open_groups: z.array(GroupBuySummarySchema),
  }),
  z.object({
    groupable: z.literal(false),
    reason: z.string().optional(),
    message: z.string().optional(),
    open_groups: z.array(GroupBuySummarySchema).optional(),
  }),
]);
export type GroupBuyOffer = z.infer<typeof GroupBuyOfferSchema>;

export const GroupBuyOfferResponseSchema = z.object({
  success: z.literal(true),
  data: GroupBuyOfferSchema,
  server_now: z.string().optional(),
});

export const GroupBuyDetailResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: GroupBuyDetailSchema,
  server_now: z.string(),
});
export type GroupBuyDetailResponse = z.infer<typeof GroupBuyDetailResponseSchema>;

export const GroupBuyCheckoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    checkout_session_id: z.string(),
    expires_at: z.string().nullable().optional(),
  }),
});

export const MyGroupBuysResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(MyGroupBuySchema),
    has_more: z.boolean(),
  }),
  server_now: z.string(),
});
export type MyGroupBuysResponse = z.infer<typeof MyGroupBuysResponseSchema>;

export const MyGroupBuyStatsSchema = z.object({
  saved_amount: z.number().int(),
  groups_joined: z.number().int(),
  groups_launched: z.number().int(),
  people_invited: z.number().int(),
  referral_code: z.string().nullable(),
});
export type MyGroupBuyStats = z.infer<typeof MyGroupBuyStatsSchema>;

export const MyGroupBuyStatsResponseSchema = z.object({
  success: z.literal(true),
  data: MyGroupBuyStatsSchema,
});
