import { api, publicUrl, v1Url } from "@/lib/api";
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

/** The payments a buyer can start from the tracking page of an order. */
export type OrderPaymentAction = "pay-delivery-fee" | "pay-product-fee" | "pay-order";

/** The answer of a payment start: the page goes to `data.payment_url`. */
export interface OrderPaymentStartResponse {
  success?: boolean;
  message?: string;
  data?: { payment_url?: string };
}

/**
 * Start a payment of the order (COD Mixte delivery fee or products, or the
 * prepayment of a COD classic order).
 *
 * Endpoint: POST /api/v1/public/orders/{orderId}/{action}
 * Auth: the owner of the order only — Bearer injected by the Web BFF from the
 * session cookie. Anyone else is told the order does not exist (404).
 *
 * The URL is built here from the order, never taken from the tracking
 * payload: whatever that payload says, the page never posts elsewhere.
 *
 * @throws ApiError
 */
export async function startOrderPayment(
  orderId: string,
  action: OrderPaymentAction
): Promise<OrderPaymentStartResponse> {
  const url = publicUrl(`orders/${encodeURIComponent(orderId)}/${action}`);
  const { data } = await api.post<OrderPaymentStartResponse>(url);
  return data;
}

/**
 * The buyer confirms the products of a COD Mixte order were received in good
 * order, which opens the payment of the products.
 *
 * Endpoint: POST /api/v1/public/orders/{orderId}/verify-products
 * Auth: the owner of the order only — Bearer injected by the Web BFF. A
 * seller, an agency or a courier of the order is refused.
 *
 * @throws ApiError
 */
export async function confirmOrderProducts(orderId: string): Promise<void> {
  const url = publicUrl(`orders/${encodeURIComponent(orderId)}/verify-products`);
  await api.post(url, { body: { accepted: true } });
}
