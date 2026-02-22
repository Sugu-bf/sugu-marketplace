import type { Metadata } from "next";
import { SEO, SITE_NAME, SITE_URL } from "./constants";

interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
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
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    // Only the page-specific part — the root layout template adds "| Sugu"
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: SEO.locale,
      type: SEO.type as "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      creator: SEO.twitterHandle,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
