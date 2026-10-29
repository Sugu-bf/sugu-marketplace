/**
 * The tracking page keeps its order until a poll brings a change it shows or
 * acts on. A change that opens a payment (the agency accepting a COD Mixte
 * order, a pay URL appearing) must count, or its button stays hidden until
 * the buyer reloads the page (P0-8).
 */
import { describe, expect, test } from "vitest";
import { hasTrackedOrderChanged } from "../hooks/useOrderPolling";
import type { TrackedOrder } from "../models/order";

type CodMixte = NonNullable<TrackedOrder["codMixte"]>;

const COD_MIXTE: CodMixte = {
  isCodMixte: true,
  deliveryFeePaid: false,
  productFeePaid: false,
  deliveryFeeAmount: 1000,
  productFeeAmount: 10000,
  deliveryFeePaidAt: null,
  productFeePaidAt: null,
  vendorConfirmedAt: "2026-10-21T09:00:00Z",
  payDeliveryFeeUrl: "https://api.sugu.test/api/v1/public/orders/01jkqz3m5baxnp9c7hd2fewyr4/pay-delivery-fee",
  payProductFeeUrl: null,
  shipmentId: null,
  agencyAccepted: false,
  currentStep: "awaiting_delivery_payment",
};

function order(codMixte: Partial<CodMixte> = {}, overrides: Partial<TrackedOrder> = {}): TrackedOrder {
  return {
    orderNumber: "SGU-2026-00042",
    status: "confirmed",
    trackingSteps: [],
    timeline: [],
    codFlowType: "mixte",
    codPrepaid: false,
    shipmentId: null,
    agencyName: "Livo",
    agencyRating: 4.5,
    shippingMethod: "Standard",
    deliveryAddress: "Ouagadougou",
    driver: null,
    estimatedDate: "À confirmer",
    estimatedTimeRange: "—",
    deliveryProgress: 10,
    items: [],
    stores: [],
    shipments: [],
    subtotal: 10000,
    shippingCost: 1000,
    shippingLabel: null,
    discount: 0,
    total: 11000,
    paymentMethod: "COD Mixte",
    paymentStatus: "cod_pending",
    codMixte: { ...COD_MIXTE, ...codMixte },
    ...overrides,
  };
}

describe("hasTrackedOrderChanged", () => {
  test("keeps the order when nothing changed", () => {
    expect(hasTrackedOrderChanged(order(), order())).toBe(false);
  });

  test("sees the agency accepting the order", () => {
    expect(hasTrackedOrderChanged(order(), order({ agencyAccepted: true }))).toBe(true);
  });

  test("sees a pay URL appear or change", () => {
    expect(hasTrackedOrderChanged(order({ payDeliveryFeeUrl: null }), order())).toBe(true);
    expect(hasTrackedOrderChanged(order(), order({ payProductFeeUrl: "https://api.sugu.test/api/v1/public/orders/x/pay-product-fee" }))).toBe(true);
  });

  test("sees the order prepaid", () => {
    expect(hasTrackedOrderChanged(order({}, { codPrepaid: false }), order({}, { codPrepaid: true }))).toBe(true);
  });

  test("sees a courier assigned to one of several shipments", () => {
    const shipment = {
      id: "01jkqz3m5baxnp9c7hd2fews01",
      storeName: "Boutique Awa",
      agencyName: "Livo",
      agencyRating: 4.5,
      shippingMethod: "Standard",
      driver: null,
      estimatedDate: null,
      estimatedTimeRange: null,
    };
    const before = order({}, { shipments: [shipment, { ...shipment, id: "01jkqz3m5baxnp9c7hd2fews02" }] });
    const after = order({}, {
      shipments: [shipment, { ...shipment, id: "01jkqz3m5baxnp9c7hd2fews02", driver: { name: "Issa", phone: null } }],
    });
    expect(hasTrackedOrderChanged(before, after)).toBe(true);
    expect(hasTrackedOrderChanged(before, before)).toBe(false);
  });

  test("still sees a status or a split payment change", () => {
    expect(hasTrackedOrderChanged(order(), order({}, { status: "shipping" }))).toBe(true);
    expect(hasTrackedOrderChanged(order(), order({ deliveryFeePaid: true }))).toBe(true);
  });
});
