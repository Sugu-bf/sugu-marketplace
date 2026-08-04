import type { Metadata } from "next";
import { SEO, SITE_NAME, SITE_URL } from "./constants";

interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  /**
   * Absolute canonical URL, for pages whose indexable version lives on another
   * Sugu domain (e.g. /vendeurs is canonicalised to pro.sugu.pro).
   * Ignored when `noIndex` is set — the two directives contradict each other.
   */
  canonicalUrl?: string;
  /**
   * og:type override.
   * Note: Next.js OpenGraph API only accepts "website" | "article".
   * For "product" pages, pass type: "website" here and inject
   * `og:type = product` manually via metadata.other in the page.
   */
  type?: "website" | "article";
}

/**
 * Generate consistent `Metadata` for any page.
 *
 * @example
 * export const metadata = createMetadata({
 *   title: "Panier",
 *   description: "Consultez votre panier d'achat",
 *   path: "/cart",
 * });
 */
export function createMetadata({
  title,
  description = SEO.defaultDescription,
  path = "/",
  image,
  noIndex = false,
  canonicalUrl,
  type,
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    // Only the page-specific part — the root layout template adds "| Sugu"
    title,
    description,
    metadataBase: new URL(SITE_URL),
    // A noindex page must NOT point its canonical at a different URL: Google
    // treats that as contradictory and can carry the noindex over to the
    // canonical target, deindexing the page we actually want ranked.
    alternates: noIndex ? undefined : { canonical: canonicalUrl ?? url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: SEO.locale,
      type: (type ?? SEO.type) as "website" | "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      creator: SEO.twitterHandle,
    },
    // Always `follow`: /search and faceted category pages are noindex but they
    // are also the biggest internal link hubs into the product catalogue —
    // nofollow there would cut off product discovery.
    robots: { index: !noIndex, follow: true },
  };
}
