"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PaymentResult } from "@/features/payment/components/PaymentResult";

/**
 * Payment Failed Page — /payments/failed?ref=...
 *
 * The provider sends the buyer here when it cancels or leaves the payment,
 * yet the payment may have gone through or still be processing. The page asks
 * the API for the status behind the opaque `ref`: a succeeded payment is shown
 * as such, and the failure message stays for a failed or unknown payment.
 */
export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const ref = searchParams.get("ref");
  const query = searchParams.toString();

  return (
    <PaymentResult
      key={ref ?? ""}
      paymentRef={ref}
      landing="failed"
      returnTo={query ? `${pathname}?${query}` : pathname}
    />
  );
}
