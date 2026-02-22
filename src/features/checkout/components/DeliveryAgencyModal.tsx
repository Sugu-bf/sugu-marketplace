"use client";

import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui";
import { Star, Check } from "lucide-react";
import type { DeliveryAgency } from "@/features/checkout";

interface DeliveryAgencyModalProps {
  open: boolean;
  onClose: () => void;
  agencies: DeliveryAgency[];
  selectedAgencyId: string | null;
  onSelectAgency: (id: string) => void;
}

/**
 * Delivery agency selection modal — pick from available delivery partners.
 * Client component — handles selection interaction.
 */
function DeliveryAgencyModal({
  open,
  onClose,
  agencies,
  selectedAgencyId,
  onSelectAgency,
}: DeliveryAgencyModalProps) {
  const handleSelectAndClose = (id: string) => {
    onSelectAgency(id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choisir une agence de livraison"
      size="lg"
    >
      <div className="space-y-2.5">
        {agencies.map((agency) => {
          const isSelected = agency.id === selectedAgencyId;

          return (
            <button
              key={agency.id}
              type="button"
              onClick={() => handleSelectAndClose(agency.id)}
              className={cn(
                "group flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary-50/30 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary-50"
                  : "border-border bg-background"
              )}
            >
              {/* Check / radio indicator */}
              <div
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isSelected ? "border-primary bg-primary" : "border-border"
                )}
              >
                {isSelected && (
                  <Check size={12} className="text-white" strokeWidth={3} />
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
                <p className="text-sm font-semibold text-foreground">
                  {agency.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {agency.description}
                </p>
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
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export { DeliveryAgencyModal };
