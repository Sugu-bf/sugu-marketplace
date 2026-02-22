"use client";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/features/product";

interface ProductVariantsProps {
  variants: ProductVariant[];
  /** Map: variant id -> selected option id */
  selected: Record<number, number>;
  onSelect: (variantId: number, optionId: number) => void;
  className?: string;
}

/**
 * Product variant selector — displays variant groups with selectable pills.
 * Client component — handles selection interaction.
 */
function ProductVariants({ variants, selected, onSelect, className }: ProductVariantsProps) {
  if (!variants.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {variants.map((variant) => {
        const selectedOptionId = selected[variant.id];

        return (
          <div key={variant.id} className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {variant.name} :
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={variant.name}>
              {variant.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isDisabled = !option.available;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isDisabled}
                    onClick={() => onSelect(variant.id, option.id)}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all duration-200",
                      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-50",
                      isDisabled && "opacity-40 cursor-not-allowed line-through"
                    )}
                  >
                    {option.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ProductVariants };
