/**
 * Cart Token Manager — persists the guest cart token in localStorage
 * AND in a first-party cookie for SSR access.
 *
 * WHY: The `guest_cart` cookie is set with SameSite=Lax on the API domain
 * (api.mysugu.com). Cross-site fetch() from the frontend domain (sugu.pro)
 * does NOT send SameSite=Lax cookies. So the cookie never reaches the API
 * on client-side fetches.
 *
 * SOLUTION: The backend includes `meta.cart_token` in every cart response
 * and also checks for an `X-Cart-Token` header. We persist the token in:
 *   1. localStorage — for client-side reads (withCartTokenHeader)
 *   2. `sugu_cart_token` cookie on the frontend domain — for SSR reads
 *      (queryCart in Server Components can read this via headers())
 *
 * NOTE: Uses the same storage key as `cart-storage.ts` ("sugu:cart-token")
 * so that tokens saved from addToCart (product detail) are shared with
 * the cart page's fetchCart calls.
 */

import { setCartCookie, clearCartCookie } from "../utils/cart-cookie";

const STORAGE_KEY = "sugu:cart-token";

/** Save the cart token (called after every successful cart API response) */
export function saveCartToken(token: string | undefined | null): void {
  if (typeof window === "undefined") return;
  if (!token) return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // localStorage full or blocked — silent fail
  }
  // Mirror to first-party cookie so Next.js SSR can read it
  setCartCookie(token);
}

/** Read the stored cart token */
export function getCartToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored cart token (e.g. after checkout or logout) */
export function clearCartToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
  // Also remove the first-party cookie
  clearCartCookie();
}

/**
 * Build headers that include the cart token if available.
 * Merges with any existing headers.
 */
export function withCartTokenHeader(
  existingHeaders?: Record<string, string>
): Record<string, string> {
  const token = getCartToken();
  if (!token) return existingHeaders ?? {};
  return {
    ...existingHeaders,
    "X-Cart-Token": token,
  };
}
