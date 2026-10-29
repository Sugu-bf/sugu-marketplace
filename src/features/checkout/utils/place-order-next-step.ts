import { safePaymentRedirectUrl } from "@/features/payment/utils/payment-redirect";
import type { PlaceOrderResponse } from "../api/checkout.types";

/** The order a failed payment initiation leaves behind: created, unpaid. */
export interface UnpaidOnlineOrder {
  id: string;
  number: string;
  guestOrderToken: string | null;
}

export type PlaceOrderNextStep =
  | { type: "redirect"; url: string }
  | { type: "track"; orderId: string }
  | { type: "payment_init_failed"; order: UnpaidOnlineOrder };

/**
 * What the browser does once the order is placed — keyed only on `next_step`
 * and `payment_url`, never on the provider.
 *
 * An online order whose payment URL is missing or not a trusted provider URL
 * is an unpaid order, never a confirmed one: the buyer is offered to retry the
 * payment instead of being sent to tracking as if it had paid.
 */
export function placeOrderNextStep(
  result: PlaceOrderResponse["data"],
  allowedHosts?: readonly string[]
): PlaceOrderNextStep {
  if (result.next_step === "order_confirmed") {
    return { type: "track", orderId: result.order.id };
  }

  const url =
    result.next_step === "redirect_to_payment"
      ? safePaymentRedirectUrl(result.payment_url, allowedHosts)
      : null;

  if (url) return { type: "redirect", url };

  return {
    type: "payment_init_failed",
    order: {
      id: result.order.id,
      number: result.order.number,
      guestOrderToken: result.order.guest_order_token,
    },
  };
}
