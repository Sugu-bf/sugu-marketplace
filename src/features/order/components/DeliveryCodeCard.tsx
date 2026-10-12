"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  KeyRound,
  Loader2,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeliveryCode } from "../hooks/useDeliveryCode";
import type { DeliveryCodeEntry } from "../models/delivery-code";

interface DeliveryCodeCardProps {
  orderId: string;
  /** Résumé de l'état de la commande : le code est redemandé dès qu'il change. */
  signal: string;
  className?: string;
}

const HEADING_ID = "delivery-code-heading";

/**
 * Code de confirmation de livraison — le client le lit ici et le donne au
 * livreur au moment de la remise. Le serveur décide s'il peut être lu ; quand
 * il ne le peut pas, la raison est dite et aucun code n'est affiché.
 */
export function DeliveryCodeCard({ orderId, signal, className }: DeliveryCodeCardProps) {
  const { deliveries, isLoading, isRefreshing, problem, retry } = useDeliveryCode(orderId, signal);

  // Commande close ou sans livraison : rien à confirmer, rien à afficher.
  const shown = (deliveries ?? []).filter((d) => d.state !== "order_closed");
  if (!isLoading && !problem && shown.length === 0) return null;

  return (
    <section
      aria-labelledby={HEADING_ID}
      className={cn(
        "rounded-2xl border border-border/80 bg-white shadow-sm p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <KeyRound size={18} className="flex-shrink-0 text-primary" aria-hidden="true" />
        <h2 id={HEADING_ID} className="text-base font-bold text-foreground">
          Code de confirmation de livraison
        </h2>
      </div>

      <div className="mt-3 space-y-3" role="status" aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Chargement de votre code…
          </p>
        )}

        {problem === "sign_in" && (
          <Notice icon={AlertCircle} tone="neutral">
            Connectez-vous avec le compte qui a passé la commande pour lire votre code.{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
              Se connecter
            </Link>
          </Notice>
        )}

        {problem === "not_yours" && (
          <Notice icon={AlertCircle} tone="neutral">
            Ce code n&apos;est lisible que par le compte qui a passé la commande.
          </Notice>
        )}

        {shown.map((delivery, index) => (
          <DeliveryCodeEntryView
            key={delivery.shipmentId}
            delivery={delivery}
            label={shown.length > 1 ? `Livraison ${index + 1} sur ${shown.length}` : null}
          />
        ))}

        {problem === "network" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-red-700">
              <WifiOff size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                {shown.length > 0
                  ? "La dernière vérification a échoué. Vérifiez votre connexion : l'état affiché peut ne plus être à jour."
                  : "Impossible de charger votre code pour le moment. Vérifiez votre connexion, puis réessayez."}
              </span>
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={isRefreshing}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} aria-hidden="true" />
              {isRefreshing ? "Nouvel essai…" : "Réessayer"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── One delivery ─────────────────────────────────────────────

function DeliveryCodeEntryView({
  delivery,
  label,
}: {
  delivery: DeliveryCodeEntry;
  label: string | null;
}) {
  const heading = label ? (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
  ) : null;

  if (delivery.state === "available" && delivery.code) {
    return (
      <div className="space-y-2">
        {heading}
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 text-center">
          <p className="break-all font-mono text-2xl font-bold tracking-[0.3em] text-foreground sm:text-3xl">
            <span data-testid="delivery-code" aria-hidden="true">
              {delivery.code}
            </span>
            {/* Lu caractère par caractère, pas comme un mot. */}
            <span className="sr-only">Votre code : {delivery.code.split("").join(" ")}</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{delivery.message}</p>
        <p className="text-xs text-muted-foreground">
          Ne le donnez à personne d&apos;autre, et jamais avant d&apos;avoir le colis en main.
        </p>
      </div>
    );
  }

  const look = (() => {
    switch (delivery.state) {
      case "product_payment_pending":
        return { icon: CreditCard, tone: "warning" as const };
      case "delivered":
        return { icon: CheckCircle2, tone: "success" as const };
      case "failed":
        return { icon: AlertCircle, tone: "warning" as const };
      default:
        return { icon: Clock, tone: "neutral" as const };
    }
  })();

  return (
    <div className="space-y-2">
      {heading}
      <Notice icon={look.icon} tone={look.tone}>
        {delivery.message}
      </Notice>
    </div>
  );
}

function Notice({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Clock;
  tone: "neutral" | "warning" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "success" && "border-green-200 bg-green-50 text-green-700",
        tone === "neutral" && "border-border bg-muted/40 text-foreground"
      )}
    >
      <Icon size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
