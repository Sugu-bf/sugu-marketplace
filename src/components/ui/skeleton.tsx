import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders as a circle instead of a rectangle */
  circle?: boolean;
}

/**
 * Skeleton placeholder with built-in shimmer animation.
 * Uses the `.skeleton` CSS class from globals.css.
 *
 * @example
 * <Skeleton className="h-6 w-48" />
 * <Skeleton circle className="h-12 w-12" />
 */
function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton",
        circle && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
