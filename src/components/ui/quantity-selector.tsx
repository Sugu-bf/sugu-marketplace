"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    button: "h-7 w-7",
    text: "w-8 text-sm",
    icon: 12,
  },
  md: {
    button: "h-9 w-9",
    text: "w-10 text-base",
    icon: 14,
  },
  lg: {
    button: "h-11 w-11",
    text: "w-12 text-lg",
    icon: 16,
  },
} as const;

/**
 * Reusable quantity selector with increment/decrement buttons.
 * Client component — requires state management.
 */
function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 999,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const styles = sizeStyles[size];
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0 rounded-xl border-2 border-border bg-background overflow-hidden",
        className
      )}
      role="group"
      aria-label="Sélecteur de quantité"
    >
      <button
        type="button"
        onClick={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
        className={cn(
          "flex items-center justify-center transition-colors duration-200",
          "hover:bg-primary/10 hover:text-primary active:scale-95",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground",
          styles.button
        )}
        aria-label="Diminuer la quantité"
      >
        <Minus size={styles.icon} />
      </button>

      <span
        className={cn(
          "flex items-center justify-center font-semibold text-foreground select-none border-x border-border",
          styles.text
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
        className={cn(
          "flex items-center justify-center transition-colors duration-200",
          "hover:bg-primary/10 hover:text-primary active:scale-95",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground",
          styles.button
        )}
        aria-label="Augmenter la quantité"
      >
        <Plus size={styles.icon} />
      </button>
    </div>
  );
}

export { QuantitySelector };
export type { QuantitySelectorProps };
