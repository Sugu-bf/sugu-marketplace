/**
 * Checkout API — all network calls for the checkout flow.
 *
 * NON-NEGOTIABLE RULES:
 * - All prices/totals come from the backend (source of truth)
 * - POST/PATCH are NEVER retried
 * - Idempotency-Key required on create session + place order
 * - credentials: "include" on every request
 * - cache: "no-store" on GET session (user-specific)
 * - AbortController timeout on all requests
 * - No secrets/payment tokens exposed in frontend
 */

import { api } from "@/lib/api/client";
import { v1Url } from "@/lib/api/endpoints";
import { initCsrf } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import {
  ShowSessionResponseSchema,
  CreateSessionResponseSchema,
  ShippingOptionsResponseSchema,
  PlaceOrderResponseSchema,
} from "./checkout.schemas";
import type {
  CheckoutSessionApi,
  CreateCheckoutSessionPayload,
  PlaceOrderPayload,
  DeliveryPartner,
  DeliveryZone,
  ApplyCouponResponse,
  RemoveCouponResponse,
  PlaceOrderResponse,
  UpdateCheckoutSessionPayload,
} from "./checkout.types";
import {
  sessionIdempotencyKey,
  orderIdempotencyKey,
  withMutex,
} from "../utils/idempotency";

// ─── Constants ───────────────────────────────────────────────

const CHECKOUT_TIMEOUT_MS = 15_000; // 15s for checkout operations

// ─── GET Session ─────────────────────────────────────────────

/**
 * Fetch checkout session by ID.
 * SSR-compatible with cache: "no-store" (user-specific data).
 * Uses retry (max 2) since GET is idempotent.
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionApi> {
  const { data } = await api.get(
    v1Url(`checkout/sessions/${sessionId}`),
    {
      schema: ShowSessionResponseSchema,
      cache: "no-store",
      timeout: CHECKOUT_TIMEOUT_MS,
      retries: 2,
    } as Parameters<typeof api.get>[1]
  );

  return (data as { success: true; data: { session: CheckoutSessionApi } }).data.session;
}

// ─── UPDATE Session ──────────────────────────────────────────

/**
 * Update a checkout session with address, partner, rate selections.
 * Called before placeOrder to persist user choices on the server.
 * CSRF token required. Not retried (PATCH mutation).
 */
export async function updateCheckoutSession(
  sessionId: string,
  payload: UpdateCheckoutSessionPayload
): Promise<CheckoutSessionApi> {
  await initCsrf();

  const { data } = await api.patch(
    v1Url(`checkout/sessions/${sessionId}`),
    {
      body: payload,
      schema: ShowSessionResponseSchema,
      timeout: CHECKOUT_TIMEOUT_MS,
    }
  );

  return (data as { success: true; data: { session: CheckoutSessionApi } }).data.session;
}

// ─── CREATE Session ──────────────────────────────────────────

/**
 * Create a new checkout session.
 * Requires CSRF token first.
 * Idempotent via X-Idempotency-Key header.
 */
export async function createCheckoutSession(
  payload: CreateCheckoutSessionPayload
): Promise<{ sessionId: string; session: CheckoutSessionApi }> {
  await initCsrf();

  const idempotencyKey = sessionIdempotencyKey();

  const { data } = await api.post(
    v1Url("checkout/sessions"),
    {
      body: payload,
      schema: CreateSessionResponseSchema,
      timeout: CHECKOUT_TIMEOUT_MS,
      headers: {
        "X-Idempotency-Key": idempotencyKey,
      },
    }
  );

  const session = (data as {
    success: true;
    message: string;
    data: { session: CheckoutSessionApi };
  }).data.session;

  return { sessionId: session.id, session };
}

// ─── Shipping Options ────────────────────────────────────────

/**
 * Fetch available shipping partners and rates for a country.
 * Cacheable GET — retried on failure.
 */
