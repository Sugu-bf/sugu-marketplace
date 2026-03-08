/**
 * Cart Query Functions — entry points for data fetching.
 *
 * SSR: Called from Server Components with cookie forwarding.
 * Client: useCart hook handles all client-side fetching.
 *
 * When API is unreachable, returns an empty cart (graceful degradation).
 */

import { fetchCartSSR } from "../api/cart.api";
import type { CartUI } from "../api/cart.types";
import { parseCartTokenFromCookieHeader } from "../utils/cart-cookie";
import { headers } from "next/headers";

// ─── Empty cart fallback ─────────────────────────────────────

const EMPTY_CART: CartUI = {
  lines: [],
  totals: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    shippingDiscount: 0,
    fees: 0,
    total: 0,
    itemCount: 0,
    qtyTotal: 0,
    currency: "XOF",
    shippingFree: true,
  },
  couponCode: null,
  warnings: [],
  isEmpty: true,
};

/**
 * Fetch the cart for SSR rendering.
 *
 * Forwards cookies from the incoming request so the backend can
 * identify the user/guest cart. Uses `cache: "no-store"` because
 * the cart is user-specific.
 *
 * CART TOKEN FORWARDING:
 * The guest cart token is stored client-side in a first-party cookie
 * `sugu_cart_token` (mirrored from localStorage by cart-token.ts).
 * We extract it here and pass it as `X-Cart-Token` header to the
 * backend, since the API-domain cookie (guest_cart, SameSite=Lax)
 * is NOT available during cross-domain SSR fetches.
 *
 * On error (network, auth, etc.), returns an empty cart to avoid
 * blocking the page render.
 */
export async function queryCart(): Promise<CartUI> {
  try {
    const headerStore = await headers();
    const cookieHeader = headerStore.get("cookie") ?? undefined;

    // Extract guest cart token from the frontend-domain cookie
    const cartToken = parseCartTokenFromCookieHeader(cookieHeader);

    return await fetchCartSSR(cookieHeader, cartToken);
  } catch (error) {
    // Graceful degradation — render empty cart on SSR failure.
    // The client will refetch on mount.
    console.error("[Cart SSR] Failed to fetch cart:", (error as Error)?.message ?? error);
    return EMPTY_CART;
  }
}

