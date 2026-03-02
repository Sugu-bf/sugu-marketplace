/**
 * Product Query Functions — entry points for pages.
 *
 * These are the ONLY functions components/pages should use to access product data.
 *
 * Migration status:
 * - queryProductBySlug: ✅ uses real API
 * - queryRelatedProducts: ✅ uses real API
 * - queryFeaturedProducts: ✅ uses real API (home recommended)
 * - Other queries: still using mock (to be migrated later)
 */

import { MockProductService } from "../services/product-service";
import type { ProductListItem, Product } from "../models/product";
import { fetchRecommended } from "@/features/home/api/home.api";
import {
  fetchProductDetail,
  fetchRelatedProducts,
  mapApiProductToProduct,
  mapApiRelatedToListItem,
} from "../api";
import type { ApiProductDetail } from "../api";

const mockService = new MockProductService();

// ─── Product Detail (REAL API) ───────────────────────────────

/**
 * Fetch product by slug from the real API.
 * Falls back to mock data if API fails (dev convenience).
 *
 * Also returns the raw API data alongside the mapped Product 
 * so the page can pass api-specific fields (variants, options) to client components.
 */
export async function queryProductBySlug(
  slug: string
): Promise<(Product & { _api?: ApiProductDetail }) | null> {
  try {
    const apiProduct = await fetchProductDetail(slug);
    if (apiProduct) {
      const product = mapApiProductToProduct(apiProduct);
      // Attach raw API data for client components that need the real variant structure
      return { ...product, _api: apiProduct };
    }
  } catch (error) {
    console.error("[Product] API fetch failed, falling back to mock:", (error as Error).message);
  }

  // Fallback to mock for dev (will be removed once API is stable)
  return mockService.getBySlug(slug);
}

// ─── Related Products (REAL API) ─────────────────────────────

/**
 * Fetch related products from the real API.
 */
export async function queryRelatedProducts(
  productIdOrSlug: number | string,
  limit = 5
): Promise<ProductListItem[]> {
  // If we receive a slug string, use it directly; if number, we need a slug
  const slug = typeof productIdOrSlug === "string" ? productIdOrSlug : String(productIdOrSlug);

  try {
    const related = await fetchRelatedProducts(slug, limit);
    if (related.length > 0) {
      return related.map(mapApiRelatedToListItem);
    }
  } catch (error) {
    console.error("[Product] Failed to fetch related products:", (error as Error).message);
  }

  // Fallback to mock
  return mockService.getRelated(typeof productIdOrSlug === "number" ? productIdOrSlug : 0, limit);
}

// ─── Featured Products (REAL API — Home) ─────────────────────

/**
 * Fetch featured / best-seller products from the real API.
 * Used by the "Best Seller" section on the home page.
 */
export async function queryFeaturedProducts(limit = 6): Promise<ProductListItem[]> {
  try {
    const result = await fetchRecommended("all", limit);
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
  return mockService.getFeatured(limit);
}

// ─── Still Mock (to be migrated) ─────────────────────────────

export async function queryProducts(): Promise<ProductListItem[]> {
  return mockService.getAll();
}

export async function queryProductById(id: number): Promise<Product | null> {
  return mockService.getById(id);
}

export async function queryProductsByCategory(
  categoryId: number,
  limit?: number
): Promise<ProductListItem[]> {
  return mockService.getByCategory(categoryId, limit);
}

export async function querySearchProducts(query: string): Promise<ProductListItem[]> {
  return mockService.search(query);
}
