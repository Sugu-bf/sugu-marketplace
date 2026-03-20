/**
 * P8 — Dynamic Sitemap
 *
 * Fetches all active product slugs from the Laravel backend and generates
 * a sitemap readable by Google Search Console.
 *
 * Backend endpoint: GET /api/v1/products/sitemap
 * (must be added to ProductController — see workflow P8)
 *
 * The sitemap revalidates every hour (same TTL as the backend cache).
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/sitemap`,
      {
        next: { revalidate: 3600 }, // ISR — refresh every hour
      }
    );

    if (!res.ok) return baseUrls;

    const data = await res.json();

    const productUrls: MetadataRoute.Sitemap = (
      data.products as Array<{ slug: string; updated_at: string }>
    ).map(({ slug, updated_at }) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: new Date(updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...baseUrls, ...productUrls];
  } catch {
    // Fail gracefully — return at least the static pages
    return baseUrls;
  }
}
