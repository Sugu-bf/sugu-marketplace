"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QuantitySelector } from "@/components/ui";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { CartItem } from "@/features/cart";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

/**
 * Individual cart item card — displays product info, price, quantity, and remove button.
 * Client component — handles quantity updates and removal.
 */
function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const subtotal = item.price * item.quantity;

  return (
    <div className="group flex gap-4 rounded-2xl border border-border-light bg-background p-4 transition-all duration-300 hover:shadow-md hover:border-border">
      {/* Product Image */}
      <Link
        href={`/product/${item.slug}`}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28"
      >
        <Image
          src={item.thumbnail}
          alt={item.name}
          fill
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
        />
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
        {/* Top row: name + vendor */}
        <div className="space-y-1">
          <Link
            href={`/product/${item.slug}`}
            className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors sm:text-base"
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground">{item.vendorName}</p>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {item.variants.map((v) => (
                <span
                  key={v.name}
                  className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {v.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom row: price + quantity + subtotal */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary sm:text-base">
              {formatPrice(item.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(item.originalPrice!)}
              </span>
            )}
          </div>

          {/* Quantity + Remove */}
          <div className="flex items-center gap-3">
            <QuantitySelector
              value={item.quantity}
              onChange={(qty) => onUpdateQuantity(item.productId, qty)}
              min={1}
              max={item.maxQuantity ?? 99}
              size="sm"
            />

            <button
              onClick={() => onRemove(item.productId)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-error active:scale-90"
              aria-label={`Supprimer ${item.name} du panier`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Subtotal (visible on sm+) */}
        <div className="flex justify-end">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export { CartItemCard };
