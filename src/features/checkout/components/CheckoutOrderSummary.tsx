"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { ArrowRight, Lock, ShieldCheck, Truck, Tag, X, Smartphone, Loader2, Banknote, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { Badge } from "@/components/ui";
import type { OrderSummaryItem } from "@/features/checkout";

// ─── Props ───────────────────────────────────────────────────

interface CheckoutOrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  initialCouponCode: string | null;
  shippingLabel?: string;
  /** Apply coupon via API — returns success/error */
  onApplyCoupon?: (code: string) => Promise<{ success: boolean; error?: string }>;
  /** Remove coupon via API */
  onRemoveCoupon?: () => Promise<void>;
  /** Place order action */
  onPlaceOrder?: (paymentMethod: "cod" | "moneroo") => Promise<void>;
  /** Whether an order placement is in progress */
  isPlacingOrder?: boolean;
}

/**
 * Checkout order summary — compact item list + pricing + coupon + CTA.
 * Client component — handles coupon interaction.
 *
 * RULE: All prices displayed here come from the backend (props).
 * This component NEVER calculates totals.
 */
function CheckoutOrderSummary({
  items,
  subtotal,
  shippingCost,
  discount,
  total,
  initialCouponCode,
  shippingLabel,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  isPlacingOrder = false,
}: CheckoutOrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(initialCouponCode);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    if (onApplyCoupon) {
      // Real API call
      setCouponLoading(true);
      setCouponError(null);
      try {
        const result = await onApplyCoupon(couponCode.trim());
        if (result.success) {
          setAppliedCoupon(couponCode.toUpperCase());
          setCouponCode("");
        } else {
          setCouponError(result.error || "Code promo invalide");
        }
      } catch {
        setCouponError("Erreur lors de l'application du coupon");
      } finally {
        setCouponLoading(false);
      }
    } else {
      // Fallback (no API connected)
      setCouponError("Code promo invalide");
    }
  };

  const handleRemoveCoupon = async () => {
    if (onRemoveCoupon) {
      setCouponLoading(true);
      try {
        await onRemoveCoupon();
        setAppliedCoupon(null);
        setCouponError(null);
      } catch {
        setCouponError("Erreur lors de la suppression du coupon");
      } finally {
        setCouponLoading(false);
      }
    } else {
      setAppliedCoupon(null);
      setCouponError(null);
    }
  };

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "moneroo">("cod");

  const handlePlaceOrder = async () => {
    if (onPlaceOrder && !isPlacingOrder) {
      await onPlaceOrder(paymentMethod);
    }
  };

  return (
    <div className="rounded-2xl border border-border-light bg-background shadow-sm lg:sticky lg:top-24">
      {/* Orange top accent */}
      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary to-primary-light" />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-bold text-foreground">Résumé de la commande</h2>

        {/* Compact item list */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>

              {/* Name + quantity */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    × {item.quantity}
                  </p>
                )}
              </div>

              {/* Price */}
              <span className="flex-shrink-0 text-sm font-bold text-foreground">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Summary rows */}
        <div className="space-y-2.5 text-sm">
          <SummaryRow label="Sous-total" value={formatPrice(subtotal)} />
          <SummaryRow
            label="Livraison"
            value={shippingCost === 0 ? "Gratuite" : formatPrice(shippingCost)}
            valueClassName={shippingCost === 0 ? "text-success" : undefined}
            badge={shippingLabel}
          />
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

        {/* Coupon code */}
        <div className="space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Tag size={14} />
                <span className="font-medium">{appliedCoupon}</span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={couponLoading}
                className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                aria-label="Supprimer le code promo"
              >
                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Code promo"
                  disabled={couponLoading}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 text-sm transition-all duration-200",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    "disabled:opacity-50",
                    couponError ? "border-error" : "border-border"
                  )}
                  aria-label="Code promo"
                  aria-invalid={!!couponError}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="flex-shrink-0"
              >
                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Appliquer"}
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-error" role="alert">
              {couponError}
            </p>
          )}
        </div>

        {/* ── Payment Method Selector (WARN-01 fix) ── */}
        <div className="space-y-2.5">
          <p className="text-sm font-bold text-foreground">Moyen de paiement</p>
          <div className="space-y-2" role="radiogroup" aria-label="Moyen de paiement">
            {/* COD option */}
            <button
              type="button"
              role="radio"
              aria-checked={paymentMethod === "cod"}
              onClick={() => setPaymentMethod("cod")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-background"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                paymentMethod === "cod" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Banknote size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Paiement à la livraison</p>
                <p className="text-xs text-muted-foreground">Payez en espèces lors de la réception</p>
              </div>
              <div className={cn(
                "h-4 w-4 rounded-full border-2 transition-colors",
                paymentMethod === "cod" ? "border-primary bg-primary" : "border-border"
              )}>
                {paymentMethod === "cod" && (
                  <div className="h-full w-full rounded-full bg-white scale-[0.4]" />
                )}
              </div>
            </button>

            {/* Moneroo (Mobile Money) option */}
            <button
              type="button"
              role="radio"
              aria-checked={paymentMethod === "moneroo"}
              onClick={() => setPaymentMethod("moneroo")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                paymentMethod === "moneroo"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-background"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                paymentMethod === "moneroo" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Wallet size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Paiement mobile</p>
                <p className="text-xs text-muted-foreground">Orange Money, Moov Money, Wave</p>
              </div>
              <div className={cn(
                "h-4 w-4 rounded-full border-2 transition-colors",
                paymentMethod === "moneroo" ? "border-primary bg-primary" : "border-border"
              )}>
                {paymentMethod === "moneroo" && (
                  <div className="h-full w-full rounded-full bg-white scale-[0.4]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          pill
          disabled={isPlacingOrder}
          onClick={handlePlaceOrder}
          className="text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              Procéder au paiement
              <ArrowRight size={18} />
            </>
          )}
        </Button>

        {/* Payment methods */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock size={12} />
            Paiement sécurisé
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A1F71]">VISA</span>
            <span className="font-semibold text-[#EB001B]">MC</span>
            <Smartphone size={14} className="text-accent-dark" />
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <AssuranceBadge icon={<ShieldCheck size={16} />} label="Fraîcheur garantie" />
          <AssuranceBadge icon={<Truck size={16} />} label="Suivi en temps réel" />
        </div>
      </div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClassName,
  badge,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground flex items-center gap-1.5", valueClassName)}>
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

export { CheckoutOrderSummary };
