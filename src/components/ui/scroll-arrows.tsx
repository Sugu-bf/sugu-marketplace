"use client";

import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollArrowsProps {
  /** Ref to the scrollable container element */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Scroll amount in pixels (default: 300) */
  scrollAmount?: number;
  /** Arrow button size variant */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable scroll navigation arrows (paired).
 * Renders both arrows side-by-side — use in section headers.
 */
function ScrollArrows({
  scrollRef,
  scrollAmount = 300,
  size = "md",
  className,
}: ScrollArrowsProps) {
  const scroll = useCallback(
    (direction: "left" | "right") => {
      scrollRef.current?.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    },
    [scrollRef, scrollAmount]
  );

  const btnClasses = cn(
    "flex items-center justify-center rounded-full border border-border bg-white transition-all duration-200",
    "hover:border-primary/40 hover:bg-primary-50 hover:shadow-md active:scale-90",
    size === "sm" ? "h-8 w-8" : "h-9 w-9"
  );

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        onClick={() => scroll("left")}
        className={btnClasses}
        aria-label="Défiler vers la gauche"
      >
        <ChevronLeft size={iconSize} className="text-muted-foreground" />
      </button>
      <button
        onClick={() => scroll("right")}
        className={btnClasses}
        aria-label="Défiler vers la droite"
      >
        <ChevronRight size={iconSize} className="text-muted-foreground" />
      </button>
    </div>
  );
}

/* ── Individual arrow button (for split left/right positioning) ── */

interface ScrollArrowProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  direction: "left" | "right";
  scrollAmount?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Single scroll arrow button.
 * Use when you need arrows on opposite sides of a container (e.g. CategoryBar).
 */
function ScrollArrow({
  scrollRef,
  direction,
  scrollAmount = 300,
  size = "md",
  className,
}: ScrollArrowProps) {
  const scroll = useCallback(() => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, [scrollRef, direction, scrollAmount]);

  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={scroll}
      className={cn(
        "flex items-center justify-center rounded-full border border-border bg-white shadow-md transition-all duration-200",
        "hover:shadow-lg hover:scale-110 active:scale-90",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
      aria-label={
        direction === "left"
          ? "Défiler vers la gauche"
          : "Défiler vers la droite"
      }
    >
      <Icon size={iconSize} className="text-muted-foreground" />
    </button>
  );
}

export { ScrollArrows, ScrollArrow };
