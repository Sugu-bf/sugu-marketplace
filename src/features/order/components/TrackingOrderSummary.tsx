import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import { CheckCircle2, Headphones } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { OrderItem } from "@/features/order";

interface TrackingOrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingLabel: string | null;
  discount: number;
  total: number;
  paymentMethod: string;
  className?: string;
}

/**
 * Order summary card for tracking page — read-only, no coupon, with payment status + support CTA.
 * Server Component — purely presentational.
 */
function TrackingOrderSummary({
  items,
  subtotal,
  shippingCost,
  shippingLabel,
  discount,
  total,
  paymentMethod,
  className,
}: TrackingOrderSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background shadow-sm lg:sticky lg:top-24",
        className
      )}
    >
      {/* Orange top accent */}
      <div className="h-1 rounded-t-2xl bg-gradient-to-r from-primary to-primary-light" />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-bold text-foreground">
          Résumé de la commande
        </h2>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
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

        {/* Pricing */}
        <div className="space-y-2.5 text-sm">
          <SummaryRow label="Sous-total" value={formatPrice(subtotal)} />
          <SummaryRow
            label="Livraison"
            value={formatPrice(shippingCost)}
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

        {/* Payment status */}
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5">
          <CheckCircle2 size={18} className="text-success flex-shrink-0" />
          <span className="text-sm font-medium text-green-700">
            Payé via {paymentMethod}
          </span>
        </div>

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
  badge?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
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
