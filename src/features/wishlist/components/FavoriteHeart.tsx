"use client";

import { Heart } from "lucide-react";
import { useCallback, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useIsFavorite } from "../hooks/use-is-favorite";
import { useToggleFavorite } from "../hooks/use-toggle-favorite";

export interface FavoriteHeartProps {
  productId: string;
  className?: string;
}

/**
 * Favorite toggle overlay for product cards. Reads the store via useIsFavorite
 * (primitive selector → targeted re-render) and flips via useToggleFavorite.
 * Works for guests (local Set, merged at login). Sits inside a Link, so the
 * click must never propagate to navigation.
 */
export function FavoriteHeart({ productId, className }: FavoriteHeartProps) {
  const isFavorite = useIsFavorite(productId);
  const { toggle, isPending } = useToggleFavorite();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      toggle(productId);
    },
    [productId, toggle],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorite}
      aria-busy={isPending}
      className={cn(
        "absolute right-2 top-2 z-10",
        "flex h-9 w-9 items-center justify-center rounded-full",
        "bg-white/90 shadow-sm backdrop-blur",
        "transition-colors duration-150 hover:bg-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
        isPending && "pointer-events-none opacity-60",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "h-5 w-5 transition-colors duration-150",
          isFavorite ? "fill-current text-red-500" : "text-gray-700",
        )}
      />
    </button>
  );
}
