"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { Lock, Smartphone, Truck, RotateCcw, ShieldCheck, Tag, X } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { CartItem } from "@/features/cart";

interface OrderSummaryProps {
  items: CartItem[];
}

/**
 * Order summary card — displays subtotal, discounts, shipping, coupon, and CTA.
 * Client component — handles coupon interaction.
 */
function OrderSummary({ items }: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculations
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const originalTotal = items.reduce(
    (acc, i) => acc + (i.originalPrice ?? i.price) * i.quantity,
    0
  );
  const discount = originalTotal - subtotal;
  const shipping = 0; // free shipping
  const total = subtotal - shipping;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    // Mock validation — in production, this would call the API
    if (couponCode.toUpperCase() === "SUGU10") {
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponError(null);
      setCouponCode("");
    } else {
      setCouponError("Code promo invalide");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
    <div className="rounded-2xl border border-border-light bg-background shadow-sm lg:sticky lg:top-24">
      {/* Orange top accent */}
      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary to-primary-light" />

      <div className="p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-bold text-foreground">Résumé de la commande</h2>

        {/* Summary rows */}
        <div className="space-y-3 text-sm">
          <SummaryRow
            label={`Sous-total (${itemCount} article${itemCount > 1 ? "s" : ""})`}
            value={formatPrice(subtotal)}
          />
          {discount > 0 && (
            <SummaryRow
              label="Réduction"
              value={`-${formatPrice(discount)}`}
              valueClassName="text-green-600"
            />
          )}
          <SummaryRow
            label="Livraison"
            value="Gratuite"
            valueClassName="text-green-600 font-semibold"
            icon={<Truck size={14} className="text-green-600" />}
          />
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
                className="text-green-600 hover:text-green-800 transition-colors"
                aria-label="Supprimer le code promo"
              >
                <X size={14} />
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
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 text-sm transition-all duration-200",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
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
                className="flex-shrink-0"
              >
                Appliquer
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-error" role="alert">
              {couponError}
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
            className="text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            <Lock size={16} />
            Passer la commande
          </Button>

          <Button
            variant="accent"
            size="lg"
            fullWidth
            pill
            className="text-base"
          >
            <Smartphone size={16} />
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
