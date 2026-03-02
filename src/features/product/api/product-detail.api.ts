/**
 * Product Detail — API functions for real backend calls.
 *
 * Endpoints:
 * - GET /api/v1/products/{slug}           → Product detail
 * - GET /api/v1/products/{slug}/related   → Related products
 * - GET /api/v1/products/{slug}/reviews   → Paginated reviews
 * - POST /api/v1/cart/items               → Add to cart
 * - GET  /api/v1/cart/count               → Cart count
 * - POST /api/v1/wishlist/items           → Add to wishlist
 * - DELETE /api/v1/wishlist/items/{id}    → Remove from wishlist
 * - GET  /api/v1/wishlist                 → Wishlist list (to check state)
 *
 * RULES:
 * - All requests go through lib/api/client.ts
 * - URLs built via v1Url()
 * - Zod validation on GET responses
 * - revalidate + tags for public data
 * - revalidate: 0 for user-specific data
 * - No fetch() in UI components
 */

import { api, v1Url, CacheTags, RevalidatePresets, isApiError, initCsrf } from "@/lib/api";
import {
  ProductDetailResponseSchema,
  RelatedProductsResponseSchema,
  ReviewsResponseSchema,
  CartResponseSchema,
  CartCountResponseSchema,
  WishlistResponseSchema,
  type ApiProductDetail,
  type ApiRelatedProduct,
  type ApiReview,
  type CartResponse,
  type WishlistResponse,
} from "./product-detail.schemas";

// ─── Product Detail (SSR, public, cached) ────────────────────

/**
 * Fetch product detail from the real API.
 * Used in SSR (Server Component) — cached with tags.
 */
export async function fetchProductDetail(slug: string): Promise<ApiProductDetail | null> {
  try {
    const { data } = await api.get(v1Url(`products/${slug}`), {
      schema: ProductDetailResponseSchema,
      revalidate: RevalidatePresets.frequent, // 120s — prices/stock change often
      tags: [CacheTags.product(slug), CacheTags.products()],
    });
    return data.product;
  } catch (error) {
    if (isApiError(error) && error.code === "NOT_FOUND") {
      return null;
    }
    console.error(`[ProductDetail] Failed to fetch product "${slug}":`, (error as Error).message);
    return null;
  }
}

// ─── Related Products (SSR, public, cached) ──────────────────

export async function fetchRelatedProducts(slug: string, limit = 12): Promise<ApiRelatedProduct[]> {
  try {
    const { data } = await api.get(v1Url(`products/${slug}/related`, { limit }), {
      schema: RelatedProductsResponseSchema,
      revalidate: RevalidatePresets.frequent,
      tags: [CacheTags.product(slug)],
    });
    return data.items;
  } catch (error) {
    console.error(`[ProductDetail] Failed to fetch related for "${slug}":`, (error as Error).message);
    return [];
  }
}

// ─── Reviews (SSR/client, public, cached) ────────────────────

export async function fetchProductReviews(
  slug: string,
  limit = 10,
  cursor?: string | number | null
): Promise<{
  reviews: ApiReview[];
  meta: { total: number; limit: number; next_cursor: string | number | null; has_more: boolean };
}> {
  try {
    const params: Record<string, string | number> = { limit };
    if (cursor) params.cursor = cursor;

    const { data } = await api.get(v1Url(`products/${slug}/reviews`, params), {
      schema: ReviewsResponseSchema,
      revalidate: RevalidatePresets.frequent,
      tags: [CacheTags.product(slug)],
    });
    return { reviews: data.reviews, meta: data.meta };
  } catch (error) {
    console.error(`[ProductDetail] Failed to fetch reviews for "${slug}":`, (error as Error).message);
    return {
      reviews: [],
      meta: { total: 0, limit, next_cursor: null, has_more: false },
    };
  }
}

// ─── Cart: Add Item (Client, mutation) ───────────────────────

export interface AddToCartPayload {
  variant_id?: string | number;
  product_id?: string | number;
  qty?: number;
}

export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  // Ensure CSRF cookie before mutation
  await initCsrf();

  // Include cart token if we have one (guest cart persistence)
  const { setCartToken, getCartToken } = await import("@/features/cart/events/cart-storage");
  const cartToken = getCartToken();
  const headers: Record<string, string> = {};
  if (cartToken) {
    headers["X-Cart-Token"] = cartToken;
  }

  const { data, headers: responseHeaders } = await api.post<CartResponse>(v1Url("cart/items"), {
    body: payload,
    schema: CartResponseSchema,
    retries: 0, // Never retry POST
    headers,
  });

  // Capture and persist the cart token from backend
  const newToken = responseHeaders.get("X-Cart-Token");
  if (newToken) {
    setCartToken(newToken);
  }

  return data;
}

// ─── Cart: Count (Client, no-cache) ──────────────────────────

export async function fetchCartCount(): Promise<{ qty_total: number; item_count: number }> {
  try {
    const { data } = await api.get(v1Url("cart/count"), {
      schema: CartCountResponseSchema,
      revalidate: 0, // User-specific, no cache
    });
    return data.data;
  } catch {
    return { qty_total: 0, item_count: 0 };
  }
}

// ─── Wishlist: List (Client, no-cache) ───────────────────────

export async function fetchWishlist(): Promise<WishlistResponse | null> {
  try {
    const { data } = await api.get(v1Url("wishlist"), {
      schema: WishlistResponseSchema,
      revalidate: 0,
    });
    return data;
  } catch {
    return null;
  }
}

// ─── Wishlist: Add (Client, mutation) ────────────────────────

export interface AddToWishlistPayload {
  variant_id?: string | number;
  product_id?: string | number;
}

export async function addToWishlist(payload: AddToWishlistPayload): Promise<WishlistResponse> {
  await initCsrf();

  const { data } = await api.post<WishlistResponse>(v1Url("wishlist/items"), {
    body: payload,
    schema: WishlistResponseSchema,
    retries: 0,
  });
  return data;
}

// ─── Wishlist: Remove (Client, mutation) ─────────────────────

export async function removeFromWishlist(itemId: string | number): Promise<WishlistResponse> {
  await initCsrf();

  const { data } = await api.delete<WishlistResponse>(v1Url(`wishlist/items/${itemId}`), {
    schema: WishlistResponseSchema,
    retries: 0,
  });
  return data;
}
