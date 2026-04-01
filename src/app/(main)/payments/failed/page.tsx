"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, ArrowRight, Headphones, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Payment Failed Page — /payments/failed?ref=...
 *
 * The backend redirects here after a failed/cancelled LigdiCash payment.
 * The `ref` param is an encrypted order ID (base64-encoded Laravel encrypt()).
 * We don't decrypt it on the frontend — we provide options to retry or get support.
 */
export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/30">
            <XCircle size={40} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Paiement non abouti
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Le paiement n&apos;a pas pu être finalisé. Aucun montant n&apos;a été débité de votre compte.
          </p>
        </div>

        {/* Reasons */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Causes possibles :
          </p>
          <ul className="text-xs text-amber-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Solde insuffisant sur votre compte mobile money</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Transaction annulée manuellement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Délai d&apos;attente dépassé (timeout)</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/account/orders">
            <Button variant="primary" size="lg" pill className="w-full sm:w-auto shadow-lg shadow-primary/20">
              <RefreshCw size={18} />
              Voir mes commandes
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" pill className="w-full sm:w-auto">
              <ShoppingBag size={18} />
              Retour à la boutique
            </Button>
          </Link>
        </div>

        {/* Support link */}
        <div className="pt-2">
          <Link
            href="/support-chat"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <Headphones size={14} />
            Besoin d&apos;aide ? Contactez le support
          </Link>
        </div>
      </div>
    </div>
  );
}
