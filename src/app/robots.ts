/**
 * P11 — robots.txt
 *
 * Only paths that must never be *crawled* belong here. Private surfaces
 * (/account, /cart, /checkout, /login…) are handled by `X-Robots-Tag: noindex`
 * in next.config.ts instead: a path blocked in robots.txt is never fetched, so
 * Googlebot never reads its noindex and the URL can stay indexed without a
 * description if anything links to it. Blocking *and* noindexing the same path
 * is self-defeating — pick one, and here we pick noindex.
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { comingSoonSitemapPaths, isComingSoon } from "@/lib/coming-soon";

export default function robots(): MetadataRoute.Robots {
  // While the wall is up everything outside the allow-list 307s to "/".
  // Advertising the catalogue would send Googlebot straight into redirects.
  if (isComingSoon()) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: comingSoonSitemapPaths(),
          disallow: "/",
        },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/ serves JSON only — no reason to spend crawl budget on it.
        // Everything else private is covered by X-Robots-Tag (see above).
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
