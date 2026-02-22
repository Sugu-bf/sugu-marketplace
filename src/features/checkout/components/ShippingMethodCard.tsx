"use client";

import { cn } from "@/lib/utils";
import { Truck, Zap, Store } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { ShippingMethod } from "@/features/checkout";

// ─── Icon mapping ────────────────────────────────────────────

const ICON_MAP = {
  truck: Truck,
  zap: Zap,
  store: Store,
} as const;

// ─── Props ───────────────────────────────────────────────────

interface ShippingMethodCardProps {
  method: ShippingMethod;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Shipping method radio option card.
 * Client component — handles selection interaction.
 */
function ShippingMethodCard({ method, isSelected, onSelect }: ShippingMethodCardProps) {
  const IconComponent = ICON_MAP[method.icon];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(method.id)}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
        "hover:border-primary/40 hover:bg-primary-50/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary-50 shadow-sm"
          : "border-border bg-background"
      )}
    >
      {/* Radio indicator */}
      <div
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
          isSelected ? "border-primary" : "border-border"
        )}
      >
        {isSelected && (
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-scale-in" />
        )}
      </div>

      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          isSelected
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <IconComponent size={20} />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold transition-colors duration-200",
            isSelected ? "text-foreground" : "text-foreground"
          )}
        >
          {method.name}
          <span className="ml-1 text-muted-foreground font-normal">
            ({method.description})
          </span>
        </p>
      </div>

      {/* Price */}
      <span
        className={cn(
          "flex-shrink-0 text-sm font-bold",
          method.price === 0
            ? "text-success"
            : isSelected
              ? "text-primary"
              : "text-foreground"
        )}
      >
        {method.price === 0 ? "Gratuit" : formatPrice(method.price)}
      </span>
    </button>
  );
}

export { ShippingMethodCard };
