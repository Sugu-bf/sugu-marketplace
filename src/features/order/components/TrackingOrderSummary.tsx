"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import {
  CheckCircle2,
  Headphones,
  Clock,
  AlertCircle,
  CreditCard,
  Truck,
  Package,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { OrderItem, TrackedOrder } from "@/features/order";

// ─── COD Mixte step labels ────────────────────────────────────

const COD_MIXTE_STEP_LABELS: Record<string, { label: string; description: string; icon: typeof Clock }> = {
  awaiting_vendor: {
    label: "En attente du vendeur",
    description: "Le vendeur vérifie la disponibilité de vos produits.",
    icon: Package,
  },
  awaiting_negotiation: {
    label: "Négociation livraison",
    description: "L'agence négocie les frais de livraison avec vous.",
    icon: Truck,
  },
  awaiting_delivery_payment: {
    label: "Paiement livraison requis",
    description: "Payez les frais de livraison pour que le coursier se déplace.",
    icon: CreditCard,
  },
  awaiting_pickup: {
    label: "Collecte en cours",
    description: "Le coursier est en route pour récupérer vos produits.",
    icon: Truck,
  },
  awaiting_inspection: {
    label: "Inspection des produits",
    description: "Vérifiez les produits à la réception avant de payer.",
    icon: ShieldCheck,
  },
  awaiting_product_payment: {
    label: "Paiement produit requis",
    description: "Payez les produits pour recevoir votre code de livraison.",
    icon: CreditCard,
  },
  awaiting_code: {
    label: "Code de livraison",
    description: "Communiquez le code reçu au coursier pour finaliser.",
    icon: ShieldCheck,
  },
  completed: {
    label: "Livraison terminée",
    description: "Tous les paiements confirmés. Bonne réception !",
    icon: CheckCircle2,
  },
};

// ─── Props ────────────────────────────────────────────────────

interface TrackingOrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingLabel: string | null;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: TrackedOrder["paymentStatus"];
  codMixte: TrackedOrder["codMixte"];
  className?: string;
}

/**
 * Order summary card for tracking page — supports both standard and COD Mixte flows.
 * Shows split payment progress for COD Mixte orders.
 */
function TrackingOrderSummary({
  items,
  subtotal,
  shippingCost,
  shippingLabel,
  discount,
  total,
  paymentMethod,
  paymentStatus,
  codMixte,
  className,
}: TrackingOrderSummaryProps) {
  const isCodMixte = codMixte?.isCodMixte ?? false;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background shadow-sm lg:sticky lg:top-24",
        className
      )}
    >
      {/* Top accent — changes color based on payment status */}
      <div
        className={cn(
          "h-1 rounded-t-2xl bg-gradient-to-r",
          paymentStatus === "paid"
            ? "from-green-500 to-emerald-400"
            : paymentStatus === "partial"
              ? "from-amber-500 to-orange-400"
              : "from-primary to-primary-light"
        )}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-bold text-foreground">
          Résumé de la commande
        </h2>

        {/* ═══ COD Mixte Flow Status Card ═══ */}
        {isCodMixte && codMixte && (
          <CodMixteStatusCard codMixte={codMixte} />
        )}

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package size={20} className="text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} quantité
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-foreground">
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Pricing — with split for COD Mixte */}
        <div className="space-y-2.5 text-sm">
          <SummaryRow label="Sous-total" value={formatPrice(subtotal)} />

          {isCodMixte && codMixte ? (
            <>
              {/* Delivery Fee with payment badge */}
              <SummaryRow
                label="Livraison"
                value={formatPrice(codMixte.deliveryFeeAmount)}
                badge={shippingLabel}
                statusBadge={
                  codMixte.deliveryFeePaid
                    ? { label: "Payé", variant: "success" as const }
                    : { label: "Non payé", variant: "warning" as const }
                }
              />
              {/* Product Fee with payment badge */}
              <SummaryRow
                label="Produits"
                value={formatPrice(codMixte.productFeeAmount)}
                statusBadge={
                  codMixte.productFeePaid
                    ? { label: "Payé", variant: "success" as const }
                    : { label: "Non payé", variant: "warning" as const }
                }
              />
            </>
          ) : (
            <SummaryRow
              label="Livraison"
              value={formatPrice(shippingCost)}
              badge={shippingLabel}
            />
          )}

          {discount > 0 && (
            <SummaryRow
              label="Réduction"
              value={`-${formatPrice(discount)}`}
              valueClassName="text-success"
            />
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary sm:text-2xl">
            {formatPrice(total)}
          </span>
        </div>

        {/* Payment status indicator */}
        <PaymentStatusBanner
          paymentStatus={paymentStatus}
          paymentMethod={paymentMethod}
          codMixte={codMixte}
        />

        {/* ═══ COD Mixte Payment Action Buttons ═══ */}
        {isCodMixte && codMixte && (
          <CodMixtePaymentActions codMixte={codMixte} />
        )}

        {/* Support buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="md" className="text-xs">
            Besoin d&apos;aide ?
          </Button>
          <Button variant="primary" size="md" className="text-xs">
            <Headphones size={14} />
            Contacter le support
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── COD Mixte Status Card ──────────────────────────────────────

function CodMixteStatusCard({ codMixte }: { codMixte: NonNullable<TrackedOrder["codMixte"]> }) {
  const stepInfo = COD_MIXTE_STEP_LABELS[codMixte.currentStep] ?? {
    label: codMixte.currentStep,
    description: "",
    icon: Clock,
  };

  const StepIcon = stepInfo.icon;
  const isActionRequired =
    codMixte.currentStep === "awaiting_delivery_payment" ||
    codMixte.currentStep === "awaiting_product_payment";

  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-all",
        isActionRequired
          ? "bg-amber-50 border-amber-200 shadow-sm shadow-amber-100"
          : codMixte.currentStep === "completed"
            ? "bg-green-50 border-green-200"
            : "bg-blue-50 border-blue-200"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
            isActionRequired
              ? "bg-amber-100 text-amber-700"
              : codMixte.currentStep === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
          )}
        >
          <StepIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              isActionRequired
                ? "text-amber-800"
                : codMixte.currentStep === "completed"
                  ? "text-green-800"
                  : "text-blue-800"
            )}
          >
            {stepInfo.label}
          </p>
          <p
            className={cn(
              "text-xs mt-0.5",
              isActionRequired
                ? "text-amber-600"
                : codMixte.currentStep === "completed"
                  ? "text-green-600"
                  : "text-blue-600"
            )}
          >
            {stepInfo.description}
          </p>
        </div>
      </div>

      {/* Split progress bar */}
      <div className="mt-3 flex gap-1">
        <ProgressSegment
          label="Livraison"
          filled={codMixte.deliveryFeePaid}
        />
        <ProgressSegment
          label="Produit"
          filled={codMixte.productFeePaid}
        />
      </div>
    </div>
  );
}

