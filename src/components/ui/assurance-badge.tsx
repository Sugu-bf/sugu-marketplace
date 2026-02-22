import { cn } from "@/lib/utils";

interface AssuranceBadgeProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

/**
 * Reusable assurance/trust badge — used in Product Detail, Cart, and Checkout.
 * Server Component — purely presentational.
 */
function AssuranceBadge({ icon, label, className }: AssuranceBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-border-light bg-muted/50 p-3 text-center",
        className
      )}
    >
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-medium text-muted-foreground leading-tight">
        {label}
      </span>
    </div>
  );
}

export { AssuranceBadge };
