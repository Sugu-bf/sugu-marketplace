import { Badge } from "@/components/ui";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { formatPrice } from "@/lib/constants";
import type { Product } from "@/features/product";

interface ProductPricingProps {
  product: Product;
}

/**
 * Product pricing section — regular price, promo price, savings, countdown.
 * Server Component with client countdown timer lazy loaded.
 */
function ProductPricing({ product }: ProductPricingProps) {
  const hasPromo = product.promoPrice !== undefined && product.promoPrice < (product.originalPrice ?? product.price);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const savings = hasDiscount ? product.originalPrice! - product.price : 0;

  return (
    <div className="rounded-xl bg-primary-50/60 p-4 space-y-3 border border-primary-100">
      {/* Regular / Promo prices */}
      <div className="space-y-1">
        {hasDiscount && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Prix régulier :</span>
            <span className="text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {hasPromo ? "Prix promo :" : "Prix :"}
          </span>
          <span className="text-2xl font-bold text-primary sm:text-3xl">
            {formatPrice(product.price)}
          </span>
          {savings > 0 && (
            <Badge variant="success" size="sm" pill>
              Économisez {formatPrice(savings)}
            </Badge>
          )}
        </div>
      </div>

      {/* Countdown timer */}
      {product.promoEndsAt && (
        <CountdownTimer
          targetDate={product.promoEndsAt}
          label="Promo expire dans"
        />
      )}
    </div>
  );
}

export { ProductPricing };
