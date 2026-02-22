import type { CartItem } from "../models/cart";
import { getMockCartItems } from "../mocks/cart";

/**
 * Query functions for cart data.
 * Currently returns mock data for design-only rendering.
 * When API is ready, swap to fetch from the cart API endpoint.
 */

/**
 * Get initial cart items for SSR rendering.
 * In production, this would read from a session/cookie or API.
 */
export async function queryCartItems(): Promise<CartItem[]> {
  return getMockCartItems();
}
