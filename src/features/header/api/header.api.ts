/**
 * Header API — business-oriented fetch functions for the global header.
 *
 * Endpoints consumed:
 * - GET /api/v1/categories          → Category tree (for mega menu)
 * - GET /api/v1/cart                → Full cart (for cart dropdown)
 * - GET /api/v1/cart/count          → Quick cart count (for badge)
 * - GET /api/v1/wishlist            → Full wishlist (for wishlist dropdown)
 * - GET /api/v1/wishlist/count      → Quick wishlist count
 *
 * No popular searches endpoint exists yet — we fallback to category names.
 */

import { api, v1Url, CacheTags, RevalidatePresets } from "@/lib/api";
import {
  CategoriesTreeResponseSchema,
  CartPreviewResponseSchema,
  CartCountResponseSchema,
  WishlistPreviewResponseSchema,
  WishlistCountResponseSchema,
  type HeaderCategory,
  type CartPreviewItem,
  type CartPreviewTotals,
  type WishlistPreviewItem,
} from "./header.schemas";

// ─── Categories Tree (Public, Cached) ────────────────────────

/**
 * Fetch all parent categories with their children for the mega menu.
 * SSR-friendly with long ISR caching (categories rarely change).
 */
export async function fetchCategoriesTree(): Promise<HeaderCategory[]> {
  try {
    const { data } = await api.get(v1Url("categories"), {
      schema: CategoriesTreeResponseSchema,
      revalidate: RevalidatePresets.static, // 600s = 10min
      tags: [CacheTags.categories(), "header"],
      skipCredentials: true,
    });

    // Deduplicate by ID — backend may return duplicates
    const seen = new Set<string>();
    return data.data.categories.filter((cat) => {
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
  } catch (error) {
    console.error("[Header] Failed to fetch categories tree:", (error as Error).message);
    return [];
  }
}

// ─── Popular Searches (Fallback: top category names) ─────────

/**
 * Generate popular search terms from top categories.
 * Backend does not have a dedicated endpoint yet.
 * When one is added, swap this function.
 */
export function derivePopularSearches(categories: HeaderCategory[]): string[] {
  return categories
    .slice(0, 10)
    .map((c) => c.name);
}

// ─── Cart Preview (User-specific, No Cache) ──────────────────

export interface CartPreviewData {
  items: CartPreviewItem[];
  totals: CartPreviewTotals;
}

/**
 * Fetch the full cart for the dropdown preview.
 * User-specific → no caching.
 */
export async function fetchCartPreview(): Promise<CartPreviewData | null> {
  try {
    // Get cart token from localStorage for guest cart identification
    const { getCartToken } = await import("@/features/cart/events/cart-storage");
    const cartToken = getCartToken();

    // Build URL — SEC: token ONLY via header, never in query params.
    // VULN-08 FIX: Query params leak into access logs, CDN cache keys,
    // referrer headers, and browser history.
    const url = v1Url("cart");
    const headers: Record<string, string> = {};

    if (cartToken) {
      headers["X-Cart-Token"] = cartToken;
    }

    const { data } = await api.get(url, {
      schema: CartPreviewResponseSchema,
      revalidate: RevalidatePresets.none,
      tags: [CacheTags.cart()],
      headers,
    });
    return {
      items: data.data.items,
      totals: data.data.totals,
    };
  } catch (error) {
    console.error("[Header] Failed to fetch cart preview:", (error as Error).message);
    return null;
  }
}

/**
 * Fetch cart count only (lightweight, for badge).
 */
export async function fetchCartCount(): Promise<{ qtyTotal: number; itemCount: number }> {
  try {
    const { data } = await api.get(v1Url("cart/count"), {
      schema: CartCountResponseSchema,
      revalidate: RevalidatePresets.none,
    });
    return {
      qtyTotal: data.data.qty_total,
      itemCount: data.data.item_count,
    };
  } catch {
    return { qtyTotal: 0, itemCount: 0 };
  }
}

// ─── Wishlist Preview (User-specific, No Cache) ──────────────

export interface WishlistPreviewData {
  items: WishlistPreviewItem[];
  count: number;
}

/**
 * Fetch the full wishlist for the dropdown preview.
 * User-specific → no caching.
 */
export async function fetchWishlistPreview(): Promise<WishlistPreviewData | null> {
  try {
    const { data } = await api.get(v1Url("wishlist"), {
      schema: WishlistPreviewResponseSchema,
      revalidate: RevalidatePresets.none,
      tags: [CacheTags.wishlist()],
    });
    return {
      items: data.data.items,
      count: data.meta?.count ?? data.data.items.length,
    };
  } catch (error) {
    console.error("[Header] Failed to fetch wishlist preview:", (error as Error).message);
    return null;
  }
}

/**
 * Fetch wishlist count only (lightweight, for badge).
 */
export async function fetchWishlistCount(): Promise<number> {
  try {
    const { data } = await api.get(v1Url("wishlist/count"), {
      schema: WishlistCountResponseSchema,
      revalidate: RevalidatePresets.none,
    });
    return data.data.count;
  } catch {
    return 0;
  }
}
