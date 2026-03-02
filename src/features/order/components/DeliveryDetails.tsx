import { cn } from "@/lib/utils";
import { Truck, Package, MapPin, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui";
import type { DeliveryDriver } from "@/features/order";

interface DeliveryDetailsProps {
  agencyName: string;
  agencyRating: number;
  shippingMethod: string;
  deliveryAddress: string;
  driver: DeliveryDriver | null;
  className?: string;
}

/**
 * Delivery details card — agency, method, address, driver info.
 * Server Component — purely presentational.
 */
function DeliveryDetails({
  agencyName,
  agencyRating,
  shippingMethod,
  deliveryAddress,
  driver,
  className,
}: DeliveryDetailsProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      <h2 className="text-base font-bold text-foreground mb-4">
        Détails de livraison
      </h2>

      <div className="space-y-3.5">
        {/* Agency */}
        <DetailRow
          icon={<Truck size={16} />}
          label="Agence"
          value={
            <span className="flex items-center gap-2">
              {agencyName}
              <span className="inline-flex items-center gap-1 text-xs">
                <Star size={12} className="text-accent fill-accent" />
                <span className="font-semibold text-foreground">
                  {agencyRating}
                </span>
              </span>
            </span>
          }
        />

        {/* Shipping method */}
        <DetailRow
          icon={<Package size={16} />}
          label="Méthode"
          value={shippingMethod}
        />

        {/* Address */}
        <DetailRow
          icon={<MapPin size={16} />}
          label="Adresse"
          value={deliveryAddress}
        />

        {/* Driver */}
        {driver && (
          <DetailRow
            icon={<Phone size={16} />}
            label="Livreur"
            value={
              <div className="flex flex-wrap items-center gap-2">
                <span>{driver.name}</span>
                {driver.phone && (
                  <span className="text-xs text-muted-foreground">
                    {driver.phone}
                  </span>
                )}
                {driver.phone && (
                  <a
                    href={`tel:${driver.phone.replace(/\s/g, "")}`}
                    className="inline-block"
                  >
                    <Button variant="primary" size="xs" pill>
                      Appeler
                    </Button>
                  </a>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

export { DeliveryDetails };
