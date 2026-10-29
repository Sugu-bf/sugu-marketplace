import { cn } from "@/lib/utils";
import { Truck, Package, MapPin, Phone, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import type { DeliveryDriver } from "@/features/order";
import type { TrackedShipment } from "../models/order";

interface DeliveryDetailsProps {
  agencyName: string;
  agencyRating: number;
  shippingMethod: string;
  deliveryAddress: string;
  driver: DeliveryDriver | null;
  /** Every shipment of the order: when there are several, each is shown. */
  shipments?: TrackedShipment[];
  className?: string;
}

/**
 * Delivery details card — agency, method, address, driver info.
 * An order that travels in several shipments shows each of them, not only
 * the first. Server Component — purely presentational.
 */
function DeliveryDetails({
  agencyName,
  agencyRating,
  shippingMethod,
  deliveryAddress,
  driver,
  shipments = [],
  className,
}: DeliveryDetailsProps) {
  const several = shipments.length > 1;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-white shadow-sm p-5 sm:p-6",
        className
      )}
    >
      <h2 className="text-base font-bold text-foreground mb-4">
        Détails de livraison
      </h2>

      <div className="space-y-3.5">
        {several ? (
          shipments.map((shipment, index) => (
            <section
              key={shipment.id}
              aria-label={`Livraison ${index + 1} sur ${shipments.length}`}
              className="space-y-3.5 rounded-xl border border-border-light p-4"
            >
              <h3 className="text-sm font-semibold text-foreground">
                Livraison {index + 1} sur {shipments.length}
                {shipment.storeName ? ` — ${shipment.storeName}` : ""}
              </h3>
              <AgencyRow name={shipment.agencyName} rating={shipment.agencyRating} />
              <DetailRow icon={<Package size={16} />} label="Méthode" value={shipment.shippingMethod} />
              {shipment.estimatedDate && (
                <DetailRow
                  icon={<Calendar size={16} />}
                  label="Livraison estimée"
                  value={
                    shipment.estimatedTimeRange
                      ? `${shipment.estimatedDate} · ${shipment.estimatedTimeRange}`
                      : shipment.estimatedDate
                  }
                />
              )}
              {shipment.driver && <DriverRow driver={shipment.driver} />}
            </section>
          ))
        ) : (
          <>
            <AgencyRow name={agencyName} rating={agencyRating} />
            <DetailRow icon={<Package size={16} />} label="Méthode" value={shippingMethod} />
          </>
        )}

        {/* Address */}
        <DetailRow
          icon={<MapPin size={16} />}
          label="Adresse"
          value={deliveryAddress}
        />

        {!several && driver && <DriverRow driver={driver} />}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function AgencyRow({ name, rating }: { name: string; rating: number }) {
  return (
    <DetailRow
      icon={<Truck size={16} />}
      label="Agence"
      value={
        <span className="flex items-center gap-2">
          {name}
          <span className="inline-flex items-center gap-1 text-xs">
            <Star size={12} className="text-accent fill-accent" />
            <span className="font-semibold text-foreground">{rating}</span>
          </span>
        </span>
      }
    />
  );
}

function DriverRow({ driver }: { driver: DeliveryDriver }) {
  return (
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
  );
}

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
