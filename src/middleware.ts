import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware for SEO redirect resolution.
 *
 * On every page request (not _next, api, static assets), this middleware
 * calls the Laravel backend to check if the requested path should be
 * redirected. If a match is found, it issues a 301/302 redirect.
 *
 * Performance:
 * - Backend caches resolve results (default 10min TTL)
 * - We set a strict timeout (2s) to never block page loads
 * - Static assets and API routes are excluded via matcher config
 *
 * Security:
 * - Only internal redirects are accepted (must start with /)
 * - External redirects from backend are blocked
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Paths we should never attempt to resolve redirects for
const SKIP_PREFIXES = [
  "/_next",
  "/api",
  "/favicon",
  "/robots.txt",
  "/sitemap",
  "/__nextjs",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip non-page paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static files (has extension)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  try {
    const resolveUrl = new URL(
      `${API_BASE}/v1/public/redirects/resolve`
    );
    resolveUrl.searchParams.set("path", pathname);
    if (search && search.length > 1) {
      resolveUrl.searchParams.set("query", search.slice(1)); // remove leading ?
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s max

    const res = await fetch(resolveUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Forwarded-For":
          request.headers.get("x-forwarded-for") ?? "",
      },
      // Edge runtime: next: { revalidate } is not supported,
      // so we rely on backend caching
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // Backend error — don't block the page
      return NextResponse.next();
    }

    const data = await res.json();

    if (data.match && data.to) {
      // Security: only allow internal redirects
      if (!data.to.startsWith("/")) {
        console.warn(
          `[seo-redirect] Blocked external redirect: ${data.to}`
        );
        return NextResponse.next();
      }

      // Build the destination URL
      const destination = new URL(data.to, request.url);

      const statusCode =
        data.status_code === 302 ? 302 : 301;

      return NextResponse.redirect(destination, statusCode);
    }
  } catch (error: unknown) {
    // AbortError = timeout, network errors = skip silently
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("[seo-redirect] Resolve error:", error.message);
    }
    // Never block page rendering
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, icons
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.|apple-icon\\.).*)",
  ],
};
