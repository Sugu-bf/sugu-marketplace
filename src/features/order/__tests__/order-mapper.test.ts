/**
 * Order mapper tests — focus on the COD Mixte `shipmentId` wiring
 * (Trou n°2-bis fix). The field is exposed by the backend tracking
 * payload but was previously dropped by the mapper.
 */

import { describe, test, expect } from "vitest";
import { mapApiToTrackedOrder } from "../mappers/order-mapper";
import { OrderTrackingApiSchema, canPrepayCodClassic } from "../models/order";
import type { OrderTrackingApiData } from "../models/order";

type CodMixteApi = NonNullable<OrderTrackingApiData["codMixte"]>;

function baseApiOrder(): OrderTrackingApiData {
  return {
    id: "01JABCDEF0123456789ABCDEFG",
    reference: "SGU-2026-00001",
    createdAt: "2026-05-30T10:00:00Z",
    statusCode: "shipped",
    step: 3,
    statusSteps: [],
    timeline: [],
    canonical_timeline: [],
    delivery: {
      agency: { name: "Livo Express", rating: 4.7 },
      method: { label: "Standard", isExpress: false },
      address: "Ouagadougou, Burkina Faso",
      driver: null,
    },
    eta: { date: null, timeRange: null, progress: 60 },
    items: [],
    pricing: {
      subtotal: 100000,
      shipping: 2000,
      discount: 0,
      total: 102000,
      currency: "XOF",
      paymentStatus: "cod_pending",
      paymentMethod: "COD Mixte",
    },
    codMixte: null,
  };
}

function codMixteBlock(overrides: Partial<CodMixteApi> = {}): CodMixteApi {
  return {
    isCodMixte: true,
    deliveryFeePaid: true,
    productFeePaid: false,
    deliveryFeeAmount: 2000,
    productFeeAmount: 100000,
    deliveryFeePaidAt: "2026-05-30T11:00:00Z",
    productFeePaidAt: null,
    vendorConfirmedAt: "2026-05-30T09:00:00Z",
    payDeliveryFeeUrl: null,
    payProductFeeUrl: null,
    shipmentId: "01JSHIPMENT0000000000000000",
    currentStep: "awaiting_inspection",
    ...overrides,
  };
}

describe("mapApiToTrackedOrder — COD Mixte shipmentId", () => {
  test("maps shipmentId through to the UI model at awaiting_inspection", () => {
    const api = { ...baseApiOrder(), codMixte: codMixteBlock() };

    const mapped = mapApiToTrackedOrder(api);

    expect(mapped.codMixte?.shipmentId).toBe("01JSHIPMENT0000000000000000");
    expect(mapped.codMixte?.currentStep).toBe("awaiting_inspection");
  });

  test("defaults shipmentId to null when the backend omits it", () => {
    const block = codMixteBlock();
    delete (block as Record<string, unknown>).shipmentId;
    const api = { ...baseApiOrder(), codMixte: block };

    const mapped = mapApiToTrackedOrder(api);

    expect(mapped.codMixte?.shipmentId).toBeNull();
  });

  test("leaves codMixte null for a non-COD-Mixte order", () => {
    const mapped = mapApiToTrackedOrder(baseApiOrder());
    expect(mapped.codMixte).toBeNull();
  });
});

describe("mapApiToTrackedOrder — COD Mixte agency acceptance (P0-8)", () => {
  // The only way to « Payer les frais de livraison » is gated on it: dropped
  // by the mapper, the button never showed and the order stayed blocked.
  const awaitingDeliveryPayment = (overrides: Partial<CodMixteApi> = {}) =>
    mapApiToTrackedOrder({
      ...baseApiOrder(),
      codMixte: codMixteBlock({
        currentStep: "awaiting_delivery_payment",
        deliveryFeePaid: false,
        payDeliveryFeeUrl: "https://api.sugu.test/api/v1/public/orders/01JABCDEF0123456789ABCDEFG/pay-delivery-fee",
        ...overrides,
      }),
    });

  test("carries the agency acceptance through to the page", () => {
    expect(awaitingDeliveryPayment({ agencyAccepted: true }).codMixte?.agencyAccepted).toBe(true);
    expect(awaitingDeliveryPayment({ agencyAccepted: false }).codMixte?.agencyAccepted).toBe(false);
  });

  test("never opens the payment when the backend does not say", () => {
    expect(awaitingDeliveryPayment().codMixte?.agencyAccepted).toBe(false);
  });

  test("keeps the pay URL the backend gives", () => {
    expect(awaitingDeliveryPayment({ agencyAccepted: true }).codMixte?.payDeliveryFeeUrl).toMatch(
      /\/orders\/01JABCDEF0123456789ABCDEFG\/pay-delivery-fee$/,
    );
  });
});

