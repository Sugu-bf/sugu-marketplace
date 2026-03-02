import type { FaqItem, FaqApiResponse } from "../models/faq";
import { API_BASE_URL } from "@/lib/api/config";

const API_BASE = `${API_BASE_URL}/v1`;

/**
 * Fetch FAQ items from the backend API.
 * Falls back to empty array if API fails.
 * Results are grouped by category on the backend and returned flat.
 */
export async function queryFaqItems(
  categorySlug?: string
): Promise<FaqItem[]> {
  try {
    const url = new URL(`${API_BASE}/public/help/faqs`);
    if (categorySlug) {
      url.searchParams.set("category", categorySlug);
    }

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 }, // ISR: revalidate every 10min (matches backend cache)
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
