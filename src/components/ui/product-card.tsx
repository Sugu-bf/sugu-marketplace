"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/features/product";
import { formatPrice } from "@/lib/constants";
import { addToCart } from "@/features/product";
import { useToast } from "@/features/toast/toast-store";
import { emitCartChanged } from "@/features/cart/events/cart-events";

interface ProductCardProps {
  product: ProductListItem;
  /** Show SALE badge on hover */
  showSaleBadge?: boolean;
  className?: string;
}

/**
 * Reusable product card — used in BestSeller, Trending Stores, Search, Category.
 * Links to /product/[slug] for product detail page.
 * Quick-add button sends product_id to the cart API.
 */
function ProductCard({ product, showSaleBadge, className }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const href = product.slug ? `/product/${product.slug}` : "#";
  const toast = useToast();

  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");

  const handleQuickAdd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (addState !== "idle") return;
      setAddState("loading");

      try {
        await addToCart({ product_id: product.id, qty: 1 });

        setAddState("done");
        toast.success(`${product.name} ajouté au panier !`, {
          action: { label: "Voir le panier", href: "/cart" },
        });

        // Notify header cart badge to refresh with product preview data
        emitCartChanged({
          action: "add",
          item: {
            id: String(product.id),
            name: product.name,
            slug: product.slug,
            thumbnail: product.thumbnail,
            price: product.price,
            qty: 1,
          },
        });

        // Reset button after 2s
        setTimeout(() => setAddState("idle"), 2000);
      } catch (err) {
        setAddState("idle");
        const message =
          err instanceof Error ? err.message : "Erreur lors de l'ajout au panier.";
        toast.error(message);
      }
    },
    [addState, product.id, product.name, toast]
  );

  return (
    <Link
      href={href}
      className={cn(
        "group flex-shrink-0 w-[160px] sm:w-[200px] cursor-pointer block",
        className
      )}
    >
      {/* Product Image */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/10">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          sizes="220px"
        />
        {/* Sale badge (hover reveal) */}
        {showSaleBadge && hasDiscount && (
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            PROMO
          </div>
        )}
        {/* Quick add button */}
        <button
          className={cn(
            "absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-90",
            addState === "done"
              ? "bg-green-500 text-white opacity-100 translate-y-0"
              : "bg-primary text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
          aria-label={`Ajouter ${product.name} au panier`}
          onClick={handleQuickAdd}
          disabled={addState === "loading"}
        >
          {addState === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : addState === "done" ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <ShoppingCart size={16} />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-1">
          {product.name}
        </h3>
        {product.vendorName && (
          <p className="text-xs text-muted-foreground">{product.vendorName}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {product.stock > 0 && (
            <span className="text-error font-medium">
              {product.stock} restant{product.stock > 1 ? "s" : ""}
            </span>
          )}
          {product.sold > 0 && (
            <span className="text-muted-foreground">
              {product.sold} vendu{product.sold > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export { ProductCard };
