/**
 * P11 — robots.txt
 *
 * Disallows private/non-indexable paths and exposes the sitemap URL.
 * Generated at build time (static, no ISR needed).
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account/",
          "/cart",
          "/checkout/",
          "/messages/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
