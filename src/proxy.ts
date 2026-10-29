import { NextRequest, NextResponse } from "next/server";
import { COMING_SOON_ROUTE, isAllowedDuringComingSoon, isComingSoon } from "@/lib/coming-soon";
import { isKnownAppRoute } from "@/lib/routing/known-app-routes";
import { redirectTarget, resolveSeoRedirect } from "@/lib/routing/seo-redirects";
import { clientIpHeaders } from "@/lib/server/client-ip";

/**
 * Next.js proxy — the coming-soon wall and SEO redirect resolution.
 *
 * Legacy or renamed URLs (`/ancienne-categorie` → `/category/new-slug`) are
 * redirected according to the backend's rules. Paths served by the App Router
 * never reach the backend (see @/lib/routing/known-app-routes); the answer for
 * any other path is kept in a bounded cache (see @/lib/routing/seo-redirects).
 */

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mysugu.com").replace(/\/+$/, "");

const SKIP_PREFIXES = [
  "/_next",
  "/api",
  "/icon",
  "/apple-icon",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap",
  "/manifest",
  "/.well-known",
  "/__nextjs",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Infrastructure paths and static files (.svg, .png, .webp, .ico…)
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p)) || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 2. The landing page is only ever served in place of "/".
  if (pathname === COMING_SOON_ROUTE || pathname.startsWith(`${COMING_SOON_ROUTE}/`)) {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  // 3. Coming-soon wall. The wall keeps the catalogue closed but lets the
  // editorial and ecosystem pages through — they are the ones robots.txt and
  // the sitemap advertise, and the ones the pre-launch footer links to.
  if (isComingSoon()) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL(COMING_SOON_ROUTE, request.url));
    }
    if (!isAllowedDuringComingSoon(pathname)) {
      return NextResponse.redirect(new URL("/", request.url), 307);
    }
  }

  // 4. App routes are destinations, never redirect sources.
  if (isKnownAppRoute(pathname)) {
    return NextResponse.next();
  }

  // 5. Unknown path: ask the backend once, then serve from the cache.
  const redirect = await resolveSeoRedirect(pathname, {
    apiBaseUrl: API_BASE,
    headers: await clientIpHeaders(request.headers),
  });
  if (redirect) {
    return NextResponse.redirect(redirectTarget(redirect, request.url), redirect.statusCode);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.|apple-icon\\.).*)",
  ],
};
