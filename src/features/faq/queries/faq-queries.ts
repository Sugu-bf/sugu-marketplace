import type { FaqItem, FaqApiResponse } from "../models/faq";
import { API_CONTENT_TIMEOUT_MS } from "@/lib/api/config";
import { publicUrl } from "@/lib/api/endpoints";

/**
 * Fetch FAQ items from the backend API.
 * Falls back to empty array if API fails.
 * Results are grouped by category on the backend and returned flat.
 */
export async function queryFaqItems(
  categorySlug?: string
): Promise<FaqItem[]> {
  try {
    const res = await fetch(publicUrl("help/faqs", { category: categorySlug }), {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 }, // ISR: revalidate every 10min (matches backend cache)
      signal: AbortSignal.timeout(API_CONTENT_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`[FAQ] API error: ${res.status}`);
      return [];
    }

    const data: FaqApiResponse = await res.json();
    return data.faqs ?? [];
  } catch (error) {
    console.error("[FAQ] Failed to fetch FAQs:", error);
    return [];
  }
}

/**
 * Group FAQ items by category name.
 * Returns an array of { category, items } objects, preserving sort order.
 */
export function groupFaqsByCategory(
  items: FaqItem[]
): { category: string; slug: string; items: FaqItem[] }[] {
  const map = new Map<string, { slug: string; items: FaqItem[] }>();

  for (const item of items) {
    const catName = item.category?.name ?? "Général";
    const catSlug = item.category?.slug ?? "general";

    if (!map.has(catName)) {
      map.set(catName, { slug: catSlug, items: [] });
    }
    map.get(catName)!.items.push(item);
  }

  return Array.from(map.entries()).map(([category, { slug, items }]) => ({
    category,
    slug,
    items,
  }));
}
