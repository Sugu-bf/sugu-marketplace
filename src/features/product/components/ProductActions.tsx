"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button, QuantitySelector } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { ShoppingCart, Zap, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { Product } from "@/features/product";
import { ProductVariants } from "./ProductVariants";

interface ProductActionsProps {
  product: Product;
}

/**
 * Product actions orchestrator — handles variant selection, quantity, and cart actions.
 * Client component — the minimal client boundary for all interactive elements.
 */
function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  // Initialize selected variants with first available option
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    product.variants?.forEach((v) => {
      const firstAvailable = v.options.find((o) => o.available);
      if (firstAvailable) initial[v.id] = firstAvailable.id;
    });
    return initial;
  });

  // Calculate price adjustment from selected variants
  const variantAdjustment = useMemo(() => {
    if (!product.variants) return 0;
    return product.variants.reduce((sum, variant) => {
      const selectedOptionId = selectedVariants[variant.id];
      const option = variant.options.find((o) => o.id === selectedOptionId);
      return sum + (option?.priceAdjustment ?? 0);
    }, 0);
  }, [product.variants, selectedVariants]);

  // Calculate unit price based on bulk tiers and quantity
  const unitPrice = useMemo(() => {
    const basePrice = product.price + variantAdjustment;
    if (!product.bulkPrices?.length) return basePrice;

    const tier = product.bulkPrices.find((t) => {
      if (t.maxQty) return quantity >= t.minQty && quantity <= t.maxQty;
      return quantity >= t.minQty;
    });

    return tier ? tier.unitPrice + variantAdjustment : basePrice;
  }, [product.price, product.bulkPrices, quantity, variantAdjustment]);

  const totalPrice = unitPrice * quantity;

  const handleVariantSelect = (variantId: number, optionId: number) => {
    setSelectedVariants((prev) => ({ ...prev, [variantId]: optionId }));
  };

  return (
    <div className="space-y-5">
      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <ProductVariants
          variants={product.variants}
          selected={selectedVariants}
          onSelect={handleVariantSelect}
        />
      )}

      {/* Stock info */}
      <div className="flex items-center gap-4 text-sm">
        {product.stock > 0 && product.stock <= 20 && (
          <span className="text-error font-medium">
            ⚠️ {product.stock} restant{product.stock > 1 ? "s" : ""} en stock
          </span>
        )}
        {product.sold > 0 && (
          <span className="text-muted-foreground">
            {product.sold} vendu{product.sold > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Quantity + Price summary */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-foreground">Quantité :</label>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={product.stock}
            size="md"
          />
        </div>
        {quantity > 1 && (
          <div className="text-sm text-muted-foreground mt-5">
            Total : <span className="font-bold text-foreground text-base">{formatPrice(totalPrice)}</span>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          pill
          className="text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          aria-label={`Ajouter ${product.name} au panier`}
        >
          <ShoppingCart size={18} />
          Ajouter au Panier — {formatPrice(totalPrice)}
        </Button>

        <Button
          variant="accent"
          size="lg"
          fullWidth
          pill
          className="text-base"
          aria-label="Acheter maintenant"
        >
          <Zap size={18} />
          Acheter Maintenant
        </Button>
      </div>

      {/* Assurance badges */}
      <div className="grid grid-cols-3 gap-3">
        <AssuranceBadge icon={<Truck size={18} />} label="Livraison 24-48h" />
        <AssuranceBadge icon={<RotateCcw size={18} />} label="Retours gratuits" />
        <AssuranceBadge icon={<ShieldCheck size={18} />} label="Qualité garantie" />
      </div>
    </div>
  );
}

export { ProductActions };
