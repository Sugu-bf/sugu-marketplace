"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { RefreshCw, ServerCrash } from "lucide-react";

interface OrdersErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for /account/orders.
 *
 * Shown when queryOrders() throws a non-auth error (500, schema mismatch,
 * network failure) — prevents a misleading "Aucune commande" empty state.
 */
export default function OrdersError({ error, reset }: OrdersErrorProps) {
  useEffect(() => {
    console.error("[Orders Page] Error boundary caught:", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-border/80 bg-white shadow-sm p-8 lg:p-12 text-center">
      <ServerCrash size={48} className="text-destructive mx-auto mb-4" />
      <p className="text-base font-semibold text-foreground lg:text-lg">
        Impossible de charger vos commandes
      </p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Une erreur technique s&apos;est produite...
      </p>
      <Button variant="primary" size="md" onClick={reset}>
        <RefreshCw size={14} className="mr-2" />
        Réessayer
      </Button>
    </div>
  );
}
