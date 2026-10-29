/**
 * Payment API — online payment (re)initiation of an order.
 *
 * Browser calls go through the api client, which routes them via the
 * same-origin BFF: a logged-in buyer is authenticated by its session, a guest
 * by the order's guest token.
 */

import { api } from "@/lib/api/client";
import { v1Url } from "@/lib/api/endpoints";
import { RetryOrderPaymentResponseSchema, type RetryOrderPaymentResponse } from "./payment.schemas";

const PAYMENT_TIMEOUT_MS = 15_000;

/**
 * Start (again) the online payment of an unpaid order.
 *
 * Never retried: each call may open a new provider transaction.
 * Errors: 409 ORDER_NOT_PAYABLE / OUT_OF_STOCK, 502 PAYMENT_INIT_FAILED
 * (transient), 401/404.
 */
export async function retryOrderPayment(
  orderId: string,
  guestOrderToken?: string | null
): Promise<RetryOrderPaymentResponse["data"]> {
  const { data } = await api.post(v1Url(`orders/${encodeURIComponent(orderId)}/payment`), {
    schema: RetryOrderPaymentResponseSchema,
    timeout: PAYMENT_TIMEOUT_MS,
    retries: 0,
    headers: guestOrderToken ? { "X-Guest-Order-Token": guestOrderToken } : undefined,
  });

  return data.data;
}
