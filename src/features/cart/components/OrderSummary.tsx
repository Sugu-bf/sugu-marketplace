"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { Lock, Smartphone, Truck, RotateCcw, Tag, X, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { CartTotalsUI } from "@/features/cart";

interface OrderSummaryProps {
  /** Totals from the backend — source of truth */
  totals: CartTotalsUI;
  /** Currently applied coupon code (if any) */
  couponCode: string | null;
  /** Apply a coupon code. Returns error string or null on success. */
  onApplyCoupon: (code: string) => Promise<string | null>;
  /** Remove the applied coupon */
  onRemoveCoupon: () => void;
  /** Start checkout flow */
  onCheckout: () => void;
  /** Start mobile money payment */
  onMobileMoneyPayment: () => void;
  /** Loading states */
  isApplyingCoupon: boolean;
  isCheckingOut: boolean;
  /** Success message from coupon operations */
  couponMessage: string | null;
}

/**
 * Order summary card — displays subtotal, discounts, shipping, coupon, and CTA.
 * Client component — handles coupon interaction.
 *
 * ALL totals come from the backend. The front does NOT compute prices.
 */
function OrderSummary({
  totals,
  couponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  onMobileMoneyPayment,
  isApplyingCoupon,
  isCheckingOut,
  couponMessage,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || isApplyingCoupon) return;
    setCouponError(null);

    const errorMsg = await onApplyCoupon(couponInput.trim());
    if (errorMsg) {
      setCouponError(errorMsg);
    } else {
      setCouponInput("");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponError(null);
    onRemoveCoupon();
  };

  return (
    <div className="rounded-2xl border border-border-light bg-background shadow-sm lg:sticky lg:top-24">
      {/* Orange top accent */}
      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary to-primary-light" />

      <div className="p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-bold text-foreground">Résumé de la commande</h2>

        {/* Summary rows — ALL from backend */}
        <div className="space-y-3 text-sm">
          <SummaryRow
            label={`Sous-total (${totals.itemCount} article${totals.itemCount > 1 ? "s" : ""})`}
            value={formatPrice(totals.subtotal)}
          />
          {totals.discount > 0 && (
            <SummaryRow
              label="Réduction"
              value={`-${formatPrice(totals.discount)}`}
              valueClassName="text-green-600"
            />
          )}
          <SummaryRow
            label="Livraison"
            value={totals.shippingFree ? "Gratuite" : formatPrice(totals.shipping)}
            valueClassName={totals.shippingFree ? "text-green-600 font-semibold" : undefined}
            icon={totals.shippingFree ? <Truck size={14} className="text-green-600" /> : undefined}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border" />

        {/* Total — from backend */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary sm:text-2xl">
            {formatPrice(totals.total)}
          </span>
        </div>

        {/* Coupon code */}
        <div className="space-y-2">
          {couponCode ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Tag size={14} />
                <span className="font-medium">{couponCode}</span>
              </div>
              <button
                onClick={handleRemoveCoupon}
                disabled={isApplyingCoupon}
                className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                aria-label="Supprimer le code promo"
              >
                {isApplyingCoupon ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Code promo"
                  disabled={isApplyingCoupon}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 text-sm transition-all duration-200",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    couponError ? "border-error" : "border-border"
                  )}
                  aria-label="Code promo"
                  aria-invalid={!!couponError}
                />
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponInput.trim()}
                className="flex-shrink-0"
              >
                {isApplyingCoupon ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Appliquer"
                )}
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-error" role="alert">
              {couponError}
            </p>
          )}
          {couponMessage && !couponError && (
            <p className="text-xs text-green-600" role="status">
              {couponMessage}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-1">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            pill
            onClick={onCheckout}
            disabled={isCheckingOut}
            className="text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            {isCheckingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={16} />
            )}
            {isCheckingOut ? "Traitement..." : "Passer la commande"}
          </Button>

          <Button
            variant="accent"
            size="lg"
            fullWidth
            pill
            onClick={onMobileMoneyPayment}
            disabled={isCheckingOut}
            className="text-base"
          >
            {isCheckingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Smartphone size={16} />
            )}
            Payer avec Mobile Money
          </Button>
        </div>

        {/* Assurance badges */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <AssuranceBadge icon={<Lock size={16} />} label="Paiement sécurisé" />
          <AssuranceBadge icon={<Truck size={16} />} label="Livraison rapide" />
          <AssuranceBadge icon={<RotateCcw size={16} />} label="Retours gratuits" />
        </div>
      </div>
    </div>
  );
}

// ─── Helper component ────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground flex items-center gap-1.5", valueClassName)}>
        {icon}
        {value}
      </span>
    </div>
  );
}

export { OrderSummary };
