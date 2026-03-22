import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Edge Middleware — SEO redirect resolution.
 *
 * PURPOSE: Intercept legacy/renamed URLs and redirect them to the correct
 * Next.js route. This is for old paths like `/ancienne-categorie` → `/category/new-slug`,
 * NOT for paths that already map to a Next.js route.
 *
 * OPTIMISATIONS (Senior):
 *
 * 1. KNOWN ROUTE SKIP — App routes are identified in O(1) with a regex.
 *    If the path already matches a Next.js page, we skip the API call entirely.
 *    These routes can never have a redirect rule — they ARE the destination.
 *
 * 2. EDGE IN-MEMORY CACHE — For unknown paths that DO reach the API,
 *    we cache the result for CACHE_TTL_MS (10 min) in a module-level Map.
 *    The Edge runtime keeps this Map alive across requests on the same edge node,
 *    so the same unknown path only hits the backend once per 10 min per edge node.
 *    Periodic eviction prevents unbounded memory growth.
 *
 * BEFORE: 1 API call per request per visitor (every page, every time)
 * AFTER:  0 API calls for known routes, 1 API call per unknown path per 10 min
 */

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mysugu.com").replace(/\/+$/, "");

// ─── 1. Known Next.js App Routes ─────────────────────────────────────────────
//
// These paths are served by the Next.js App Router and can NEVER be a redirect
// target from the backend. Checking them against the API is wasteful.
//
// Rule: a route is "known" if it is a static segment OR starts with a
// dynamic segment prefix that belongs to the Next.js app (e.g. /product/).
//
// ⚠️  Keep in sync with src/app directory structure.

const KNOWN_APP_ROUTE_PREFIXES = [
  // ── Static routes ──────────────────────────────────
  "/",                           // (main)/page.tsx
  "/search",                     // (main)/search
  "/fournisseurs",               // (main)/fournisseurs
  "/blog",                       // (main)/blog
  "/cart",                       // (main)/cart
  "/checkout",                   // (main)/checkout
  "/track-order",                // (main)/track-order
  "/help",                       // (main)/help
  "/support-chat",               // (main)/support-chat
  "/banners",                    // (main)/banners
  "/conditions-generales",       // (main)/conditions-generales
  "/politique-de-confidentialite",
  "/politique-anti-fraude",
  "/politique-livraison-retours",
  // ── Auth routes ────────────────────────────────────
  "/login",                      // (auth)/login
  "/register",                   // (auth)/register
  "/onboarding",                 // (auth)/onboarding
  "/forgot-password",            // (auth)/forgot-password
  // ── Dynamic segment prefixes ───────────────────────
  "/product/",                   // (main)/product/[slug]
  "/category/",                  // (main)/category/[slug]
  "/store/",                     // (main)/store/[slug]
  "/stores",                     // (main)/stores
  "/account",                    // (main)/account + /account/*
  "/messages",                   // (main)/messages + /messages/*
  "/pages/",                     // (main)/pages/[slug]
  "/invoices/",                  // invoices/[token]
] as const;

/**
 * Returns true when the path is a known Next.js App Router route.
 * These paths are never SEO redirect candidates — skip the API call.
 */
function isKnownAppRoute(pathname: string): boolean {
  return KNOWN_APP_ROUTE_PREFIXES.some((prefix) => {
    // Exact match for static routes (e.g. "/" must not match "/old-page")
    if (!prefix.endsWith("/")) {
      return pathname === prefix || pathname.startsWith(prefix + "/");
    }
    // Prefix match for dynamic routes (e.g. "/product/" matches "/product/iphone-15")
    return pathname.startsWith(prefix);
  });
}

// ─── 2. Edge In-Memory Cache ──────────────────────────────────────────────────
//
// Caches redirect resolution results at the Edge so each unknown path only
// hits the Laravel API once per CACHE_TTL_MS per edge node, regardless of
// how many requests come in for that path.

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — matches backend cache TTL

interface CacheEntry {
  /** null = no redirect for this path */
  destination: string | null;
  statusCode: number;
  expiresAt: number;
}

const resolveCache = new Map<string, CacheEntry>();
let lastEviction = Date.now();

function getCached(key: string): CacheEntry | undefined {
  const entry = resolveCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    resolveCache.delete(key);
    return undefined;
  }
  return entry;
}

function setCached(key: string, destination: string | null, statusCode: number): void {
  resolveCache.set(key, { destination, statusCode, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Evict stale entries periodically to prevent unbounded growth. */
function maybeEvict(): void {
  if (Date.now() - lastEviction < 60_000) return;
  lastEviction = Date.now();
  for (const [key, entry] of resolveCache.entries()) {
    if (Date.now() > entry.expiresAt) resolveCache.delete(key);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

const SKIP_PREFIXES = ["/_next", "/api", "/favicon", "/robots.txt", "/sitemap", "/__nextjs"];

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip infrastructure paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static file extensions (.svg, .png, .webp, .ico…)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // ── OPTIMISATION 1: Skip known app routes (zero API call) ────────────────
  if (isKnownAppRoute(pathname)) {
    return NextResponse.next();
  }

  // ── OPTIMISATION 2: Return cached result if available ────────────────────
  maybeEvict();

  const cacheKey = pathname + (search.length > 1 ? search : "");
  const cached = getCached(cacheKey);

  if (cached) {
    if (cached.destination) {
      const destination = new URL(cached.destination, request.url);
      return NextResponse.redirect(destination, cached.statusCode);
    }
    return NextResponse.next();
  }

  // ── API call for unknown paths (legacy URLs, slug changes, etc.) ──────────
  try {
    const resolveUrl = new URL(`${API_BASE}/api/v1/public/redirects/resolve`);
    resolveUrl.searchParams.set("path", pathname);
    if (search && search.length > 1) {
      resolveUrl.searchParams.set("query", search.slice(1));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(resolveUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      setCached(cacheKey, null, 200); // cache "no redirect" to avoid hammering on backend errors
      return NextResponse.next();
    }

    const data = await res.json();

    if (data.match && data.to) {
      if (!data.to.startsWith("/")) {
        console.warn(`[seo-redirect] Blocked external redirect: ${data.to}`);
        setCached(cacheKey, null, 200);
        return NextResponse.next();
      }

      const statusCode = data.status_code === 302 ? 302 : 301;
      setCached(cacheKey, data.to, statusCode);

      const destination = new URL(data.to, request.url);
      return NextResponse.redirect(destination, statusCode);
    }

    // No redirect found — cache "no match" so we don't ask again for 10 min
    setCached(cacheKey, null, 200);
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("[seo-redirect] Resolve error:", error.message);
    }
    // Never block page rendering on errors
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.|apple-icon\\.).*)",
  ],
};
