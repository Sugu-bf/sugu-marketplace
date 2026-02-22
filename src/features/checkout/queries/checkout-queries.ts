import type { CheckoutPageData } from "../models/checkout";
import { getMockCheckoutData } from "../mocks/checkout";

/**
 * Query functions for checkout data.
 * Currently returns mock data for design-only rendering.
 * When API is ready, swap to fetch from the checkout API endpoint.
 */

/**
 * Get checkout page data — shipping methods, address, order summary.
 * In production, this would read from the cart session + user addresses API.
 */
export async function queryCheckoutData(): Promise<CheckoutPageData> {
  return getMockCheckoutData();
}
