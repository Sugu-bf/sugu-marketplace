"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, QuantitySelector } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { ShoppingCart, Zap, Truck, RotateCcw, ShieldCheck, Loader2, XCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ContactSellerButton } from "@/features/messaging/components/ContactSellerButton";
import { formatPrice } from "@/lib/constants";
import type { Product } from "@/features/product";
import { addToCart, type ApiProductDetail } from "@/features/product";
import { isApiError } from "@/lib/api";
import { ProductVariants } from "./ProductVariants";
import { ProductPricing } from "./ProductPricing";
import { BulkPriceTable } from "./BulkPriceTable";
import { useToast } from "@/features/toast/toast-store";
import { emitCartChanged } from "@/features/cart/events/cart-events";
import {
  isStockQuantityUnknown,
  resolveApiVariant,
} from "../utils/product-availability";

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
  const [quantity, setQuantity] = useState(() => Math.max(1, apiData?.min_order_quantity ?? product.minOrderQuantity ?? 1));
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const submitMutex = useRef(false);

  // ─── Variant Selection State ─────────────────────────────
  // Initialize selected variants with first available option
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const defaultApiVariant = apiData?.variants.find(
      (variant) =>
        String(variant.id) === String(apiData.default_variant_id) &&
        variant.stock.in_stock
    ) ?? apiData?.variants.find((variant) => variant.stock.in_stock)
      ?? apiData?.variants.find(
        (variant) => String(variant.id) === String(apiData.default_variant_id)
      );

    if (apiData?.options.length && defaultApiVariant) {
      for (const option of apiData.options) {
        const selectedLabel = defaultApiVariant.option_values[option.name];
        const selectedValue = option.values.find((value) => value.label === selectedLabel);
        if (selectedValue) {
          initial[String(option.id)] = String(selectedValue.id);
        }
      }
      return initial;
    }

    product.variants?.forEach((variant) => {
      const firstAvailable = variant.options.find((option) => option.available);
      if (firstAvailable) initial[String(variant.id)] = String(firstAvailable.id);
    });
    return initial;
  });

  // ─── Resolve active API variant from selected options ────
  const resolvedApiVariant = useMemo(() => {
    return resolveApiVariant(apiData, selectedVariants);
  }, [apiData, selectedVariants]);

  const selectableVariants = useMemo(() => {
    if (!product.variants || !apiData?.options.length || !apiData.variants.length) {
      return product.variants;
    }

    return product.variants.map((group) => {
      const apiOption = apiData.options.find((option) => String(option.id) === String(group.id));
      if (!apiOption) return group;

      return {
        ...group,
        options: group.options.map((optionValue) => {
          const apiValue = apiOption.values.find((value) => String(value.id) === String(optionValue.id));
          if (!apiValue) return { ...optionValue, available: false };

          const available = apiData.variants.some((variant) => {
            if (!variant.stock.in_stock || variant.option_values[apiOption.name] !== apiValue.label) {
              return false;
            }

            return apiData.options.every((otherOption) => {
              if (String(otherOption.id) === String(apiOption.id)) return true;
              const selectedId = selectedVariants[String(otherOption.id)];
              if (!selectedId) return true;
              const selectedValue = otherOption.values.find((value) => String(value.id) === selectedId);
              return selectedValue
                ? variant.option_values[otherOption.name] === selectedValue.label
                : false;
            });
          });

          return { ...optionValue, available };
        }),
      };
    });
  }, [apiData, product.variants, selectedVariants]);

  // ─── Price calculation (backend-driven) ──────────────────
  const currentPrice = useMemo(() => {
    // If we have a resolved API variant, use its price (source of truth = backend)
    if (resolvedApiVariant) {
      return Math.round(resolvedApiVariant.pricing.price / 100);
    }

    // Fallback: use legacy calculation from mock data
    if (!product.variants) return product.price;

    const variantAdjustment = product.variants.reduce((sum, variant) => {
      const selectedOptionId = selectedVariants[String(variant.id)];
      const option = variant.options.find((o) => String(o.id) === selectedOptionId);
      return sum + (option?.priceAdjustment ?? 0);
    }, 0);

    return product.price + variantAdjustment;
  }, [resolvedApiVariant, product, selectedVariants]);

  // ─── Unit price with bulk tiers ──────────────────────────
  const activeBulkPrices = useMemo(() => {
    const apiTiers = resolvedApiVariant?.bulkPrices;
    if (!apiTiers?.length) return product.bulkPrices;

    const sorted = [...apiTiers].sort((a, b) => a.minQty - b.minQty);
    return sorted.map((tier, index) => {
      const nextTier = sorted[index + 1];
      return {
        minQty: tier.minQty,
        maxQty: nextTier ? nextTier.minQty - 1 : undefined,
        unitPrice: Math.round(tier.price / 100),
        label: nextTier
          ? `${tier.minQty}-${nextTier.minQty - 1} unités`
          : `${tier.minQty}+ unités`,
      };
    });
  }, [product.bulkPrices, resolvedApiVariant]);

  const unitPrice = useMemo(() => {
    if (!activeBulkPrices?.length) return currentPrice;

    const tier = activeBulkPrices.find((t) => {
      if (t.maxQty) return quantity >= t.minQty && quantity <= t.maxQty;
      return quantity >= t.minQty;
    });

    return tier ? tier.unitPrice : currentPrice;
  }, [activeBulkPrices, currentPrice, quantity]);

  const totalPrice = unitPrice * quantity;

  // ─── Stock for current variant ───────────────────────────
  const currentStock = useMemo(() => {
    if (resolvedApiVariant) {
      return resolvedApiVariant.stock.quantity;
    }
    return product.isStockUnlimited || isStockQuantityUnknown(apiData)
      ? null
      : product.stock;
  }, [apiData, resolvedApiVariant, product.isStockUnlimited, product.stock]);

  const isInStock = resolvedApiVariant
    ? resolvedApiVariant.stock.in_stock
    : product.isInStock ?? product.isStockUnlimited ?? product.stock > 0;

  const isStockUnlimited = resolvedApiVariant
    ? resolvedApiVariant.stock.is_unlimited
    : Boolean(product.isStockUnlimited);

  const minimumQuantity = resolvedApiVariant?.min_order_quantity
    ?? apiData?.min_order_quantity
    ?? product.minOrderQuantity
    ?? 1;

  useEffect(() => {
    setQuantity((current) => {
      const atLeastMinimum = Math.max(current, minimumQuantity);
      if (
        !isStockUnlimited &&
        currentStock !== null &&
        currentStock >= minimumQuantity
      ) {
        return Math.min(atLeastMinimum, currentStock);
      }
      return atLeastMinimum;
    });
  }, [currentStock, isStockUnlimited, minimumQuantity]);

  const canMeetMinimum = isStockUnlimited
    || currentStock === null
    || currentStock >= minimumQuantity;
  const isPurchasable = isInStock && canMeetMinimum;

  // ─── Variant change handler ──────────────────────────────
  const handleVariantSelect = useCallback((variantId: string, optionId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantId]: optionId }));
    setActionError(null);
    setActionSuccess(null);
  }, []);

  // ─── Resolve variant/product ID for cart ─────────────────
  const getCartPayload = useCallback(() => {
    if (resolvedApiVariant) {
      return { variant_id: resolvedApiVariant.id, qty: quantity };
    }
    if (apiData?.has_variants || (apiData?.options.length ?? 0) > 0) {
      return null;
    }
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
      if (!payload) {
        throw new Error("Veuillez sélectionner une combinaison de variantes disponible.");
      }
      const result = await addToCart(payload);

      // P3 — Facebook Pixel: AddToCart event
      if (typeof window !== "undefined" && window.fbq) {
        const variantId = resolvedApiVariant
          ? String(resolvedApiVariant.id)
          : apiData?.default_variant_id
            ? String(apiData.default_variant_id)
            : String(apiData?.id ?? product.id);

        window.fbq("track", "AddToCart", {
          content_ids: [variantId],
          content_type: "product",
          content_name: product.name,
          value: unitPrice,
          currency: "XOF",
          num_items: quantity,
        });
      }

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
        toast.warning(result.warnings.map((warning) => warning.message).join(", "));
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
        const msg = error instanceof Error
          ? error.message
          : "Erreur inattendue. Réessayez plus tard.";
        setActionError(msg);
        toast.error(msg);
      }
    } finally {
      setIsAddingToCart(false);
      submitMutex.current = false;
    }
  }, [
    apiData?.default_variant_id,
    apiData?.id,
    getCartPayload,
    isAddingToCart,
    product.id,
    product.name,
    product.slug,
    product.thumbnail,
    quantity,
    resolvedApiVariant,
    toast,
    unitPrice,
  ]);

  // ─── Buy Now ─────────────────────────────────────────────
  const handleBuyNow = useCallback(async () => {
    if (submitMutex.current || isBuyingNow) return;
    submitMutex.current = true;
    setIsBuyingNow(true);
    setActionError(null);

    try {
      const payload = getCartPayload();
      if (!payload) {
        throw new Error("Veuillez sélectionner une combinaison de variantes disponible.");
      }
      await addToCart(payload);

      // Redirect to checkout
      router.push("/checkout");
    } catch (error) {
      if (isApiError(error)) {
        setActionError(error.message || "Erreur lors de la commande.");
      } else {
        setActionError(
          error instanceof Error ? error.message : "Erreur inattendue. Réessayez plus tard."
        );
      }
    } finally {
      setIsBuyingNow(false);
      submitMutex.current = false;
    }
  }, [getCartPayload, isBuyingNow, router]);

  const isProcessing = isAddingToCart || isBuyingNow;
  const requiresResolvedVariant = Boolean(
    apiData?.has_variants || (apiData?.options.length ?? 0) > 0
  );
  const variantSelectionInvalid = requiresResolvedVariant && !resolvedApiVariant;
  const displayProduct: Product = {
    ...product,
    price: unitPrice,
    originalPrice: resolvedApiVariant?.pricing.compare_at_price
      ? Math.round(resolvedApiVariant.pricing.compare_at_price / 100)
      : product.originalPrice,
  };

  return (
    <div className="space-y-5">
      <ProductPricing product={displayProduct} />

      {activeBulkPrices && activeBulkPrices.length > 0 && (
        <BulkPriceTable
          tiers={activeBulkPrices}
          basePrice={displayProduct.originalPrice ?? currentPrice}
        />
      )}

      {/* Variants */}
      {selectableVariants && selectableVariants.length > 0 && (
        <ProductVariants
          variants={selectableVariants}
          selected={selectedVariants}
          onSelect={handleVariantSelect}
        />
      )}

      {variantSelectionInvalid && (
        <p className="text-sm text-error" role="alert">
          Cette combinaison de variantes n’est pas disponible. Modifiez votre sélection.
        </p>
      )}

      {/* Stock info */}
      <div className="flex items-center gap-4 text-sm">
        {!isInStock && (
          <span className="text-error font-medium inline-flex items-center gap-1.5">
            <XCircle size={14} /> Rupture de stock
          </span>
        )}
        {isInStock && !canMeetMinimum && (
          <span className="text-error font-medium inline-flex items-center gap-1.5">
            <AlertTriangle size={14} /> Stock insuffisant pour le minimum de {minimumQuantity}
          </span>
        )}
        {isInStock && currentStock !== null && currentStock > 0 && currentStock <= 20 && (
          <span className="text-error font-medium inline-flex items-center gap-1.5">
            <AlertTriangle size={14} /> {currentStock} restant{currentStock > 1 ? "s" : ""} en stock
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
            min={minimumQuantity}
            max={!isStockUnlimited && currentStock !== null ? Math.max(minimumQuantity, currentStock) : 500}
            size="md"
          />
          {minimumQuantity > 1 && (
            <p className="text-xs text-muted-foreground">
              Minimum de commande : {minimumQuantity}
            </p>
          )}
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
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 flex items-center gap-1.5" role="status">
          <CheckCircle2 size={14} /> {actionSuccess}
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
          disabled={!isPurchasable || variantSelectionInvalid || isProcessing}
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
          disabled={!isPurchasable || variantSelectionInvalid || isProcessing}
        >
          {isBuyingNow ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Zap size={18} />
          )}
          {isBuyingNow ? "Traitement en cours…" : "Acheter Maintenant"}
        </Button>
      </div>

      {/* Contact seller button */}
      {apiData?.seller && (
        <ContactSellerButton
          storeId={String(apiData.seller.id)}
          productId={apiData?.id ? String(apiData.id) : undefined}
          variant="outline"
          label="Contacter le vendeur"
          className="w-full justify-center"
        />
      )}

      {/* Assurance badges */}
      <div className="grid grid-cols-3 gap-3">
        <AssuranceBadge icon={<Truck size={18} />} label="Livraison 24-48h" />
        <AssuranceBadge icon={<RotateCcw size={18} />} label="Retours gratuits" />
        <AssuranceBadge icon={<ShieldCheck size={18} />} label="Qualité garantie" />
      </div>

      {/* Paiement à la livraison — modalités selon le montant */}
      <div className="rounded-xl border border-amber-200/80 bg-white shadow-sm p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck size={14} className="text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Paiement à la livraison disponible
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">
              Les modalités dépendent du montant de votre commande : règlement en espèces à la réception pour les petits paniers, paiement sécurisé en étapes pour les commandes plus importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ProductActions };