describe("OrderTrackingApiSchema — payment status contract", () => {
  // Every word Order::paymentSituation() can answer on the backend. "refunded"
  // and "hold" were refused: the tracking page of a refunded order, or of one
  // whose payment is held for review, showed an error instead of the order.
  test.each(["paid", "partial", "cod_pending", "pending", "hold", "refunded", "failed"] as const)(
    "accepts an order whose payment is %s, and maps it through",
    (paymentStatus) => {
      const base = baseApiOrder();
      const api = { ...base, pricing: { ...base.pricing, paymentStatus } };

      const parsed = OrderTrackingApiSchema.parse(api);

      expect(mapApiToTrackedOrder(parsed).paymentStatus).toBe(paymentStatus);
    },
  );

  test("still refuses a word the backend never answers", () => {
    const base = baseApiOrder();
    const api = { ...base, pricing: { ...base.pricing, paymentStatus: "settled" } };

    expect(OrderTrackingApiSchema.safeParse(api).success).toBe(false);
  });
});

describe("canPrepayCodClassic — the online prepayment of a COD classic order", () => {
  const cash = { codFlowType: "legacy", codPrepaid: false, total: 102000, paymentStatus: "cod_pending", codMixte: null } as const;

  test("is offered while the cash is still to collect", () => {
    expect(canPrepayCodClassic(cash)).toBe(true);
    // A prepayment started and left unfinished can be tried again.
    expect(canPrepayCodClassic({ ...cash, paymentStatus: "pending" })).toBe(true);
    expect(canPrepayCodClassic({ ...cash, paymentStatus: "failed" })).toBe(true);
  });

  test.each(["paid", "refunded", "hold"] as const)("is not offered once the payment is %s", (paymentStatus) => {
    expect(canPrepayCodClassic({ ...cash, paymentStatus })).toBe(false);
  });

  test("is not offered when already prepaid, on a COD Mixte order, or on an order that is not COD", () => {
    expect(canPrepayCodClassic({ ...cash, codPrepaid: true })).toBe(false);
    expect(canPrepayCodClassic({ ...cash, codMixte: codMixteBlock() })).toBe(false);
    expect(canPrepayCodClassic({ ...cash, codFlowType: null })).toBe(false);
    expect(canPrepayCodClassic({ ...cash, total: 0 })).toBe(false);
  });
});

describe("OrderTrackingApiSchema — shipmentId contract", () => {
  test("accepts a payload carrying shipmentId", () => {
    const api = { ...baseApiOrder(), codMixte: codMixteBlock() };
    const parsed = OrderTrackingApiSchema.parse(api);
    expect(parsed.codMixte?.shipmentId).toBe("01JSHIPMENT0000000000000000");
  });

  test("accepts a payload without shipmentId (optional)", () => {
    const block = codMixteBlock();
    delete (block as Record<string, unknown>).shipmentId;
    const parsed = OrderTrackingApiSchema.parse({ ...baseApiOrder(), codMixte: block });
    expect(parsed.codMixte?.shipmentId).toBeUndefined();
  });
});

