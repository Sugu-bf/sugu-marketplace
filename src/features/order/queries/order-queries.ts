import type { TrackedOrder } from "../models/order";
import { getMockTrackedOrder } from "../mocks/order";

/**
 * Query functions for order tracking data.
 * Currently returns mock data for design-only rendering.
 * When API is ready, swap to fetch from the order tracking API endpoint.
 */

/**
 * Get tracked order data by order number.
 * In production: GET /api/orders/{orderNumber}/tracking
 */
export async function queryTrackedOrder(
  _orderNumber?: string
): Promise<TrackedOrder> {
  return getMockTrackedOrder();
}
