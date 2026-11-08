/**
 * Group buying API — the client reads what the server presents, never sends
 * a price, and keeps the stable refusal code and its context.
 * Node env; the api client skips the BFF under NODE_ENV==='test'.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { API_BASE_URL } from "@/lib/api/config";
import { isApiError } from "@/lib/api";
import {
  fetchGroupBuy,
  fetchGroupBuyOffer,
  fetchGroupBuys,
  fetchMyGroupBuyStanding,
  joinGroupBuy,
  launchGroupBuy,
  openGroupBuyCheckout,
} from "../api/group-buy.api";
import { normalizeGroupCode } from "../api/group-buy.endpoints";
import { refusalOf } from "../lib/group-buy-format";
import { CONFIRM_RULES, SERVER_NOW, groupDetail, groupResponse, membership, viewerStanding } from "./fixtures";

setupMswServer();

const url = (path: string) => `${API_BASE_URL}/api/v1${path}`;

describe("group buy reads", () => {
  it("parses one group as the API presents it", async () => {
    server.use(http.get(url("/group-buys/K7M2Q9XA"), () => HttpResponse.json(groupResponse())));

    const response = await fetchGroupBuy("K7M2Q9XA");

    expect(response.data.next_tier?.missing_qty).toBe(1);
    expect(response.data.tiers).toHaveLength(2);
    expect(response.server_now).toBe(SERVER_NOW);
  });

  it("reads a group whose large reservations confirm the price", async () => {
    server.use(
      http.get(url("/group-buys/K7M2Q9XA"), () =>
        HttpResponse.json(
          groupResponse({
            status: "confirming",
            confirm_deadline_at: "2026-11-07T00:00:00+00:00",
            ordered_count: 1,
            confirm_rules: CONFIRM_RULES,
            my_membership: membership({
              qty: 6,
              must_confirm: true,
              confirm_reason: "bulk",
              online_payment_only: true,
              can_order: true,
              order_deadline_at: "2026-11-07T00:00:00+00:00",
              order: { id: "01JORDER", number: "SG-1", status: "pending", payment_status: "unpaid" },
            }),
            my_standing: viewerStanding(),
          }),
        ),
      ),
    );

    const { data } = await fetchGroupBuy("K7M2Q9XA");

    expect(data.status).toBe("confirming");
    expect(data.confirm_deadline_at).toBe("2026-11-07T00:00:00+00:00");
    expect(data.my_membership?.must_confirm).toBe(true);
    expect(data.my_membership?.order?.payment_status).toBe("unpaid");
    expect(data.my_standing?.max_qty_here).toBe(4);
    expect(data.confirm_rules?.share_percent).toBe(50);
  });

  it("still reads a group from an API without the reliability fields", async () => {
    const legacy = groupDetail({
      my_membership: {
        qty: 1,
        status: "reserved",
        is_initiator: false,
        can_leave: true,
        can_change_qty: true,
        can_order: false,
        order_qty: 1,
        my_share_amount: 650_000,
        order: { id: "01JORDER", number: null, status: "pending" },
        joined_at: null,
      },
    }) as Record<string, unknown>;
    delete legacy.my_standing;
    delete legacy.confirm_rules;
    delete legacy.ordered_count;
    server.use(http.get(url("/group-buys/K7M2Q9XA"), () => HttpResponse.json({ success: true, data: legacy, server_now: SERVER_NOW })));

    const { data } = await fetchGroupBuy("K7M2Q9XA");

    expect(data.my_standing).toBeUndefined();
    expect(data.my_membership?.must_confirm).toBeUndefined();
  });

  it("reads the customer's standing, strikes and rules", async () => {
    server.use(
      http.get(url("/me/group-buys/standing"), () =>
        HttpResponse.json({
          success: true,
          data: {
            level: "trusted",
            level_label: "Confirmé",
            delivered_orders: 4,
            max_amount: 15_000_000,
            reserved_amount: 1_300_000,
            available_amount: 13_700_000,
            active_strikes: 1,
            suspended_until: null,
            prepay_required: false,
            banned: false,
            strikes: [
              {
                id: "01JSTRIKE",
                reason: "no_show",
                label: "Pas de commande après le prix obtenu",
                group_code: "K7M2Q9XA",
                at: "2026-10-01T10:00:00+00:00",
                counts_until: "2026-12-30T10:00:00+00:00",
                voided: false,
              },
            ],
            rules: {
              strike_window_days: 90,
              suspend_after_strikes: 2,
              suspension_days: 30,
              prepay_after_strikes: 3,
              long_suspension_days: 90,
              ...CONFIRM_RULES,
            },
          },
        }),
      ),
    );

    const standing = await fetchMyGroupBuyStanding();

    expect(standing.level).toBe("trusted");
    expect(standing.strikes[0].group_code).toBe("K7M2Q9XA");
    expect(standing.rules?.suspend_after_strikes).toBe(2);
  });

  it("lists open groups with the sort it was asked", async () => {
    let seen: URL | null = null;
    server.use(
      http.get(url("/group-buys"), ({ request }) => {
        seen = new URL(request.url);
        return HttpResponse.json({ success: true, data: { items: [groupDetail()], has_more: false, page: 1 }, server_now: SERVER_NOW });
      }),
    );

    const list = await fetchGroupBuys({ sort: "ending_soon", perPage: 8 });

    expect(list.data.items[0].code).toBe("K7M2Q9XA");
    expect(seen!.searchParams.get("sort")).toBe("ending_soon");
    expect(seen!.searchParams.get("per_page")).toBe("8");
  });

  it("reads a product that is not open to groups", async () => {
    server.use(
      http.get(url("/group-buys/offer"), () =>
        HttpResponse.json({ success: true, data: { groupable: false, reason: "NOT_GROUPABLE", message: "Non", open_groups: [] } }),
      ),
    );

    const offer = await fetchGroupBuyOffer("01JPRODUCT00000000000000AA");

    expect(offer.groupable).toBe(false);
  });
});

describe("group buy actions", () => {
  it("joins with a quantity and the inviter code, never a price", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(url("/group-buys/K7M2Q9XA/join"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(groupResponse({ reserved_qty: 4 }));
      }),
    );

    await joinGroupBuy("K7M2Q9XA", 2, "REF123");

    expect(body).toEqual({ qty: 2, ref: "REF123" });
  });

  it("launches with the choices of the dialog only", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(url("/group-buys"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(groupResponse(), { status: 201 });
      }),
    );

    await launchGroupBuy({ productId: "P1", variantId: "V1", qty: 1, visibility: "private", city: "  " });

    expect(body).toEqual({ product_id: "P1", variant_id: "V1", qty: 1, delivery_mode: "individual", visibility: "private" });
    expect(Object.keys(body).some((key) => key.includes("price"))).toBe(false);
  });

  it("keeps the stable refusal code and its context", async () => {
    server.use(
      http.post(url("/group-buys"), () =>
        HttpResponse.json(
          { success: false, code: "ALREADY_RUNNING", error_code: "ALREADY_RUNNING", message: "Vous avez déjà un groupe en cours sur ce produit.", meta: { code: "K7M2Q9XA" } },
          { status: 409 },
        ),
      ),
    );

    const error = await launchGroupBuy({ productId: "P1", qty: 1, visibility: "public" }).catch((e) => e);

    expect(isApiError(error)).toBe(true);
    const refusal = refusalOf(error);
    expect(refusal.code).toBe("ALREADY_RUNNING");
    expect(refusal.meta).toEqual({ code: "K7M2Q9XA" });
    expect(refusal.message).toContain("déjà un groupe");
  });

  it("keeps the ceiling the server gives with a TRUST_CAP refusal", async () => {
    server.use(
      http.post(url("/group-buys/K7M2Q9XA/join"), () =>
        HttpResponse.json(
          {
            success: false,
            code: "TRUST_CAP",
            error_code: "TRUST_CAP",
            message: "Votre niveau (Nouveau) vous permet de réserver jusqu’à 3 unité(s) ici.",
            meta: { max_qty: 3, level: "new" },
          },
          { status: 422 },
        ),
      ),
    );

    const refusal = refusalOf(await joinGroupBuy("K7M2Q9XA", 9).catch((e) => e));

    expect(refusal.code).toBe("TRUST_CAP");
    expect(refusal.meta).toEqual({ max_qty: 3, level: "new" });
    expect(refusal.message).toContain("jusqu’à 3");
  });

  it("opens the checkout of a part and returns its session", async () => {
    server.use(
      http.post(url("/group-buys/K7M2Q9XA/checkout"), () =>
        HttpResponse.json({ success: true, data: { checkout_session_id: "01JSESSION0000000000000000", expires_at: null } }, { status: 201 }),
      ),
    );

    await expect(openGroupBuyCheckout("K7M2Q9XA")).resolves.toBe("01JSESSION0000000000000000");
  });
});

describe("group codes", () => {
  it("accepts the 8-character codes of the API only", () => {
    expect(normalizeGroupCode(" k7m2q9xa ")).toBe("K7M2Q9XA");
    expect(normalizeGroupCode("K7M2Q9X")).toBeNull();
    expect(normalizeGroupCode("K7M2Q9XO")).toBeNull(); // no O: it reads as 0
    expect(normalizeGroupCode("../admin")).toBeNull();
  });
});
