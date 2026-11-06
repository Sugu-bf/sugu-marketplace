/**
 * Product Query Functions — entry points for pages.
 *
 * These are the ONLY functions components/pages should use to access product data.
 * Real API only: an empty or failed list is an empty list, never stand-in
 * products (they were indexed and cached as real ones).
 */

import type { ProductListItem, Product } from "../models/product";
import { fetchRecommended } from "@/features/home/api/home.api";
import {
  fetchProductDetail,
  fetchRelatedProducts,
  mapApiProductToProduct,
  mapApiRelatedToListItem,
} from "../api";
import type { ApiProductDetail } from "../api";

// ─── Product Detail (REAL API) ───────────────────────────────

/**
 * Fetch product by slug from the real API.
 *
 * null means the product does not exist (404 of the API). Any other failure
 * throws to the error boundary: never a 404, never a stand-in product.
 *
 * Also returns the raw API data alongside the mapped Product
 * so the page can pass api-specific fields (variants, options) to client components.
 */
export async function queryProductBySlug(
  slug: string
): Promise<(Product & { _api?: ApiProductDetail }) | null> {
  const apiProduct = await fetchProductDetail(slug);
  if (!apiProduct) return null;
  // Attach raw API data for client components that need the real variant structure
  return { ...mapApiProductToProduct(apiProduct), _api: apiProduct };
}

// ─── Related Products (REAL API) ─────────────────────────────

/**
 * Fetch related products from the real API (empty when there are none).
 */
export async function queryRelatedProducts(slug: string, limit = 5): Promise<ProductListItem[]> {
  const related = await fetchRelatedProducts(slug, limit);
  return related.map(mapApiRelatedToListItem);
}

// ─── Featured Products (REAL API — Home) ─────────────────────

/**
 * The first products of the recommended list (the home draw of the day).
 * Used by the "Sélection du jour" carousel of the home page (first slice of
 * HOME_RECOMMENDED_SLICES) and by the cart suggestions.
 */
export async function queryFeaturedProducts(limit = 6): Promise<ProductListItem[]> {
  try {
    const result = await fetchRecommended("all", limit, 0);
    if (result.products.length > 0) {
      return result.products.map((p) => ({
        id: String(p.id),
        slug: p.slug || "",
        name: p.name,
        price: Math.round((p.pricing?.price ?? 0) / 100),
        originalPrice: p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined,
        discount: undefined,
        thumbnail: p.image?.url ?? "/products/placeholder.png",
        rating: p.rating?.avg ?? 0,
        reviewCount: p.rating?.count ?? 0,
        stock: p.in_stock ? 10 : 0,
        sold: 0,
        vendorName: p.store?.name ?? "",
        categoryName: p.category?.name ?? "",
      }));
    }
  } catch (error) {
    console.error("[Product] Failed to fetch featured products:", (error as Error).message);
  }
  return [];
}
