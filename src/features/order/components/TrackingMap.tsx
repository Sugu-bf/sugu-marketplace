import { cn } from "@/lib/utils";
import { Truck, MapPin } from "lucide-react";

interface TrackingMapProps {
  className?: string;
}

/**
 * Tracking map placeholder — shows a stylized delivery illustration.
 * Server Component — purely presentational.
 * In production, this would be replaced with a live map integration (Google Maps / Mapbox).
 */
function TrackingMap({ className }: TrackingMapProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-muted to-primary-50/50 border border-border-light",
        "h-[200px] sm:h-[250px]",
        className
      )}
      role="img"
      aria-label="Carte de suivi de livraison"
    >
      {/* Decorative dotted route */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 600 250"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 50 200 Q 150 50 300 130 Q 450 210 550 80"
          stroke="#F15412"
          strokeWidth="3"
          strokeDasharray="8 6"
          fill="none"
        />
        {/* Grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 35}
            x2="600"
            y2={i * 35}
            stroke="#E5E5E5"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 55}
            y1="0"
            x2={i * 55}
            y2="250"
            stroke="#E5E5E5"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Start pin */}
      <div className="absolute left-[10%] top-[65%]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
          <MapPin size={16} className="text-white" />
        </div>
      </div>

      {/* Delivery truck (animated) */}
      <div className="absolute right-[25%] top-[35%] animate-float">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg border border-border-light">
          <Truck size={24} className="text-primary" />
        </div>
      </div>

      {/* Destination pin */}
      <div className="absolute right-[8%] top-[20%]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success shadow-lg shadow-success/30">
          <MapPin size={16} className="text-white" />
        </div>
      </div>

      {/* Overlay text */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/90 to-transparent pt-10 pb-4 px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Truck size={14} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Votre livreur est en route
          </p>
        </div>
      </div>
    </div>
  );
}

export { TrackingMap };
