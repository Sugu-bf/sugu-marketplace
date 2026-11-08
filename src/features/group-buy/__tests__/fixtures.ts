/**
 * A group as the API presents it (GroupBuyPresenter::detail in the API repo):
 * amounts in centimes, public names only.
 */
import type {
  GroupBuyDetail,
  GroupBuyDetailResponse,
  GroupBuyMembership,
  GroupBuyViewerStanding,
} from "../api/group-buy.schemas";

export const SERVER_NOW = "2026-11-06T12:00:00+00:00";

export function groupDetail(overrides: Partial<GroupBuyDetail> = {}): GroupBuyDetail {
  return {
    code: "K7M2Q9XA",
    status: "open",
    reserved_qty: 2,
    members_count: 2,
    max_qty: 40,
    current_unit_price: 650_000,
    current_tier_min_qty: null,
    saving_percent: 0,
    next_tier: { min_qty: 3, unit_price: 590_000, missing_qty: 1, saving_percent: 9 },
    closes_at: "2026-11-07T12:00:00+00:00",
    order_deadline_at: null,
    server_now: SERVER_NOW,
    delivery_mode: "individual",
    visibility: "public",
    currency: "XOF",
    base_unit_price: 650_000,
    best_unit_price: 540_000,
    tiers: [
      { min_qty: 3, unit_price: 590_000, saving_percent: 9, reached: false },
      { min_qty: 5, unit_price: 540_000, saving_percent: 17, reached: false },
    ],
    product: { id: "01JPRODUCT00000000000000AA", name: "Sac de riz 25 kg", slug: "sac-de-riz-25-kg", image_url: null },
    variant_id: "01JVARIANT00000000000000AA",
    store: { name: "Boutique Wend-Kuuni", slug: "wend-kuuni" },
    initiator_name: "Awa K.",
    city: "Ouagadougou",
    share_url: "https://sugu.pro/groupe/K7M2Q9XA",
    opens_at: "2026-11-05T12:00:00+00:00",
    members: [
      { name: "Awa K.", qty: 1, is_initiator: true, has_ordered: false },
      { name: "Ibrahim O.", qty: 1, is_initiator: false, has_ordered: false },
    ],
    members_hidden: 0,
    max_member_qty: 10,
    remaining_qty: 38,
    can_join: true,
    my_membership: null,
    share_ref: null,
    ...overrides,
  };
}

export function groupResponse(overrides: Partial<GroupBuyDetail> = {}): GroupBuyDetailResponse {
  return { success: true, data: groupDetail(overrides), server_now: SERVER_NOW };
}

/** The viewer's place in a group (GroupBuyPresenter::membership). */
export function membership(overrides: Partial<GroupBuyMembership> = {}): GroupBuyMembership {
  return {
    qty: 1,
    status: "reserved",
    is_initiator: false,
    can_leave: false,
    can_change_qty: false,
    can_order: false,
    order_qty: 1,
    my_share_amount: 650_000,
    order: null,
    joined_at: "2026-11-05T13:00:00+00:00",
    must_confirm: false,
    confirm_reason: null,
    confirmed: false,
    online_payment_only: false,
    order_deadline_at: null,
    ...overrides,
  };
}

/** A signed-in viewer's standing on a group: level "Nouveau", room for 4 units. */
export function viewerStanding(overrides: Partial<GroupBuyViewerStanding> = {}): GroupBuyViewerStanding {
  return {
    level: "new",
    level_label: "Nouveau",
    delivered_orders: 0,
    max_amount: 3_000_000,
    reserved_amount: 400_000,
    available_amount: 2_600_000,
    active_strikes: 0,
    suspended_until: null,
    prepay_required: false,
    banned: false,
    max_qty_here: 4,
    block: null,
    ...overrides,
  };
}

export const CONFIRM_RULES = { min_qty: 5, share_percent: 50, amount: 10_000_000, window_hours: 12 };
