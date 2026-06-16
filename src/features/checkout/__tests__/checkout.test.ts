/**
 * Checkout Feature Tests — Zod validation, idempotency, error mapping.
 *
 * These are unit tests for the checkout API layer.
 */

import { describe, test, expect } from "vitest";
import {
  CheckoutSessionApiSchema,
  PricingSnapshotSchema,
  CheckoutWarningSchema,
  PlaceOrderResponseSchema,
  ShowSessionResponseSchema,
  ShippingOptionsResponseSchema,
  CreateSessionResponseSchema,
  DeliveryPartnerSchema,
} from "../api/checkout.schemas";
import {
  generateIdempotencyKey,
  sessionIdempotencyKey,
  orderIdempotencyKey,
  acquireMutex,
  releaseMutex,
} from "../utils/idempotency";
import { checkoutErrorMessage } from "../api/checkout.api";
import { ApiError } from "@/lib/api/errors";

// ═══════════════════════════════════════════════════════════════
// Zod Schema Validation Tests
// ═══════════════════════════════════════════════════════════════

describe("Checkout Zod Schemas", () => {
  describe("PricingSnapshotSchema", () => {
    test("accepts valid pricing snapshot", () => {
      const data = {
        subtotal: 12500,
        discount_amount: 1200,
        tax_amount: 0,
        shipping_amount: 0,
        fees_amount: 0,
        grand_total: 11300,
        currency: "XOF",
      };
      const result = PricingSnapshotSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test("accepts pricing with line items", () => {
      const data = {
        subtotal: 5000,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 1500,
        fees_amount: 0,
        grand_total: 6500,
        currency: "XOF",
        lineItems: [
          {
            product_id: "abc123",
            variant_id: "var456",
            vendor_id: "store789",
            name: "Mangues Kent",
            qty: 2,
            unit_price: 2500,
            line_subtotal: 5000,
            line_discount: 0,
            line_tax: 0,
            line_total: 5000,
          },
        ],
      };
      const result = PricingSnapshotSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test("rejects missing required fields", () => {
      const data = {
        subtotal: 5000,
        // missing grand_total, currency, etc.
      };
      const result = PricingSnapshotSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("CheckoutSessionApiSchema", () => {
    test("accepts valid session response", () => {
      const data = {
        id: "01k123abc",
        status: "active",
        currency: "XOF",
        totals: {
          subtotal: 12500,
          discount_amount: 1200,
          tax_amount: 0,
          shipping_amount: 0,
          fees_amount: 0,
          grand_total: 11300,
          currency: "XOF",
        },
        warnings: null,
        expires_at: "2026-02-25T10:00:00Z",
        is_active: true,
      };
      const result = CheckoutSessionApiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test("accepts session with warnings", () => {
      const data = {
        id: "01k123abc",
        status: "active",
        currency: "XOF",
        totals: {
          subtotal: 12500,
          discount_amount: 0,
          tax_amount: 0,
          shipping_amount: 0,
          fees_amount: 0,
          grand_total: 12500,
          currency: "XOF",
        },
        warnings: [
          {
            type: "stock_limited",
            variant_id: "var1",
            product_id: "prod1",
            available: 2,
            requested: 5,
          },
        ],
        expires_at: "2026-02-25T10:00:00Z",
      };
      const result = CheckoutSessionApiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("CheckoutWarningSchema", () => {
    test("accepts stock_limited warning", () => {
      const data = {
        type: "stock_limited",
        variant_id: "v1",
        product_id: "p1",
        available: 3,
        requested: 10,
      };
      expect(CheckoutWarningSchema.safeParse(data).success).toBe(true);
    });

    test("accepts price_changed warning", () => {
      const data = {
        type: "price_changed",
        variant_id: null,
        product_id: "p2",
        old_price: 5000,
        new_price: 5500,
      };
      expect(CheckoutWarningSchema.safeParse(data).success).toBe(true);
    });

    test("rejects invalid type", () => {
      const data = {
        type: "invalid_type",
        variant_id: "v1",
        product_id: "p1",
      };
      expect(CheckoutWarningSchema.safeParse(data).success).toBe(false);
    });
  });

  describe("PlaceOrderResponseSchema", () => {
    test("accepts COD order response", () => {
      const data = {
        success: true,
        message: "Commande créée avec succès.",
        data: {
          order: {
            id: "order_123",
            number: "SU-2026-000001",
            status: "confirmed",
            payment_status: "unpaid",
            total_amount: 11300,
            currency: "XOF",
            items_count: 3,
            is_cod: true,
            placed_at: "2026-02-25T09:30:00Z",
            guest_order_token: null,
          },
          payment_transaction: {
            id: "ptx_123",
            provider: "cod",
            status: "pending",
            amount: 11300,
            currency: "XOF",
          },
          payment_url: null,
          next_step: "order_confirmed",
        },
      };
      const result = PlaceOrderResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test("accepts LigdiCash payment response", () => {
      const data = {
        success: true,
        message: "Commande créée avec succès.",
        data: {
          order: {
            id: "order_456",
            number: "SU-2026-000002",
            status: "pending",
            payment_status: "pending",
            total_amount: 15000,
            currency: "XOF",
            items_count: 2,
            is_cod: false,
            placed_at: "2026-02-25T09:31:00Z",
            guest_order_token: "abc123token",
          },
          payment_transaction: {
            id: "ptx_456",
            provider: "ligdicash",
            status: "initiated",
            amount: 15000,
            currency: "XOF",
          },
          payment_url: "https://app.ligdicash.com/checkout/xxx",
          next_step: "redirect_to_payment",
        },
      };
      const result = PlaceOrderResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // G1 — provider-agnostic front: a "sugupay" online response is accepted exactly
    // like "ligdicash" (additive — "ligdicash" is NOT removed, double-run period).
    test("accepts SuguPay payment response (provider-agnostic, additive)", () => {
      const data = {
        success: true,
        message: "Commande créée avec succès.",
        data: {
          order: {
            id: "order_457",
            number: "SU-2026-000004",
            status: "pending",
            payment_status: "pending",
            total_amount: 15000,
            currency: "XOF",
            items_count: 2,
            is_cod: false,
            placed_at: "2026-02-25T09:31:00Z",
            guest_order_token: "abc123token",
          },
          payment_transaction: {
            id: "ptx_457",
            provider: "sugupay", // new provider, accepted without removing "ligdicash"
            status: "initiated",
            amount: 15000,
            currency: "XOF",
          },
          payment_url: "https://pay.sugupay.test/checkout/yyy",
          next_step: "redirect_to_payment",
        },
      };
      const result = PlaceOrderResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // G1 — double-run parity: the post-order redirect decision is a pure function of
    // next_step + payment_url, NEVER of the provider. A "ligdicash" and a "sugupay"
    // online response therefore drive the EXACT same redirection, and COD routes to
    // order tracking via next_step. This is what makes the provider cutover (I3) a
    // pure backend flag flip with no simultaneous front deployment.
    test("redirection is provider-agnostic (ligdicash & sugupay identical, COD → track)", () => {
      // Mirrors CheckoutOrchestrator's decision (keyed ONLY on next_step + payment_url).
      const redirectDecision = (d: { next_step: string; payment_url: string | null }) =>
        d.next_step === "redirect_to_payment" && d.payment_url
          ? { type: "redirect" as const, url: d.payment_url }
          : { type: "track" as const };

      const onlineResponse = (provider: string, url: string) => ({
        success: true,
        message: "ok",
        data: {
          order: {
            id: "o",
            number: "SU-1",
            status: "pending",
            payment_status: "pending",
            total_amount: 15000,
            currency: "XOF",
            items_count: 1,
            is_cod: false,
            placed_at: null,
            guest_order_token: null,
          },
          payment_transaction: { id: "p", provider, status: "initiated", amount: 15000, currency: "XOF" },
          payment_url: url,
          next_step: "redirect_to_payment" as const,
        },
      });

      const ligdi = PlaceOrderResponseSchema.parse(
        onlineResponse("ligdicash", "https://app.ligdicash.com/checkout/xxx")
      );
      const sugu = PlaceOrderResponseSchema.parse(
        onlineResponse("sugupay", "https://pay.sugupay.test/checkout/yyy")
      );

      // Both parse and both redirect — identical decision regardless of provider.
      expect(redirectDecision(ligdi.data).type).toBe("redirect");
      expect(redirectDecision(sugu.data).type).toBe("redirect");
      expect(redirectDecision(ligdi.data).type).toBe(redirectDecision(sugu.data).type);

      // COD: keyed on next_step → routes to tracking, no payment redirect.
      const cod = PlaceOrderResponseSchema.parse({
        success: true,
        message: "ok",
        data: {
          order: {
            id: "o2",
            number: "SU-2",
            status: "pending",
            payment_status: "unpaid",
            total_amount: 90000,
            currency: "XOF",
            items_count: 1,
            is_cod: true,
            placed_at: null,
            guest_order_token: null,
          },
          payment_transaction: null,
          payment_url: null,
          next_step: "order_confirmed" as const,
        },
      });
      expect(redirectDecision(cod.data).type).toBe("track");
    });

    // Backend contract: COD Legacy and COD Mixte share the same placeOrder
    // response shape — is_cod=true, next_step="order_confirmed", payment_url=null.
    // Legacy carries status="confirmed" (auto-confirmed), Mixte carries
    // status="pending" (awaiting vendor stock confirmation). The Legacy/Mixte
    // distinction is NOT made at place-order time on the frontend; it surfaces
    // later via cod_flow_type on the orders list and codMixte on tracking.
    test("accepts COD Mixte order response (same shape as Legacy, status='pending')", () => {
      const data = {
        success: true,
        message: "Commande créée avec succès.",
        data: {
          order: {
            id: "order_789",
            number: "SU-2026-000003",
            status: "pending",
            payment_status: "unpaid",
            total_amount: 90000,
            currency: "XOF",
            items_count: 4,
            is_cod: true,
            placed_at: "2026-02-25T09:32:00Z",
            guest_order_token: null,
          },
          payment_transaction: {
            id: "ptx_789",
            provider: "cod",
            status: "pending",
            amount: 90000,
            currency: "XOF",
          },
          payment_url: null,
          next_step: "order_confirmed",
        },
      };
      const result = PlaceOrderResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("DeliveryPartnerSchema", () => {
    test("accepts valid partner with rates", () => {
      const data = {
        id: "partner_1",
        name: "Livo Express",
        code: "livo",
        logo_url: "https://cdn.sugu.pro/logos/livo.png",
        contact_phone: "+226 70 00 00 00",
        rating_avg: 4.7,
        rating_count: 1243,
        capabilities: ["express", "cod"],
        services: [{ id: "s1", name: "Standard", code: "standard" }],
        rates: [
          {
            id: "r1",
            zone_id: "z1",
            zone_name: "Ouagadougou",
            service_id: "s1",
            service_name: "Standard",
            service_code: "standard",
            flat_amount: 1500,
            currency: "XOF",
            min_weight_grams: 0,
            max_weight_grams: 50000,
            cod_supported: true,
          },
        ],
      };
      const result = DeliveryPartnerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Idempotency Key Tests
// ═══════════════════════════════════════════════════════════════

describe("Idempotency Utils", () => {
  test("generates unique keys", () => {
    const key1 = generateIdempotencyKey("test");
    const key2 = generateIdempotencyKey("test");
    expect(key1).not.toBe(key2);
  });

  test("generates session keys with prefix", () => {
    const key = sessionIdempotencyKey();
    expect(key.startsWith("cs_")).toBe(true);
  });

  test("generates order keys with session prefix", () => {
    const key = orderIdempotencyKey("01kja14c5fc6y58q8jx355np1t");
    expect(key.startsWith("po_01kja14c")).toBe(true);
  });

  test("mutex prevents double acquisition", () => {
    const key = "test:mutex:1";
    expect(acquireMutex(key)).toBe(true);
    expect(acquireMutex(key)).toBe(false); // Already held
    releaseMutex(key);
    expect(acquireMutex(key)).toBe(true); // Released, can acquire again
    releaseMutex(key);
  });

  test("mutex releases after use", () => {
    const key = "test:mutex:2";
    acquireMutex(key);
    releaseMutex(key);
    expect(acquireMutex(key)).toBe(true);
    releaseMutex(key);
  });
});

// ═══════════════════════════════════════════════════════════════
// Error Mapping Tests
// ═══════════════════════════════════════════════════════════════

describe("Error Mapping", () => {
  test("maps 409 CONFLICT to stock/price message", () => {
    const err = new ApiError({
      status: 409,
      code: "CONFLICT",
      message: "Stock insuffisant",
    });
    const msg = checkoutErrorMessage(err);
    expect(msg).toContain("stock");
  });

  test("maps 422 VALIDATION_ERROR to form message", () => {
    const err = new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "L'identifiant de session de paiement est requis.",
    });
    const msg = checkoutErrorMessage(err);
    expect(msg).toBe("L'identifiant de session de paiement est requis.");
  });

  test("maps 401 UNAUTHORIZED to reconnect message", () => {
    const err = new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthenticated",
    });
    const msg = checkoutErrorMessage(err);
    expect(msg).toContain("session");
  });

  test("maps TIMEOUT to network message", () => {
    const err = new ApiError({
      status: 0,
      code: "TIMEOUT",
      message: "timeout",
    });
    const msg = checkoutErrorMessage(err);
    expect(msg).toContain("connexion");
  });

  test("maps NETWORK_ERROR to network message", () => {
    const err = new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "network",
    });
    const msg = checkoutErrorMessage(err);
    expect(msg).toContain("connexion");
  });

  test("maps unknown error to generic message", () => {
    const msg = checkoutErrorMessage(new Error("something weird"));
    expect(msg).toContain("inattendue");
  });
});
