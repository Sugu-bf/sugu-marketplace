// @vitest-environment jsdom
/**
 * Checkout hardening (audit P0-7, P0-14, P1-23, checkout mediums):
 * - every session call carries the guest cart token;
 * - placing the order of one session always uses the same idempotency key;
 * - only the rates of the address's zone are offered;
 * - the coupon and the totals shown are the server's, COD fee included;
 * - a 409 PRICE_CHANGED is told apart from other conflicts;
 * - the payment method asked for in the URL is the one selected.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/errors";
import {
  getCheckoutSession,
  placeOrder,
  isPriceChangedError,
  isSessionExpiredError,
} from "../api/checkout.api";
import { orderIdempotencyKey } from "../utils/idempotency";
import { mapRatesToShippingMethods } from "../components/CheckoutOrchestrator";
import { CheckoutOrderSummary } from "../components/CheckoutOrderSummary";
import type { DeliveryPartner } from "../api/checkout.types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api/auth", () => ({ initCsrf: vi.fn().mockResolvedValue(undefined) }));

const SESSION_ID = "01KJA14C5FC6Y58Q8JX355NP1T";

function sessionPayload() {
  return {
    success: true,
    data: {
      session: {
        id: SESSION_ID,
        status: "active",
        currency: "XOF",
        totals: {
          subtotal: 10000,
          discount_amount: 0,
          tax_amount: 0,
          shipping_amount: 1500,
          fees_amount: 0,
          grand_total: 11500,
          currency: "XOF",
        },
        warnings: null,
        expires_at: "2026-10-29T12:00:00Z",
      },
    },
  };
}

describe("session calls carry the guest cart token", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.setItem("sugu:cart-token", "guest-token-123");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  function headersOf(call: unknown[]): Headers {
    const init = call[1] as RequestInit | undefined;
    return new Headers(init?.headers);
  }

  test("GET session sends X-Cart-Token", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(sessionPayload()), { status: 200, headers: { "Content-Type": "application/json" } }));

    await getCheckoutSession(SESSION_ID);

    expect(headersOf(fetchMock.mock.calls[0]).get("X-Cart-Token")).toBe("guest-token-123");
  });

  test("placing the order sends X-Cart-Token and the session's stable key", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false, message: "Session non trouvée." }), { status: 422, headers: { "Content-Type": "application/json" } }));

    await expect(placeOrder({ checkout_session_id: SESSION_ID, payment_method: "cod" })).rejects.toBeInstanceOf(ApiError);
    await expect(placeOrder({ checkout_session_id: SESSION_ID, payment_method: "cod" })).rejects.toBeInstanceOf(ApiError);

    const [first, second] = fetchMock.mock.calls.map(headersOf);
    expect(first.get("X-Cart-Token")).toBe("guest-token-123");
    expect(first.get("X-Idempotency-Key")).toBe(`po_${SESSION_ID}`);
    expect(second.get("X-Idempotency-Key")).toBe(first.get("X-Idempotency-Key"));
  });
});

describe("idempotency of placing an order", () => {
  test("one key per session, long enough for the server", () => {
    expect(orderIdempotencyKey(SESSION_ID)).toBe(orderIdempotencyKey(SESSION_ID));
    expect(orderIdempotencyKey(SESSION_ID).length).toBeGreaterThanOrEqual(16);
    expect(orderIdempotencyKey("01KJA14C5FC6Y58Q8JX355NP2Z")).not.toBe(orderIdempotencyKey(SESSION_ID));
  });
});

describe("rates offered", () => {
  const partners = [
    {
      id: "p1",
      name: "Agence",
      code: "AG",
      logo_url: null,
      contact_phone: null,
      rating_avg: 4,
      rating_count: 1,
      capabilities: [],
      services: [],
      rates: [
        { id: "r-ouaga", zone_id: "z-ouaga", zone_name: "Ouaga 2000", service_id: null, service_name: null, service_code: null, flat_amount: 2500, currency: "XOF", min_weight_grams: 0, max_weight_grams: 5000, cod_supported: true },
        { id: "r-bobo", zone_id: "z-bobo", zone_name: "Bobo", service_id: null, service_name: null, service_code: null, flat_amount: 500, currency: "XOF", min_weight_grams: 0, max_weight_grams: 5000, cod_supported: true },
      ],
    },
  ] as DeliveryPartner[];

  test("only the rates of the address's zone", () => {
    expect(mapRatesToShippingMethods(partners, "z-ouaga").map((m) => m.id)).toEqual(["r-ouaga"]);
  });

  test("none until the zone is known", () => {
    expect(mapRatesToShippingMethods(partners, null)).toEqual([]);
  });
});

describe("errors told apart", () => {
  test("PRICE_CHANGED is a price change, OUT_OF_STOCK is not", () => {
    const priceChanged = new ApiError({ status: 409, code: "CONFLICT", message: "Le total a changé", details: { errorCode: "PRICE_CHANGED" } });
    const outOfStock = new ApiError({ status: 409, code: "CONFLICT", message: "Rupture", details: { errorCode: "OUT_OF_STOCK" } });
    expect(isPriceChangedError(priceChanged)).toBe(true);
    expect(isPriceChangedError(outOfStock)).toBe(false);
  });

  test("the French expired message is a session expiry", () => {
    const err = new ApiError({ status: 422, code: "VALIDATION_ERROR", message: "La session de paiement a expiré. Veuillez recommencer depuis le panier." });
    expect(isSessionExpiredError(err)).toBe(true);
  });
});

describe("order summary shows the server's truth", () => {
  const base = {
    items: [],
    subtotal: 10000,
    shippingCost: 1500,
    discount: 0,
    total: 11500,
    onPaymentMethodChange: vi.fn(),
  };

  test("the COD fee is shown before placing, and in the total", () => {
    render(<CheckoutOrderSummary {...base} codFee={500} couponCode={null} paymentMethod="cod" />);

    expect(screen.getByText("Frais de paiement à la livraison")).toBeInTheDocument();
    expect(screen.getByText(/12[\s ]?000/)).toBeInTheDocument();
  });

  test("online payment preselected from the URL, without the COD fee", () => {
    render(<CheckoutOrderSummary {...base} codFee={500} couponCode={null} paymentMethod="ligdicash" />);

    expect(screen.getByRole("radio", { name: /Paiement mobile/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Frais de paiement à la livraison")).not.toBeInTheDocument();
  });

  test("a coupon the server did not apply says why", () => {
    render(
      <CheckoutOrderSummary
        {...base}
        couponCode="BOUTIQUE10"
        couponStatus={{ code: "BOUTIQUE10", applied: false, reason: "Le panier doit contenir au moins 3 article(s)." }}
        paymentMethod="cod"
      />
    );

    expect(screen.getByText(/Coupon non appliqué/)).toHaveTextContent("au moins 3 article(s)");
  });
});