export async function getShippingOptions(
  countryCode: string = "BF",
  zoneId?: string
): Promise<{ partners: DeliveryPartner[]; zones: DeliveryZone[] }> {
  const params: Record<string, string> = { country_code: countryCode };
  if (zoneId) params.zone_id = zoneId;

  const qs = new URLSearchParams(params).toString();
  const url = v1Url(`checkout/shipping-options`) + (qs ? `?${qs}` : "");

  const { data } = await api.get(url, {
    schema: ShippingOptionsResponseSchema,
    cache: "no-store",
    timeout: CHECKOUT_TIMEOUT_MS,
    retries: 2,
  } as Parameters<typeof api.get>[1]);

  const response = data as {
    success: true;
    message: string;
    data: { zones: DeliveryZone[]; partners: DeliveryPartner[] };
  };

  return {
    partners: response.data.partners,
    zones: response.data.zones,
  };
}

// ─── Apply Coupon ────────────────────────────────────────────

/**
 * Apply a coupon code (on the cart, not the session).
 * Returns the refreshed cart with updated totals.
 */
export async function applyCoupon(
  code: string
): Promise<ApplyCouponResponse> {
  await initCsrf();

  const { data } = await api.post<ApplyCouponResponse>(
    v1Url("cart/coupon/apply"),
    {
      body: { code },
      timeout: CHECKOUT_TIMEOUT_MS,
    }
  );

  return data;
}

// ─── Remove Coupon ───────────────────────────────────────────

/**
 * Remove applied coupon from the cart.
 */
export async function removeCoupon(): Promise<RemoveCouponResponse> {
  await initCsrf();

  const { data } = await api.post<RemoveCouponResponse>(
    v1Url("cart/coupon/remove"),
    {
      timeout: CHECKOUT_TIMEOUT_MS,
    }
  );

  return data;
}

// ─── Place Order ─────────────────────────────────────────────

/**
 * Place an order — the critical payment action.
 *
 * SAFETY:
 * - Mutex prevents double-submit
 * - Idempotency-Key protects against network retries creating duplicate orders
 * - CSRF token refreshed before call
 * - POST is NEVER retried on failure
 *
 * @returns Order details + payment URL (if Moneroo)
 */
export async function placeOrder(
  payload: PlaceOrderPayload
): Promise<PlaceOrderResponse["data"]> {
  return withMutex(`placeOrder:${payload.checkout_session_id}`, async () => {
    await initCsrf();

    const idempotencyKey = orderIdempotencyKey(payload.checkout_session_id);

    const { data } = await api.post(
      v1Url("checkout/orders"),
      {
        body: payload,
        schema: PlaceOrderResponseSchema,
        timeout: CHECKOUT_TIMEOUT_MS,
        retries: 0, // NEVER retry POST that creates an order
        headers: {
          "X-Idempotency-Key": idempotencyKey,
        },
      }
    );

    return (data as PlaceOrderResponse).data;
  });
}

// ─── Error Helpers ───────────────────────────────────────────

/**
 * Check if an error is a stock/price conflict (409).
 */
export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

/**
 * Check if an error is a session expired/converted error.
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.status === 422 &&
    (error.message.includes("expired") || error.message.includes("converted"))
  );
}

/**
 * Map API errors to user-friendly checkout messages.
 */
export function checkoutErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }

  switch (error.code) {
    case "CONFLICT":
      return "Le stock ou les prix ont changé. Veuillez rafraîchir la page.";
    case "VALIDATION_ERROR":
      return error.message || "Veuillez corriger les erreurs du formulaire.";
    case "UNAUTHORIZED":
      return "Votre session a expiré. Veuillez vous reconnecter.";
    case "TIMEOUT":
    case "NETWORK_ERROR":
      return "Problème de connexion. Vérifiez votre réseau et réessayez.";
    case "RATE_LIMITED":
      return "Trop de tentatives. Veuillez patienter un moment.";
    default:
      return error.message || "Erreur serveur. Veuillez réessayer plus tard.";
  }
}
