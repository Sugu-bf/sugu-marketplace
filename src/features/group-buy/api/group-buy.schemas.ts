/**
 * Group buying — response schemas (docs/GROUP_BUYING.md §6 in the API repo).
 *
 * Amounts are in centimes, like the rest of the API; dates are ISO 8601 and
 * every response carries `server_now`, so a countdown never relies on the
 * phone's clock. Public views hold no personal data (first name + initial).
 */
import { z } from "zod";

/**
 * `confirming`: the group closed on a tier, and the large reservations pay
 * their part online first; the others order once the price is confirmed.
 */
export const GroupBuyStatusSchema = z.enum(["open", "confirming", "locked", "failed", "finished", "cancelled"]);
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
  /** Until when the large reservations may pay first (status `confirming` only). */
  confirm_deadline_at: z.string().nullable().optional(),
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

/**
 * When a reservation pays first at the close: `min_qty` units AND
 * `share_percent` % of the tier reached, or `amount` centimes at the price.
 */
export const GroupBuyConfirmRulesSchema = z.object({
  min_qty: z.number().int(),
  share_percent: z.number(),
  amount: z.number().int(),
  window_hours: z.number(),
});
export type GroupBuyConfirmRules = z.infer<typeof GroupBuyConfirmRulesSchema>;

export const GroupBuyTrustLevelSchema = z.enum(["new", "trusted", "loyal", "pro"]);
export type GroupBuyTrustLevel = z.infer<typeof GroupBuyTrustLevelSchema>;

/** Where the signed-in customer stands: their level, ceiling and sanctions. */
export const GroupBuyStandingSchema = z.object({
  /** A level unknown to this version of the site is read as a plain string. */
  level: z.union([GroupBuyTrustLevelSchema, z.string()]),
  level_label: z.string(),
  delivered_orders: z.number().int(),
  /** Largest amount held reserved at once (centimes, normal price); null = no ceiling. */
  max_amount: z.number().int().nullable(),
  reserved_amount: z.number().int(),
  /** What may still be reserved; null = no ceiling. */
  available_amount: z.number().int().nullable(),
  active_strikes: z.number().int(),
  suspended_until: z.string().nullable(),
  prepay_required: z.boolean(),
  banned: z.boolean(),
});
export type GroupBuyStanding = z.infer<typeof GroupBuyStandingSchema>;

/** The standing on one group: also how much the viewer may hold there. */
export const GroupBuyViewerStandingSchema = GroupBuyStandingSchema.extend({
  max_qty_here: z.number().int().nullable().optional(),
  block: z.enum(["banned", "suspended", "ceiling"]).nullable().optional(),
});
export type GroupBuyViewerStanding = z.infer<typeof GroupBuyViewerStandingSchema>;

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
    .object({
      id: z.string(),
      number: z.string().nullable(),
      status: z.string().nullable(),
      payment_status: z.string().nullable().optional(),
    })
    .nullable(),
  joined_at: z.string().nullable(),
  /** Pays first at the close (online only), before the others may order. */
  must_confirm: z.boolean().optional(),
  confirm_reason: z.enum(["bulk", "prepay"]).nullable().optional(),
  /** Their payment arrived: the price rests on it. */
  confirmed: z.boolean().optional(),
  /** Cash on delivery is refused for this part (confirmation in progress). */
  online_payment_only: z.boolean().optional(),
  /** The deadline that applies to this member: the confirmation's or the group's. */
  order_deadline_at: z.string().nullable().optional(),
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
  /** "7 sur 9 ont déjà commandé". */
  ordered_count: z.number().int().optional(),
  confirm_rules: GroupBuyConfirmRulesSchema.nullable().optional(),
  my_membership: GroupBuyMembershipSchema.nullable(),
  /** The viewer's own standing; null for a guest. */
  my_standing: GroupBuyViewerStandingSchema.nullable().optional(),
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
    confirm_rules: GroupBuyConfirmRulesSchema.nullable().optional(),
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

// ─── Standing (GET /me/group-buys/standing) ──────────────────

export const GroupBuyStrikeSchema = z.object({
  id: z.string(),
  reason: z.string(),
  label: z.string(),
  group_code: z.string().nullable().optional(),
  at: z.string().nullable(),
  /** Null once voided. */
  counts_until: z.string().nullable().optional(),
  voided: z.boolean(),
});
export type GroupBuyStrike = z.infer<typeof GroupBuyStrikeSchema>;

export const GroupBuyStandingRulesSchema = z.object({
  strike_window_days: z.number().int(),
  suspend_after_strikes: z.number().int(),
  suspension_days: z.number().int(),
  prepay_after_strikes: z.number().int(),
  long_suspension_days: z.number().int(),
  min_qty: z.number().int(),
  share_percent: z.number(),
  amount: z.number().int(),
  window_hours: z.number(),
});
export type GroupBuyStandingRules = z.infer<typeof GroupBuyStandingRulesSchema>;

export const MyGroupBuyStandingSchema = GroupBuyStandingSchema.extend({
  strikes: z.array(GroupBuyStrikeSchema).default([]),
  rules: GroupBuyStandingRulesSchema.nullable().optional(),
});
export type MyGroupBuyStanding = z.infer<typeof MyGroupBuyStandingSchema>;

export const MyGroupBuyStandingResponseSchema = z.object({
  success: z.literal(true),
  data: MyGroupBuyStandingSchema,
});
