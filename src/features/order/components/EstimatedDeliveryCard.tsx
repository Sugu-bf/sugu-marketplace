import { cn } from "@/lib/utils";
import { Calendar, Clock } from "lucide-react";

interface EstimatedDeliveryCardProps {
  estimatedDate: string;
  timeRange: string;
  progress: number;
  className?: string;
}

/**
 * Estimated delivery card — shows delivery date, time window, and progress bar.
 * Server Component — purely presentational.
 */
function EstimatedDeliveryCard({
  estimatedDate,
  timeRange,
  progress,
  className,
}: EstimatedDeliveryCardProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={cn(
        "rounded-2xl bg-primary-50 border border-primary-100 p-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Calendar size={14} className="text-primary" />
        </div>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          Livraison estimée
        </p>
      </div>

      {/* Date */}
      <p className="text-xl font-bold text-foreground">{estimatedDate}</p>

      {/* Time range */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <Clock size={12} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{timeRange}</p>
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Progression</span>
          <span className="text-xs font-bold text-primary">
            {clampedProgress}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out"
            style={{ width: `${clampedProgress}%` }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression de la livraison"
          />
        </div>
      </div>
    </div>
  );
}

export { EstimatedDeliveryCard };
