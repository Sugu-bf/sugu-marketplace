import { cn } from "@/lib/utils";
import { MapPin, Phone, Home, Briefcase, Users } from "lucide-react";
import type { ShippingAddress } from "@/features/checkout";

// ─── Icon mapping for address labels ─────────────────────────

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Maison: <Home size={16} />,
  Bureau: <Briefcase size={16} />,
  Famille: <Users size={16} />,
};

function getLabelIcon(label: string) {
  return LABEL_ICONS[label] ?? <MapPin size={16} />;
}

// ─── Props ───────────────────────────────────────────────────

interface AddressPreviewProps {
  address: ShippingAddress;
  onEdit?: () => void;
  className?: string;
}

/**
 * Shipping address preview card — shows the selected delivery address.
 * Supports both server (link to /account/addresses) and client (onEdit callback) modes.
 */
function AddressPreview({ address, onEdit, className }: AddressPreviewProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {/* Address label icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
            {getLabelIcon(address.label)}
          </div>

          {/* Address details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Adresse de livraison
              </h3>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {address.label}
              </span>
            </div>
            <p className="text-sm text-foreground font-medium">
              {address.fullName}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {address.street}
              <br />
              {address.city}, {address.country}
            </p>
            {address.phone && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Phone size={12} />
                {address.phone}
              </p>
            )}
          </div>
        </div>

        {/* Edit button */}
        {onEdit ? (
          <button
            onClick={onEdit}
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex-shrink-0"
          >
            Modifier
          </button>
        ) : (
          <a
            href="/account/addresses"
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex-shrink-0"
          >
            Modifier
          </a>
        )}
      </div>
    </div>
  );
}

export { AddressPreview };
