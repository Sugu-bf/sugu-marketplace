import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { assertBuildEnv } from "./src/lib/env/build-env";
import { securityHeaders } from "./src/lib/security/security-headers";

const privateNoIndexHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

// `:path*` matches zero or more segments, so "/account/:path*" covers both
// /account and /account/orders. Verified against Next's path-to-regexp.
const privateRoutePatterns = [
  "/account/:path*",
  "/cart",
  "/checkout/:path*",
  "/messages/:path*",
  "/payments/:path*",
  "/track-order",
  "/support-chat",
  "/login",
  "/register",
  "/forgot-password",
  "/onboarding",
  // Promo shell with no standalone content — indexing it only adds bloat.
  "/banners",
  "/invoices/:path*",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Fixed at build time so the proxy and the prerendered pages read the same
  // value (see src/lib/coming-soon.ts).
  env: {
    COMING_SOON_ENABLED: process.env.COMING_SOON_ENABLED === "true" ? "true" : "false",
  },
  reactCompiler: true,

  // ─── Cache-Control headers for Cloudflare edge caching ──────
  // Next.js ISR sets s-maxage automatically, but we make it
  // explicit so Cloudflare's CDN reads it reliably.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          production: process.env.NODE_ENV === "production",
          enforceCsp: process.env.CSP_ENFORCE === "true",
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.mysugu.com",
          reverbHost: process.env.NEXT_PUBLIC_REVERB_HOST,
          reverbPort: process.env.NEXT_PUBLIC_REVERB_PORT,
          reverbScheme: process.env.NEXT_PUBLIC_REVERB_SCHEME,
        }),
      },
      {
        // Homepage — ISR 60s + stale-while-revalidate 5 min
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        // Product pages — ISR 120s + stale-while-revalidate 10 min
        // Must match CACHE_TTL = 120 in ProductDetailService.php
        source: "/product/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=120, stale-while-revalidate=600",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=120, stale-while-revalidate=600",
          },
          {
            key: "Surrogate-Control",
            value: "max-age=120",
          },
        ],
      },
      ...privateRoutePatterns.map((source) => ({
        source,
        headers: privateNoIndexHeaders,
      })),
    ];
  },

  // Every response used to announce "X-Powered-By: Next.js".
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sugu.pro",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.mysugu.com",
        pathname: "/**",
      },
    ],
    // No "image/avif" while Next is below 16.4.3: its AVIF encoder path in the
    // image optimizer carries a remote code execution advisory (audit P0-4).
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

/**
 * A production build fails on an incomplete environment: the NEXT_PUBLIC_*
 * values are inlined into the bundle and cannot be fixed afterwards.
 */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertBuildEnv(process.env);
  return nextConfig;
}