function ProgressSegment({ label, filled }: { label: string; filled: boolean }) {
  return (
    <div className="flex-1">
      <div
        className={cn(
          "h-1.5 rounded-full transition-colors duration-500",
          filled ? "bg-green-500" : "bg-gray-200"
        )}
      />
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        {label} {filled ? "✓" : ""}
      </p>
    </div>
  );
}

// ─── COD Mixte Payment Actions ──────────────────────────────────

function CodMixtePaymentActions({ codMixte }: { codMixte: NonNullable<TrackedOrder["codMixte"]> }) {
  const [loading, setLoading] = React.useState<"delivery" | "product" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const showDeliveryButton =
    codMixte.currentStep === "awaiting_delivery_payment" &&
    codMixte.payDeliveryFeeUrl &&
    !codMixte.deliveryFeePaid;

  const showProductButton =
    codMixte.currentStep === "awaiting_product_payment" &&
    codMixte.payProductFeeUrl &&
    !codMixte.productFeePaid;

  if (!showDeliveryButton && !showProductButton) return null;

  const handlePayment = async (url: string, type: "delivery" | "product") => {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });
      const data = await res.json();
      if (data.success && data.data?.payment_url) {
        window.location.href = data.data.payment_url;
      } else {
        setError(data.message || "Erreur lors de l'initiation du paiement.");
        setLoading(null);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {showDeliveryButton && (
        <button
          onClick={() => handlePayment(codMixte.payDeliveryFeeUrl!, "delivery")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading === "delivery" ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CreditCard size={16} />
          )}
          {loading === "delivery" ? "Redirection..." : `Payer les frais de livraison — ${formatPrice(codMixte.deliveryFeeAmount)}`}
          {loading !== "delivery" && <ArrowRight size={14} />}
        </button>
      )}

      {showProductButton && (
        <button
          onClick={() => handlePayment(codMixte.payProductFeeUrl!, "product")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading === "product" ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CreditCard size={16} />
          )}
          {loading === "product" ? "Redirection..." : `Payer les produits — ${formatPrice(codMixte.productFeeAmount)}`}
          {loading !== "product" && <ArrowRight size={14} />}
        </button>
      )}
    </div>
  );
}

// ─── Payment Status Banner ──────────────────────────────────────

function PaymentStatusBanner({
  paymentStatus,
  paymentMethod,
  codMixte,
}: {
  paymentStatus: string;
  paymentMethod: string;
  codMixte: TrackedOrder["codMixte"];
}) {
  const isCodMixte = codMixte?.isCodMixte ?? false;

  // For COD Mixte — show detailed split status
  if (isCodMixte && codMixte) {
    const bothPaid = codMixte.deliveryFeePaid && codMixte.productFeePaid;
    const onePaid = codMixte.deliveryFeePaid || codMixte.productFeePaid;

    if (bothPaid) {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-700">
            Tout payé via Mobile Money
          </span>
        </div>
      );
    }

    if (onePaid) {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-700">
            Paiement partiel — {codMixte.deliveryFeePaid ? "livraison payée" : "produit payé"}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2.5">
        <AlertCircle size={18} className="text-orange-600 flex-shrink-0" />
        <span className="text-sm font-medium text-orange-700">
          Paiement à la livraison (COD)
        </span>
      </div>
    );
  }

  // Standard payment — existing logic
  if (paymentStatus === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
        <CheckCircle2 size={18} className="text-success flex-shrink-0" />
        <span className="text-sm font-medium text-green-700">
          Payé via {paymentMethod}
        </span>
      </div>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
        <Clock size={18} className="text-amber-600 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-700">
          Paiement en attente
        </span>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5">
        <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">
          Paiement échoué
        </span>
      </div>
    );
  }

  return null;
}

// ─── Helper ──────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClassName,
  badge,
  statusBadge,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  badge?: string | null;
  statusBadge?: { label: string; variant: "success" | "warning" } | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {label}
        {statusBadge && (
          <Badge
            variant={statusBadge.variant}
            size="xs"
            pill
          >
            {statusBadge.label}
          </Badge>
        )}
      </span>
      <span
        className={cn(
          "font-medium text-foreground flex items-center gap-1.5",
          valueClassName
        )}
      >
        {value}
        {badge && (
          <Badge variant="success" size="xs" pill>
            {badge}
          </Badge>
        )}
      </span>
    </div>
  );
}

export { TrackingOrderSummary };
