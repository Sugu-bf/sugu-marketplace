/**
 * Cart Cookie Utility — mirrors the cart token in a frontend-domain cookie.
 *
 * WHY THIS EXISTS:
 * ────────────────
 * The guest cart token lives in two places:
 *   1. `guest_cart` cookie on api.mysugu.com (SameSite=Lax, HttpOnly)
 *   2. `sugu:cart-token` in localStorage (client-only)
 *
 * Neither is accessible during Next.js SSR (server can't read localStorage,
 * and cross-domain SameSite=Lax cookies aren't forwarded). This causes the
 * /cart page to render "empty cart" on SSR because the backend creates a
 * brand-new empty cart when no token is present.
 *
 * SOLUTION:
 * ─────────
 * Every time we receive/save a cart token client-side, we ALSO write it to
 * a first-party cookie `sugu_cart_token` on the frontend domain. This cookie
 * IS included in the Next.js server request headers, so `queryCart()` can
 * read it and forward it as `X-Cart-Token` to the backend.
 *
 * SECURITY:
 * ─────────
 * - The token is an opaque UUID — no user data, no session, no CSRF risk.
 * - The backend validates UUID format (Str::isUuid) before lookup.
 * - The cookie is NOT HttpOnly so JavaScript can also read it (matches
 *   the existing localStorage strategy which is inherently JS-readable).
 * - SameSite=Lax on the frontend domain — sent on same-site navigations.
 * - Max-Age = 30 days (matches backend's guest_cookie_days config).
 */

// ─── Constants ───────────────────────────────────────────────

/** Cookie name — underscores, not colons, to avoid encoding issues. */
const COOKIE_NAME = "sugu_cart_token";

/** 30 days in seconds — matches backend config `cart.guest_cookie_days`. */
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// ─── Write ───────────────────────────────────────────────────

/**
 * Set the cart token cookie on the frontend domain.
 * Safe to call from any client context — no-ops silently on SSR.
 */
export function setCartCookie(token: string): void {
  if (typeof document === "undefined") return;
  if (!token) return;
  try {
    document.cookie = [
      `${COOKIE_NAME}=${encodeURIComponent(token)}`,
      `path=/`,
      `max-age=${MAX_AGE_SECONDS}`,
      `samesite=lax`,
      // Secure flag only in production (HTTPS)
      ...(window.location.protocol === "https:" ? ["secure"] : []),
    ].join("; ");
  } catch {
    // Cookie write failed (e.g. storage limit) — silent, localStorage remains fallback.
  }
}

// ─── Delete ──────────────────────────────────────────────────

/**
 * Remove the cart token cookie (e.g. after checkout or logout).
 * Sets max-age=0 which instructs the browser to delete it.
 */
export function clearCartCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Silent — best-effort cleanup.
  }
}

// ─── Read (SSR-safe) ─────────────────────────────────────────

/**
 * Parse the cart token from a raw `Cookie` header string.
 *
 * Used exclusively in Server Components (queryCart) where we have
 * access to the incoming request's cookie header but NOT to
 * `document.cookie` or `localStorage`.
 *
 * Returns `null` if the cookie is absent or malformed.
 *
 * @example
 *   const token = parseCartTokenFromCookieHeader("foo=bar; sugu_cart_token=abc-123; baz=qux");
 *   // → "abc-123"
 */
export function parseCartTokenFromCookieHeader(cookieHeader: string | undefined | null): string | null {
  if (!cookieHeader) return null;

  // Standard cookie-header parsing: split on "; " then find our key.
  // We avoid regex for simplicity and zero-dep correctness.
  const prefix = `${COOKIE_NAME}=`;
  const cookies = cookieHeader.split(";");

  for (const raw of cookies) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(prefix)) {
      const value = trimmed.slice(prefix.length);
      try {
        const decoded = decodeURIComponent(value);
        // Basic UUID sanity check (same format the backend validates)
        if (decoded && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)) {
          return decoded;
        }
      } catch {
        // Malformed encoding — treat as absent.
      }
      return null;
    }
  }

  return null;
}
