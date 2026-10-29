"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PaymentResult } from "@/features/payment/components/PaymentResult";

/**
 * Payment Success Page — /payments/success?ref=...
 *
 * The provider sends the buyer back here when it leaves the payment, which
 * does not mean the payment succeeded: it may still be processing, or have
 * failed. The page asks the API for the status behind the opaque `ref` and
 * says « Paiement confirmé » only once it is succeeded.
 */
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const ref = searchParams.get("ref");
  const query = searchParams.toString();

  return (
    <PaymentResult
      key={ref ?? ""}
      paymentRef={ref}
      landing="success"
      returnTo={query ? `${pathname}?${query}` : pathname}
    />
  );
}
