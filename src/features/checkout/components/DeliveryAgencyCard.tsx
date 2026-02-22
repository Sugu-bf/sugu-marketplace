"use client";

import { cn } from "@/lib/utils";
import { Star, ChevronRight } from "lucide-react";
import type { DeliveryAgency } from "@/features/checkout";

interface DeliveryAgencyCardProps {
  agency: DeliveryAgency;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Delivery agency selection card — first step before choosing shipping method.
 * Client component — handles selection interaction.
 */
function DeliveryAgencyCard({ agency, isSelected, onSelect }: DeliveryAgencyCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(agency.id)}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all duration-200",
        "hover:border-primary/40 hover:bg-primary-50/30 hover:shadow-sm",
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

      {/* Agency logo placeholder */}
      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold transition-colors duration-200",
          isSelected
            ? "bg-primary text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        {agency.name.charAt(0)}
      </div>

      {/* Agency info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{agency.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {agency.description}
        </p>
        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1">
          <Star size={12} className="text-accent fill-accent" />
          <span className="text-xs font-medium text-foreground">
            {agency.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({agency.reviewCount} avis)
          </span>
        </div>
      </div>

      {/* Arrow indicator */}
      <ChevronRight
        size={18}
        className={cn(
          "flex-shrink-0 transition-all duration-200",
          isSelected
            ? "text-primary translate-x-0"
            : "text-muted-foreground/50 -translate-x-1 group-hover:translate-x-0 group-hover:text-muted-foreground"
        )}
      />
    </button>
  );
}

export { DeliveryAgencyCard };
