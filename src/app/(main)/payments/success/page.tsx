"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Payment Success Page — /payments/success?ref=...
 *
 * The backend redirects here after a successful LigdiCash payment.
 * The `ref` param is an encrypted order ID (base64-encoded Laravel encrypt()).
 * We don't decrypt it on the frontend — we use it to redirect to the order tracking page.
 *
 * If no ref param is present, we show a generic success message.
 */
export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const ref = searchParams.get("ref");

  // Auto-redirect to order tracking after 5 seconds
  useEffect(() => {
    if (countdown <= 0) {
      if (ref) {
        // Navigate to orders page — the encrypted ref can be used server-side if needed
        router.push("/account/orders");
      }
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, ref, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success Icon with animation */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30">
            <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Paiement confirmé !
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Votre paiement a été traité avec succès. Votre commande est en cours de préparation.
          </p>
        </div>

        {/* Auto-redirect notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          <span>Redirection dans {countdown}s...</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account/orders">
            <Button variant="primary" size="lg" pill className="w-full sm:w-auto shadow-lg shadow-primary/20">
              <Package size={18} />
              Voir mes commandes
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" pill className="w-full sm:w-auto">
              <ShoppingBag size={18} />
              Continuer mes achats
            </Button>
          </Link>
        </div>

        {/* Trust message */}
        <p className="text-xs text-muted-foreground/70">
          Un email de confirmation vous sera envoyé sous peu.
        </p>
      </div>
    </div>
  );
}
