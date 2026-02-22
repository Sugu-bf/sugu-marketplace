import { cn } from "@/lib/utils";
import { Truck, Star } from "lucide-react";
import type { DeliveryAgency } from "@/features/checkout";

interface DeliveryAgencyPreviewProps {
  agency: DeliveryAgency | null;
  onEdit: () => void;
  className?: string;
}

/**
 * Delivery agency preview card — shows the selected agency or a placeholder to choose one.
 * Purely presentational except for the onEdit callback.
 */
function DeliveryAgencyPreview({
  agency,
  onEdit,
  className,
}: DeliveryAgencyPreviewProps) {
  // ─── No agency selected yet ────────────────────────────
  if (!agency) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-border p-5 text-left transition-all duration-200",
          "hover:border-primary/40 hover:bg-primary-50/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Truck size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">
            Agence de livraison
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choisissez une agence pour voir les options de livraison
          </p>
        </div>
        <span className="text-sm font-semibold text-primary flex-shrink-0">
          Choisir
        </span>
      </button>
    );
  }

  // ─── Agency selected ───────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {/* Agency logo placeholder */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white text-lg font-bold">
            {agency.name.charAt(0)}
          </div>

          {/* Agency details */}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Agence de livraison
            </h3>
            <p className="text-sm text-foreground font-medium">
              {agency.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {agency.description}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star size={12} className="text-accent fill-accent" />
              <span className="text-xs font-medium text-foreground">
                {agency.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({agency.reviewCount} avis)
              </span>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex-shrink-0"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}

export { DeliveryAgencyPreview };
