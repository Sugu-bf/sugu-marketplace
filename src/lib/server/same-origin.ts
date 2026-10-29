import type { NextRequest } from "next/server";

/**
 * Same-origin guard of the route handlers that act with the visitor's session
 * cookie (/api/backend, /api/broadcasting/auth, /api/auth/set-session): the
 * CSRF defence of the BFF, together with Fetch Metadata.
 *
 * An Origin is accepted when it is this request's origin, NEXT_PUBLIC_APP_URL's,
 * the one rebuilt from X-Forwarded-Host/-Proto (behind the platform proxy), or
 * in development any loopback origin against a loopback host.
 */

function isLoopback(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function isAllowedOrigin(request: NextRequest, origin: string | null): boolean {
  if (!origin) return false;
  const expectedOrigin = request.nextUrl.origin;
  if (origin === expectedOrigin) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (origin === new URL(appUrl).origin) return true;
    } catch {
      // A malformed NEXT_PUBLIC_APP_URL allows nothing.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
    if (origin === `${forwardedProto}://${forwardedHost}`) return true;
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      return isLoopback(new URL(origin).hostname) && isLoopback(new URL(expectedOrigin).hostname);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Whether the request comes from this site's own pages. A present Origin must
 * always be allowed; `requireOrigin` also refuses a request without one (every
 * state-changing call). A cross-site Fetch Metadata is always refused.
 */
export function isSameOriginRequest(
  request: NextRequest,
  { requireOrigin }: { requireOrigin: boolean },
): boolean {
  const origin = request.headers.get("origin");
  if (origin !== null || requireOrigin) {
    if (!isAllowedOrigin(request, origin)) return false;
  }

  return request.headers.get("sec-fetch-site") !== "cross-site";
}
