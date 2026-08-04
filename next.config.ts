import type { NextConfig } from "next";

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
  reactCompiler: true,

  // ─── Cache-Control headers for Cloudflare edge caching ──────
  // Next.js ISR sets s-maxage automatically, but we make it
  // explicit so Cloudflare's CDN reads it reliably.
  async headers() {
    return [
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
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "georgianna-lowerable-laurene.ngrok-free.dev",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
