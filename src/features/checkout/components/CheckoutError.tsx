"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

interface CheckoutErrorProps {
  title: string;
  message: string;
  linkHref?: string;
  linkLabel?: string;
  onRetry?: () => void;
}

/**
 * Checkout error state — shown when session is missing, expired, or invalid.
 * Client component for optional onRetry interaction.
 */
export function CheckoutError({
  title,
  message,
  linkHref = "/cart",
  linkLabel = "Retour au panier",
  onRetry,
}: CheckoutErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
        <AlertCircle size={32} className="text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8">{message}</p>

      <div className="flex gap-3">
        {onRetry && (
          <Button variant="outline" size="lg" onClick={onRetry}>
            Réessayer
          </Button>
        )}
        <Link href={linkHref}>
          <Button variant="primary" size="lg">
            <ArrowLeft size={16} />
            {linkLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
