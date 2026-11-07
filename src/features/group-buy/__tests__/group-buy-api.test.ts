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
  joinGroupBuy,
  launchGroupBuy,
  openGroupBuyCheckout,
} from "../api/group-buy.api";
import { normalizeGroupCode } from "../api/group-buy.endpoints";
import { refusalOf } from "../lib/group-buy-format";
import { SERVER_NOW, groupDetail, groupResponse } from "./fixtures";

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
