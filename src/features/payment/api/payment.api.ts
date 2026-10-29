/**
 * Payment API — online payment (re)initiation of an order, and the status of
 * a payment the provider sent the buyer back from.
 *
 * Browser calls go through the api client, which routes them via the
 * same-origin BFF: a logged-in buyer is authenticated by its session, a guest
 * by the order's guest token.
 */

import { api } from "@/lib/api/client";
import { v1Url } from "@/lib/api/endpoints";
import {
  PaymentStatusResponseSchema,
  RetryOrderPaymentResponseSchema,
  type PaymentStatus,
  type RetryOrderPaymentResponse,
} from "./payment.schemas";

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

/**
 * Status of the payment behind the opaque `ref` the provider appends to
 * /payments/success and /payments/failed, passed through as received.
 *
 * Not retried here: the caller polls. Errors: 401 (the order belongs to a
 * registered buyer who is not logged in), 404 (unknown ref or not the
 * owner), 429.
 */
export async function getPaymentStatus(ref: string): Promise<PaymentStatus> {
  const { data } = await api.get(v1Url("payments/status", { ref }), {
    schema: PaymentStatusResponseSchema,
    cache: "no-store",
    timeout: PAYMENT_TIMEOUT_MS,
    retries: 0,
  });

  return data.data;
}
