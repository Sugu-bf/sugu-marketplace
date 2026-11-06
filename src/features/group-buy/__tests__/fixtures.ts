/**
 * A group as the API presents it (GroupBuyPresenter::detail in the API repo):
 * amounts in centimes, public names only.
 */
import type { GroupBuyDetail, GroupBuyDetailResponse } from "../api/group-buy.schemas";

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