// The stores of the order, to which the buyer can write about it. Optional
// in the payload, read entry by entry: a bad one is left out, never fails
// the tracking page.
describe("stores of the order", () => {
  const STORE_A = { id: "01jkqz3m5baxnp9c7hd2fewst1", name: "Boutique Awa" };
  const STORE_B = { id: "01jkqz3m5baxnp9c7hd2fewst2", name: "Marché Kalam" };

  const mapped = (stores: unknown) =>
    mapApiToTrackedOrder(OrderTrackingApiSchema.parse({ ...baseApiOrder(), stores }));

  test("maps each store of the order", () => {
    expect(mapped([STORE_A, STORE_B]).stores).toEqual([STORE_A, STORE_B]);
  });

  test("is empty when the payload does not carry them", () => {
    expect(mapApiToTrackedOrder(OrderTrackingApiSchema.parse(baseApiOrder())).stores).toEqual([]);
  });

  test("leaves out an entry without a store id or a name, and a store given twice", () => {
    expect(
      mapped([
        STORE_A,
        { id: null, name: "Sans id" },
        { id: "../admin", name: "Chemin" },
        { id: STORE_B.id },
        "01jkqz3m5baxnp9c7hd2fewst3",
        { ...STORE_A, name: "Boutique Awa (bis)" },
      ]).stores,
    ).toEqual([STORE_A]);
  });

  test("never fails the page when the list is not a list", () => {
    expect(mapped({ id: STORE_A.id }).stores).toEqual([]);
    expect(mapped("stores").stores).toEqual([]);
  });

  test("keeps only the id and the name of a store", () => {
    expect(mapped([{ ...STORE_A, owner_phone: "+22670000000" }]).stores).toEqual([STORE_A]);
  });
});

describe("mapApiToTrackedOrder — orders that ended without delivery", () => {
  test.each([
    ["canceled", "cancelled"],
    ["returned", "returned"],
    ["failed", "failed"],
  ] as const)("a %s order is shown %s", (statusCode, status) => {
    expect(mapApiToTrackedOrder({ ...baseApiOrder(), statusCode }).status).toBe(status);
  });
});

describe("mapApiToTrackedOrder — delivery details", () => {
  test("labels an Express delivery from its method, not from the payment method", () => {
    const express = { ...baseApiOrder(), delivery: { ...baseApiOrder().delivery, method: { label: "Moto", isExpress: true } } };
    expect(mapApiToTrackedOrder(express).shippingLabel).toBe("Express");
    expect(mapApiToTrackedOrder(express).shippingMethod).toBe("Moto (Express)");
    expect(mapApiToTrackedOrder(baseApiOrder()).shippingLabel).toBeNull();
  });

  test("gives no time slot when the backend gives none", () => {
    expect(mapApiToTrackedOrder(baseApiOrder()).estimatedTimeRange).toBeNull();
    const slot = { ...baseApiOrder(), eta: { date: "22 octobre 2026", timeRange: "Entre 8h et 12h", progress: 60 } };
    expect(mapApiToTrackedOrder(slot).estimatedTimeRange).toBe("Entre 8h et 12h");
  });

  test("writes the dates of the history in Ouagadougou time", () => {
    const api = {
      ...baseApiOrder(),
      canonical_timeline: [
        { key: "vendor_confirmed", label: "Confirmée", status: "done" as const, timestamp: "2026-12-31T23:30:00Z" },
        { key: "preparing", label: "En préparation", status: "current" as const, timestamp: "2026-02-01T09:05:00+01:00" },
      ],
    };
    const mapped = mapApiToTrackedOrder(api);
    expect(mapped.trackingSteps.map((s) => s.dateLabel)).toEqual(["31 Déc 23:30", "1 Fév 08:05", null, null]);
  });

  test("lists every shipment of the order, leaving out what it cannot read", () => {
    const shipment = (id: string, storeName: string | null = null) => ({
      id,
      storeName,
      agency: { name: "Livo", rating: 4.2 },
      method: { label: "Standard", isExpress: false },
      driver: null,
      eta: { date: null, timeRange: null },
    });
    const mapped = mapApiToTrackedOrder({
      ...baseApiOrder(),
      shipments: [shipment("S1", "Boutique Awa"), shipment("S2"), shipment("S1"), { id: "S3" }],
    });
    expect(mapped.shipments.map((s) => [s.id, s.storeName])).toEqual([
      ["S1", "Boutique Awa"],
      ["S2", null],
    ]);
    expect(mapApiToTrackedOrder(baseApiOrder()).shipments).toEqual([]);
  });
});
