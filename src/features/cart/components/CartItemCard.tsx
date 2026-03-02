"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QuantitySelector } from "@/components/ui";
import { Trash2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { CartLineUI } from "@/features/cart";

interface CartItemCardProps {
  line: CartLineUI;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

/**
 * Individual cart item card — displays product info, price, quantity, and remove button.
 * Client component — handles quantity updates and removal.
 *
 * All prices/totals come from the backend (line.unitPrice, line.lineTotal).
 * The front does NOT compute totals.
 */
function CartItemCard({ line, onUpdateQuantity, onRemove, isUpdating = false, isRemoving = false }: CartItemCardProps) {
  const hasDiscount = line.compareAtPrice !== null && line.compareAtPrice > line.unitPrice;
  const isDisabled = isRemoving || line.flags.unavailable;

  return (
    <div
      className={cn(
        "group flex gap-4 rounded-2xl border border-border-light bg-background p-4 transition-all duration-300 hover:shadow-md hover:border-border",
        isRemoving && "opacity-50 pointer-events-none",
        line.flags.unavailable && "opacity-60 border-red-200 bg-red-50/30"
      )}
    >
      {/* Product Image */}
      <Link
        href={line.slug ? `/product/${line.slug}` : "#"}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28"
      >
        {line.image ? (
          <Image
            src={line.image}
            alt={line.name}
            fill
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-border">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
        {/* Top row: name + vendor */}
        <div className="space-y-1">
          <Link
            href={line.slug ? `/product/${line.slug}` : "#"}
            className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors sm:text-base"
          >
            {line.name}
          </Link>
          {line.vendorName && (
            <p className="text-xs text-muted-foreground">{line.vendorName}</p>
          )}

          {/* Variant badge */}
          {line.variantTitle && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {line.variantTitle}
              </span>
            </div>
          )}

          {/* Unavailable badge */}
          {line.flags.unavailable && (
            <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">
              Indisponible
            </span>
          )}

          {/* Price changed badge */}
          {line.flags.price_changed && (
            <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Prix mis à jour
            </span>
          )}
        </div>

        {/* Bottom row: price + quantity + subtotal */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary sm:text-base">
              {formatPrice(line.unitPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(line.compareAtPrice!)}
              </span>
            )}
          </div>

          {/* Quantity + Remove */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <QuantitySelector
                value={line.qty}
                onChange={(qty) => onUpdateQuantity(qty)}
                min={1}
                max={line.maxQuantity ?? 99}
                size="sm"
              />
              {/* Loading overlay on stepper */}
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
                  <Loader2 size={14} className="animate-spin text-primary" />
                </div>
              )}
            </div>

            <button
              onClick={onRemove}
              disabled={isDisabled}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200",
                "hover:bg-red-50 hover:text-error active:scale-90",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              )}
              aria-label={`Supprimer ${line.name} du panier`}
            >
              {isRemoving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Subtotal (line_total from backend) */}
        <div className="flex justify-end">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(line.lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export { CartItemCard };
