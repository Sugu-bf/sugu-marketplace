/**
 * Cart API — all cart operations go through this module.
 *
 * RULES:
 * - All calls use the central `api` client (lib/api).
 * - No fetch() directly in UI components.
 * - Backend is the source of truth for totals/prices.
 * - Mutations (POST/PATCH/DELETE) are NEVER retried.
 * - GET requests have automatic retry (max 2) via the client.
 * - All errors are normalized to ApiError.
 * - CSRF is handled automatically by the client.
 *
 * TOKEN STRATEGY:
 * The `guest_cart` cookie uses SameSite=Lax, which browsers do NOT send
 * on cross-site fetch() (sugu.pro → api.mysugu.com). To work around this,
 * we persist the cart token in localStorage and send it as `X-Cart-Token`
 * header. The backend's CartResolver already accepts this header.
 */

import { api, v1Url, isApiError } from "@/lib/api";
import {
  ApiCartResponseSchema,
  ApiCouponApplyResponseSchema,
  ApiCouponRemoveResponseSchema,
  ApiCheckoutSessionResponseSchema,
  ApiPlaceOrderResponseSchema,
} from "./cart.schemas";
import type {
  ApiCartLine,
  ApiCartResponse,
  CartUI,
  CartLineUI,
  CartTotalsUI,
  CartWarning,
} from "./cart.types";
import { saveCartToken, withCartTokenHeader } from "./cart-token";

// ─── Mappers ─────────────────────────────────────────────────

/** Map a backend cart line to a UI-friendly shape */
function mapLineToUI(line: ApiCartLine): CartLineUI {
  return {
    id: line.id,
    productId: line.product_id,
    variantId: line.variant_id,
    slug: line.product_slug ?? null,
    name: line.name,
    image: line.image ?? null,
    variantTitle: line.variant_title ?? null,
    qty: line.qty,
    unitPrice: line.unit_price,
    compareAtPrice: line.compare_at_price,
    lineTotal: line.line_total,
    currency: line.currency,
    flags: line.flags,
    isOnSale: line.is_on_sale ?? false,
  };
}

/** Map backend totals to UI shape */
function mapTotalsToUI(
  totals: ApiCartResponse["data"]["totals"],
  currency: string
): CartTotalsUI {
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    shippingDiscount: totals.shipping_discount ?? 0,
    fees: totals.fees ?? 0,
    total: totals.total,
    itemCount: totals.item_count,
    qtyTotal: totals.qty_total,
    currency,
    shippingFree: totals.shipping === 0,
  };
}

/** Map a full API response to a CartUI + persist the token */
function mapApiResponseToCartUI(responseData: ApiCartResponse): CartUI {
  const currency = responseData.meta?.currency ?? "XOF";

  // Persist cart token for future cross-site requests
  const cartToken = responseData.meta?.cart_token;
  if (cartToken) {
    saveCartToken(cartToken);
  }

  return {
    lines: responseData.data.items.map(mapLineToUI),
    totals: mapTotalsToUI(responseData.data.totals, currency),
    couponCode: null,
    warnings: responseData.warnings ?? [],
    isEmpty: responseData.data.items.length === 0,
  };
}

// Note: CSRF initialization removed — not needed for cross-domain Bearer token auth.
// Protection is provided by Bearer token + Content-Type: application/json + CORS.

// ─── GET Cart ────────────────────────────────────────────────

/**
 * Fetch the full cart.
 * SSR: called from Server Component with `cache: "no-store"`.
 * Client: called after mutations to reconcile state.
 */
export async function fetchCart(signal?: AbortSignal): Promise<CartUI> {
  const url = v1Url("cart");
  const { data } = await api.get(url, {
    schema: ApiCartResponseSchema,
    cache: "no-store",
    headers: withCartTokenHeader(),
    signal,
  });
  return mapApiResponseToCartUI(data);
}

/**
 * Fetch cart for SSR (Server Component).
 * Forwards cookies from the incoming request.
 *
 * @param cookieHeader - Raw `Cookie` header from the incoming request (for auth).
 * @param cartToken    - Guest cart token extracted from the frontend-domain cookie
 *                       `sugu_cart_token`. When present, sent as `X-Cart-Token` so
 *                       the backend's CartResolver can identify the guest cart.
 *                       Without this, cross-domain SSR requests result in a new
 *                       empty cart being created every time.
 */
export async function fetchCartSSR(cookieHeader?: string, cartToken?: string | null): Promise<CartUI> {
  const url = v1Url("cart");

  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  if (cartToken) {
    headers["X-Cart-Token"] = cartToken;
  }

  const { data } = await api.get(url, {
    schema: ApiCartResponseSchema,
    cache: "no-store",
    headers,
  });
  return mapApiResponseToCartUI(data);
}

// ─── Update Line Qty ─────────────────────────────────────────

/**
 * Update a cart line's quantity. Returns the full refreshed cart.
 * The caller MUST serialize calls per line (last-write-wins / abort previous).
 */
export async function updateLineQty(
  lineId: number,
  qty: number,
  signal?: AbortSignal
): Promise<CartUI> {
  const url = v1Url(`cart/items/${lineId}`);
  const { data } = await api.patch(url, {
    body: { qty },
    schema: ApiCartResponseSchema,
    headers: withCartTokenHeader(),
    signal,
    retries: 0,
  });
  return mapApiResponseToCartUI(data);
}

