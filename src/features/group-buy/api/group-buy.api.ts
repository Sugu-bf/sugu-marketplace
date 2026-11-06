/**
 * Group buying — API calls. Reads of public groups skip credentials so the
 * server can cache them; everything about the signed-in customer goes with
 * their session (the BFF injects it in the browser).
 *
 * The client never sends a price: the server computes every amount.
 */
import { api } from "@/lib/api/client";
import {
  GroupBuyCheckoutResponseSchema,
  GroupBuyDetailResponseSchema,
  GroupBuyListResponseSchema,
  GroupBuyOfferResponseSchema,
  GroupBuyStatsResponseSchema,
  MyGroupBuyStatsResponseSchema,
  MyGroupBuysResponseSchema,
  type GroupBuyDeliveryMode,
  type GroupBuyDetailResponse,
  type GroupBuyListResponse,
  type GroupBuyOffer,
  type MyGroupBuyStats,
  type MyGroupBuysResponse,
} from "./group-buy.schemas";
import {
  createGroupBuyUrl,
  groupBuyCheckoutUrl,
  groupBuyMembershipUrl,
  groupBuyOfferUrl,
  groupBuyStatsUrl,
  groupBuyUrl,
  groupBuysUrl,
  joinGroupBuyUrl,
  myGroupBuyStatsUrl,
  myGroupBuysUrl,
  relaunchGroupBuyUrl,
} from "./group-buy.endpoints";

export type GroupBuySort = "trending" | "ending_soon" | "best_saving" | "newest";

export interface GroupBuyListParams {
  sort?: GroupBuySort;
  page?: number;
  perPage?: number;
  category?: string;
  productId?: string;
  store?: string;
}

/** Open public groups. On the server: cached 15 s, like the API itself. */
export async function fetchGroupBuys(params: GroupBuyListParams = {}): Promise<GroupBuyListResponse> {
  const { data } = await api.get(
    groupBuysUrl({
      sort: params.sort ?? "trending",
      page: params.page ?? 1,
      per_page: params.perPage ?? 12,
      category: params.category,
      product_id: params.productId,
      store: params.store,
    }),
    { schema: GroupBuyListResponseSchema, skipCredentials: true, revalidate: 15, tags: ["group-buys"] },
  );
  return data;
}

/** How many groups are open right now (navigation badge). */
export async function fetchGroupBuyOpenCount(): Promise<number> {
  const { data } = await api.get(groupBuyStatsUrl(), {
    schema: GroupBuyStatsResponseSchema,
    skipCredentials: true,
    revalidate: 30,
    tags: ["group-buys"],
  });
  return data.data.open_count;
}

/** What a product (or one of its variants) offers to a group. */
export async function fetchGroupBuyOffer(productId: string, variantId?: string | null): Promise<GroupBuyOffer> {
  const { data } = await api.get(
    groupBuyOfferUrl({ product_id: productId, variant_id: variantId ?? undefined }),
    { schema: GroupBuyOfferResponseSchema, skipCredentials: true },
  );
  return data.data;
}

/** One group; with the viewer's membership when signed in. Never cached. */
export async function fetchGroupBuy(code: string, init?: { signal?: AbortSignal }): Promise<GroupBuyDetailResponse> {
  const { data } = await api.get(groupBuyUrl(code), {
    schema: GroupBuyDetailResponseSchema,
    cache: "no-store",
    retries: 0,
    signal: init?.signal,
  });
  return data;
}

export interface LaunchGroupBuyInput {
  productId: string;
  variantId?: string | null;
  qty: number;
  deliveryMode: GroupBuyDeliveryMode;
  visibility: "public" | "private";
  city?: string | null;
}

export async function launchGroupBuy(input: LaunchGroupBuyInput): Promise<GroupBuyDetailResponse> {
  const { data } = await api.post(createGroupBuyUrl(), {
    schema: GroupBuyDetailResponseSchema,
    body: {
      product_id: input.productId,
      variant_id: input.variantId ?? undefined,
      qty: input.qty,
      delivery_mode: input.deliveryMode,
      visibility: input.visibility,
      city: input.city?.trim() || undefined,
    },
  });
  return data;
}

export async function joinGroupBuy(code: string, qty: number, ref?: string | null): Promise<GroupBuyDetailResponse> {
  const { data } = await api.post(joinGroupBuyUrl(code), {
    schema: GroupBuyDetailResponseSchema,
    body: { qty, ref: ref || undefined },
  });
  return data;
}

export async function changeGroupBuyQuantity(code: string, qty: number): Promise<GroupBuyDetailResponse> {
  const { data } = await api.patch(groupBuyMembershipUrl(code), {
    schema: GroupBuyDetailResponseSchema,
    body: { qty },
  });
  return data;
}

export async function leaveGroupBuy(code: string): Promise<GroupBuyDetailResponse> {
  const { data } = await api.delete(groupBuyMembershipUrl(code), { schema: GroupBuyDetailResponseSchema });
  return data;
}

/** Opens the checkout of the member's part at the locked group price. */
export async function openGroupBuyCheckout(code: string): Promise<string> {
  const { data } = await api.post(groupBuyCheckoutUrl(code), {
    schema: GroupBuyCheckoutResponseSchema,
    body: {},
  });
  return data.data.checkout_session_id;
}

export async function relaunchGroupBuy(code: string, qty?: number): Promise<GroupBuyDetailResponse> {
  const { data } = await api.post(relaunchGroupBuyUrl(code), {
    schema: GroupBuyDetailResponseSchema,
    body: qty ? { qty } : {},
  });
  return data;
}

export async function fetchMyGroupBuys(scope: "active" | "past", page = 1): Promise<MyGroupBuysResponse> {
  const { data } = await api.get(myGroupBuysUrl({ scope, page }), {
    schema: MyGroupBuysResponseSchema,
    cache: "no-store",
  });
  return data;
}

export async function fetchMyGroupBuyStats(): Promise<MyGroupBuyStats> {
  const { data } = await api.get(myGroupBuyStatsUrl(), {
    schema: MyGroupBuyStatsResponseSchema,
    cache: "no-store",
  });
  return data.data;
}
