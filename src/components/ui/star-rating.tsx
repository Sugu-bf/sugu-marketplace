import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeMap = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

/**
 * Star rating display component — Server Component.
 * Renders filled, half-filled, and empty stars based on rating value.
 */
function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const iconSize = sizeMap[size];
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Note : ${rating} sur ${maxStars}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const fillPercentage = Math.min(1, Math.max(0, rating - i));
          const isFull = fillPercentage >= 0.9;
          const isEmpty = fillPercentage <= 0.1;

          if (isFull) {
            return (
              <Star
                key={i}
                size={iconSize}
                className="fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
            );
          }

          if (isEmpty) {
            return (
              <Star
                key={i}
                size={iconSize}
                className="fill-gray-200 text-gray-200"
                aria-hidden="true"
              />
            );
          }

          // Half star
          return (
            <div key={i} className="relative" style={{ width: iconSize, height: iconSize }}>
              <Star
                size={iconSize}
                className="absolute inset-0 fill-gray-200 text-gray-200"
                aria-hidden="true"
              />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                <Star
                  size={iconSize}
                  className="fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-semibold text-foreground", textSize)}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSize)}>
          ({reviewCount} avis)
        </span>
      )}
    </div>
  );
}

export { StarRating };