// ─── Remove Line ─────────────────────────────────────────────

/**
 * Remove a line from the cart. Returns the full refreshed cart.
 */
export async function removeLine(
  lineId: number,
  signal?: AbortSignal
): Promise<CartUI> {
  const url = v1Url(`cart/items/${lineId}`);
  const { data } = await api.delete(url, {
    schema: ApiCartResponseSchema,
    headers: withCartTokenHeader(),
    signal,
    retries: 0,
  });
  return mapApiResponseToCartUI(data);
}

// ─── Clear Cart ──────────────────────────────────────────────

/**
 * Clear the entire cart. Returns the empty cart state.
 */
export async function clearCart(signal?: AbortSignal): Promise<CartUI> {
  const url = v1Url("cart");
  const { data } = await api.delete(url, {
    schema: ApiCartResponseSchema,
    headers: withCartTokenHeader(),
    signal,
    retries: 0,
  });
  return mapApiResponseToCartUI(data);
}

// ─── Apply Coupon ────────────────────────────────────────────

export interface CouponResult {
  cart: CartUI;
  message: string;
  couponCode: string | null;
}

/**
 * Apply a coupon code. Returns updated cart + confirmation message.
 */
export async function applyCoupon(
  code: string,
  signal?: AbortSignal
): Promise<CouponResult> {
  const url = v1Url("cart/coupon/apply");
  const { data } = await api.post(url, {
    body: { code },
    schema: ApiCouponApplyResponseSchema,
    headers: withCartTokenHeader(),
    signal,
    retries: 0,
  });

  let cart: CartUI;
  if (data.cart) {
    cart = {
      lines: data.cart.items.map(mapLineToUI),
      totals: mapTotalsToUI(data.cart.totals, "XOF"),
      couponCode: data.coupon?.code ?? code,
      warnings: data.cart.warnings ?? [],
      isEmpty: data.cart.items.length === 0,
    };
  } else {
    cart = await fetchCart(signal);
    cart.couponCode = data.coupon?.code ?? code;
  }

  return {
    cart,
    message: data.message,
    couponCode: data.coupon?.code ?? code,
  };
}

// ─── Remove Coupon ───────────────────────────────────────────

/**
 * Remove the applied coupon. Returns updated cart.
 */
export async function removeCoupon(
  signal?: AbortSignal
): Promise<CouponResult> {
  const url = v1Url("cart/coupon/remove");
  const { data } = await api.post(url, {
    schema: ApiCouponRemoveResponseSchema,
    headers: withCartTokenHeader(),
    signal,
    retries: 0,
  });

  let cart: CartUI;
  if (data.cart) {
    cart = {
      lines: data.cart.items.map(mapLineToUI),
      totals: mapTotalsToUI(data.cart.totals, "XOF"),
      couponCode: null,
      warnings: data.cart.warnings ?? [],
      isEmpty: data.cart.items.length === 0,
    };
  } else {
    cart = await fetchCart(signal);
    cart.couponCode = null;
  }

  return {
    cart,
    message: data.message,
    couponCode: null,
  };
}

// ─── Create Checkout Session ─────────────────────────────────

export interface CheckoutSessionResult {
  sessionId: string;
  status: string;
  expiresAt: string;
}

/**
 * Create a checkout session. Returns session ID for navigation.
 */
export async function createCheckoutSession(
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<CheckoutSessionResult> {
  const url = v1Url("checkout/sessions");
  const { data } = await api.post(url, {
    schema: ApiCheckoutSessionResponseSchema,
    headers: withCartTokenHeader({ "X-Idempotency-Key": idempotencyKey }),
    signal,
    retries: 0,
  });

  return {
    sessionId: data.data.session.id,
    status: data.data.session.status,
    expiresAt: data.data.session.expires_at,
  };
}

// ─── Place Order (Mobile Money / Direct) ─────────────────────

export interface PlaceOrderResult {
  orderId: string | number;
  orderNumber: string;
  paymentUrl: string | null;
  nextStep: string;
  isCod: boolean;
}

/**
 * Place an order. Returns order details + payment redirect URL if applicable.
 */
export async function placeOrder(
  params: Record<string, unknown>,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<PlaceOrderResult> {
  const url = v1Url("checkout/orders");
  const { data } = await api.post(url, {
    body: params,
    schema: ApiPlaceOrderResponseSchema,
    headers: withCartTokenHeader({ "X-Idempotency-Key": idempotencyKey }),
    signal,
    retries: 0,
  });

  return {
    orderId: data.data.order.id,
    orderNumber: data.data.order.number,
    paymentUrl: data.data.payment_url ?? null,
    nextStep: data.data.next_step ?? "redirect_to_payment",
    isCod: data.data.order.is_cod ?? false,
  };
}

// ─── Utilities ───────────────────────────────────────────────

/** Generate a unique idempotency key */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Check if an error is a stock conflict (409) */
export function isStockConflict(error: unknown): boolean {
  return isApiError(error) && error.status === 409;
}

/** Check if an error is a validation error (422) */
export function isValidationError(error: unknown): boolean {
  return isApiError(error) && error.status === 422;
}

/** Extract user-friendly error message */
export function getCartErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}
