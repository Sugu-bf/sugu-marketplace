"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CreditCard, Loader2, Package } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui";
import { isApiError } from "@/lib/api/errors";
import { retryOrderPayment } from "@/features/payment/api/payment.api";
import { safePaymentRedirectUrl } from "@/features/payment/utils/payment-redirect";
import { checkoutErrorMessage } from "../api/checkout.api";
import type { UnpaidOnlineOrder } from "../utils/place-order-next-step";

interface RetryFailure {
  message: string;
  /** False when retrying cannot succeed (order no longer payable, unknown). */
  canRetry: boolean;
}

const INIT_FAILED_MESSAGE =
  "Le paiement n'a toujours pas pu être lancé. Veuillez réessayer dans un instant.";

function retryFailure(error: unknown): RetryFailure {
  if (isApiError(error)) {
    if (error.status === 409 && error.details?.errorCode === "OUT_OF_STOCK") {
      return {
        message:
          "Un ou plusieurs articles de cette commande ne sont plus en stock : son paiement ne peut plus être lancé.",
        canRetry: false,
      };
    }
    if (error.status === 409) {
      return {
        message:
          "Cette commande ne peut plus être payée en ligne : elle est déjà payée, annulée ou en cours de vérification.",
        canRetry: false,
      };
    }
    if (error.status === 404) {
      return { message: "Cette commande est introuvable.", canRetry: false };
    }
    if (error.status === 502) {
      return { message: INIT_FAILED_MESSAGE, canRetry: true };
    }
  }
  return { message: checkoutErrorMessage(error), canRetry: true };
}

/**
 * Shown after an online order was created but its payment could not start.
 * The order exists, unpaid: the buyer retries the payment or leaves for its
 * orders — it is never told the order is paid.
 */
export function PaymentInitFailedPanel({ order }: { order: UnpaidOnlineOrder }) {
  const [retrying, setRetrying] = useState(false);
  const [failure, setFailure] = useState<RetryFailure | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setFailure(null);
    try {
      const result = await retryOrderPayment(order.id, order.guestOrderToken);
      const url = safePaymentRedirectUrl(result.payment_url);
      if (url) {
        window.location.href = url;
        return;
      }
      setFailure({ message: INIT_FAILED_MESSAGE, canRetry: true });
    } catch (error) {
      setFailure(retryFailure(error));
    }
    setRetrying(false);
  };

  const canRetry = failure?.canRetry ?? true;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
        <AlertCircle size={32} className="text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Le paiement n&apos;a pas pu être lancé
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Votre commande <span className="font-semibold text-foreground">n° {order.number}</span> est
        enregistrée mais n&apos;est pas payée. Aucun montant n&apos;a été débité.
      </p>

      {failure && (
        <div className="mb-6 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {failure.message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canRetry && (
          <Button variant="primary" size="lg" onClick={handleRetry} disabled={retrying}>
            {retrying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {retrying ? "Redirection…" : "Réessayer le paiement"}
          </Button>
        )}
        <Link
          href={`/track-order?order=${encodeURIComponent(order.id)}`}
          className={buttonVariants({ variant: canRetry ? "outline" : "primary", size: "lg" })}
        >
          <Package size={16} />
          Voir la commande
        </Link>
        <Link href="/account/orders" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          Mes commandes
        </Link>
      </div>
    </div>
  );
}
