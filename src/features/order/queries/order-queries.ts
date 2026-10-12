import { api, v1Url } from "@/lib/api";
import { OrderTrackingResponseSchema } from "../models/order";
import { mapApiToTrackedOrder } from "../mappers/order-mapper";
import type { TrackedOrder, OrderTrackingApiData } from "../models/order";
import { DeliveryCodeResponseSchema, mapDeliveryCodeEntry } from "../models/delivery-code";
import type { DeliveryCodeEntry } from "../models/delivery-code";

/**
 * Fetch tracked order data from the real backend API.
 *
 * Endpoint: GET /api/v1/orders/{orderId}/status
 * Auth: Bearer token injected by the Web BFF
 * Cache: no-store (sensitive, real-time data)
 *
 * @param orderId — Order ULID from URL ?order=...
 * @throws ApiError on network/validation/server errors
 */
export async function queryTrackedOrder(
  orderId: string
): Promise<TrackedOrder> {
  const url = v1Url(`orders/${encodeURIComponent(orderId)}/status`);

  const { data } = await api.get(url, {
    schema: OrderTrackingResponseSchema,
    cache: "no-store",
    revalidate: false, // Force no-store for Next.js SSR
    timeout: 8_000,
  });

  return mapApiToTrackedOrder(data.data.order);
}

/**
 * Lightweight fetch for polling — returns the raw API data
 * so the client can diff fields efficiently without remapping.
 *
 * @param orderId — Order ULID
 * @throws ApiError
 */
export async function queryTrackedOrderRaw(
  orderId: string
): Promise<OrderTrackingApiData> {
  const url = v1Url(`orders/${encodeURIComponent(orderId)}/status`);

  const { data } = await api.get(url, {
    schema: OrderTrackingResponseSchema,
    timeout: 6_000,
  });

  return data.data.order;
}


/**
 * Code de confirmation de livraison du client de la commande.
 *
 * Endpoint: GET /api/v1/orders/{orderId}/delivery-code
 * Auth: Bearer token injected by the Web BFF (the owner of the order only)
 * Cache: no-store — a secret, never kept anywhere
 *
 * @param orderId — Order ULID
 * @throws ApiError
 */
export async function queryDeliveryCode(
  orderId: string
): Promise<DeliveryCodeEntry[]> {
  const url = v1Url(`orders/${encodeURIComponent(orderId)}/delivery-code`);

  const { data } = await api.get(url, {
    schema: DeliveryCodeResponseSchema,
    cache: "no-store",
    revalidate: false,
    timeout: 8_000,
  });

  return data.data.deliveries.map(mapDeliveryCodeEntry);
}
