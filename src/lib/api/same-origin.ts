import type { NextRequest } from "next/server";

/**
 * Whether a request to a route handler comes from this site (CSRF guard).
 *
 * Same rules as the BFF (src/app/api/backend): the Origin, when sent, must be
 * the site's (request origin, NEXT_PUBLIC_APP_URL, or the forwarded host of
 * the reverse proxy); a mutating request must send one; and a browser that
 * labels the request cross-site is refused.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;

  const isAllowedOrigin = (originValue: string | null): boolean => {
    if (!originValue) return false;
    if (originValue === expectedOrigin) return true;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      try {
        if (originValue === new URL(appUrl).origin) return true;
      } catch {
        // An invalid NEXT_PUBLIC_APP_URL allows nothing.
      }
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
    if (forwardedHost && originValue === `${forwardedProto}://${forwardedHost}`) return true;

    if (process.env.NODE_ENV !== "production") {
      try {
        const isLocalhost = (host: string) => host === "localhost" || host === "127.0.0.1" || host === "[::1]";
        if (isLocalhost(new URL(originValue).hostname) && isLocalhost(new URL(expectedOrigin).hostname)) return true;
      } catch {
        // Not a URL: not allowed.
      }
    }

    return false;
  };

  const isMutating = !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());
  if (origin && !isAllowedOrigin(origin)) return false;
  if (isMutating && !isAllowedOrigin(origin)) return false;

  return request.headers.get("sec-fetch-site") !== "cross-site";
}
