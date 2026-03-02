"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, QuantitySelector } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { ShoppingCart, Zap, Truck, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { Product } from "@/features/product";
import { addToCart, type ApiProductDetail } from "@/features/product";
import { isApiError } from "@/lib/api";
import { ProductVariants } from "./ProductVariants";
import { useToast } from "@/features/toast/toast-store";
import { emitCartChanged } from "@/features/cart/events/cart-events";

interface ProductActionsProps {
  product: Product;
  /** Raw API data for real variant resolution */
  apiData?: ApiProductDetail;
}

/**
 * Product actions orchestrator — handles variant selection, quantity, and cart actions.
 * Client component — the minimal client boundary for all interactive elements.
 *
 * When apiData is present (real API), it uses the backend's variant structure
 * to determine pricing and stock per variant. No price invention.
 */
function ProductActions({ product, apiData }: ProductActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const submitMutex = useRef(false);

  // ─── Variant Selection State ─────────────────────────────
  // Initialize selected variants with first available option
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    product.variants?.forEach((v) => {
      const firstAvailable = v.options.find((o) => o.available);
      if (firstAvailable) initial[v.id] = firstAvailable.id;
    });
    return initial;
  });

  // ─── Resolve active API variant from selected options ────
  const resolvedApiVariant = useMemo(() => {
    if (!apiData?.variants.length || !apiData?.options.length) return null;

    // Build the selection map: option_name -> selected value label
    const selectionMap: Record<string, string> = {};
    for (const option of apiData.options) {
      const selectedOptionId = selectedVariants[Number(option.id)];
      if (selectedOptionId) {
        const value = option.values.find((v) => Number(v.id) === selectedOptionId);
        if (value) selectionMap[option.name] = value.label;
      }
    }

    // Find the variant that matches all selected option values
    return apiData.variants.find((variant) => {
      return Object.entries(selectionMap).every(
        ([optName, optValue]) => variant.option_values[optName] === optValue
      );
    }) ?? null;
  }, [apiData, selectedVariants]);

  // ─── Price calculation (backend-driven) ──────────────────
  const currentPrice = useMemo(() => {
    // If we have a resolved API variant, use its price (source of truth = backend)
    if (resolvedApiVariant) {
      return resolvedApiVariant.pricing.price;
    }

    // Fallback: use legacy calculation from mock data
    if (!product.variants) return product.price;

    const variantAdjustment = product.variants.reduce((sum, variant) => {
      const selectedOptionId = selectedVariants[variant.id];
      const option = variant.options.find((o) => o.id === selectedOptionId);
      return sum + (option?.priceAdjustment ?? 0);
    }, 0);

    return product.price + variantAdjustment;
  }, [resolvedApiVariant, product, selectedVariants]);

  // ─── Unit price with bulk tiers ──────────────────────────
  const unitPrice = useMemo(() => {
    if (!product.bulkPrices?.length) return currentPrice;

    const tier = product.bulkPrices.find((t) => {
      if (t.maxQty) return quantity >= t.minQty && quantity <= t.maxQty;
      return quantity >= t.minQty;
    });

    return tier ? tier.unitPrice : currentPrice;
  }, [currentPrice, product.bulkPrices, quantity]);

  const totalPrice = unitPrice * quantity;

  // ─── Stock for current variant ───────────────────────────
  const currentStock = useMemo(() => {
    if (resolvedApiVariant) {
      return resolvedApiVariant.stock.quantity;
    }
    return product.stock;
  }, [resolvedApiVariant, product.stock]);

  const isInStock = resolvedApiVariant
    ? resolvedApiVariant.stock.in_stock
    : product.stock > 0;

  // ─── Variant change handler ──────────────────────────────
  const handleVariantSelect = useCallback((variantId: number, optionId: number) => {
    setSelectedVariants((prev) => ({ ...prev, [variantId]: optionId }));
    setActionError(null);
    setActionSuccess(null);
  }, []);

  // ─── Resolve variant/product ID for cart ─────────────────
  const getCartPayload = useCallback(() => {
    if (resolvedApiVariant) {
      return { variant_id: resolvedApiVariant.id, qty: quantity };
    }
    if (apiData?.default_variant_id) {
      return { variant_id: apiData.default_variant_id, qty: quantity };
    }
    // Fallback: send product_id and let backend resolve
    return { product_id: apiData?.id ?? product.id, qty: quantity };
  }, [resolvedApiVariant, apiData, product.id, quantity]);

  // ─── Add to Cart ─────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (submitMutex.current || isAddingToCart) return; // anti double-click
    submitMutex.current = true;
    setIsAddingToCart(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload = getCartPayload();
      const result = await addToCart(payload);

      // Show success toast + refresh header badge
      setActionSuccess("Ajouté au panier !");
      toast.success(`${product.name} ajouté au panier !`, {
        action: { label: "Voir le panier", href: "/cart" },
      });
      emitCartChanged({
        action: "add",
        item: {
          id: String(product.id),
          name: product.name,
          slug: product.slug,
          thumbnail: product.thumbnail,
          price: unitPrice,
          qty: quantity,
        },
      });

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        toast.warning(result.warnings.join(", "));
      }

      // Auto-clear success message after 3s
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      if (isApiError(error)) {
        const msg = error.status === 409 || error.status === 422
          ? error.message || "Stock insuffisant."
          : error.code === "UNAUTHORIZED"
            ? "Veuillez vous connecter pour ajouter au panier."
            : error.code === "RATE_LIMITED"
              ? "Trop de requêtes. Veuillez patienter."
              : error.message || "Erreur lors de l'ajout au panier.";
        setActionError(msg);
        toast.error(msg);
      } else {
        const msg = "Erreur inattendue. Réessayez plus tard.";
        setActionError(msg);
        toast.error(msg);
      }
    } finally {
      setIsAddingToCart(false);
      submitMutex.current = false;
    }
  }, [getCartPayload, isAddingToCart]);

  // ─── Buy Now ─────────────────────────────────────────────
  const handleBuyNow = useCallback(async () => {
    if (submitMutex.current || isBuyingNow) return;
    submitMutex.current = true;
    setIsBuyingNow(true);
    setActionError(null);

    try {
      const payload = getCartPayload();
      await addToCart(payload);

      // Redirect to checkout
      router.push("/checkout");
    } catch (error) {
      if (isApiError(error)) {
        setActionError(error.message || "Erreur lors de la commande.");
      } else {
        setActionError("Erreur inattendue. Réessayez plus tard.");
      }
    } finally {
      setIsBuyingNow(false);
      submitMutex.current = false;
    }
  }, [getCartPayload, isBuyingNow, router]);

  const isProcessing = isAddingToCart || isBuyingNow;

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
        {!isInStock && (
          <span className="text-error font-medium">
            ❌ Rupture de stock
          </span>
        )}
        {isInStock && currentStock > 0 && currentStock <= 20 && (
          <span className="text-error font-medium">
            ⚠️ {currentStock} restant{currentStock > 1 ? "s" : ""} en stock
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
            max={currentStock > 0 ? currentStock : product.stock}
            size="md"
          />
        </div>
        {quantity > 1 && (
          <div className="text-sm text-muted-foreground mt-5">
            Total : <span className="font-bold text-foreground text-base">{formatPrice(totalPrice)}</span>
          </div>
        )}
      </div>

      {/* Error / Success messages */}
      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700" role="status">
          ✅ {actionSuccess}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          pill
          className="text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          aria-label={`Ajouter ${product.name} au panier`}
          onClick={handleAddToCart}
          disabled={!isInStock || isProcessing}
        >
          {isAddingToCart ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ShoppingCart size={18} />
          )}
          {isAddingToCart ? "Ajout en cours…" : `Ajouter au Panier — ${formatPrice(totalPrice)}`}
        </Button>

        <Button
          variant="accent"
          size="lg"
          fullWidth
          pill
          className="text-base"
          aria-label="Acheter maintenant"
          onClick={handleBuyNow}
          disabled={!isInStock || isProcessing}
        >
          {isBuyingNow ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Zap size={18} />
          )}
          {isBuyingNow ? "Traitement en cours…" : "Acheter Maintenant"}
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
