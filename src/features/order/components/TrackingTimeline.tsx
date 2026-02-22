import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/features/order";

interface TrackingTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

/**
 * Vertical activity timeline — shows order history events.
 * Server Component — purely presentational.
 */
function TrackingTimeline({ events, className }: TrackingTimelineProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      <h2 className="text-base font-bold text-foreground mb-5">Historique</h2>

      <div className="relative" role="list" aria-label="Historique de la commande">
        {/* Vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border"
          aria-hidden="true"
        />

        <div className="space-y-5">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="relative flex items-start gap-4 pl-0"
              role="listitem"
            >
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 transition-all",
                    event.isLatest
                      ? "border-primary bg-primary shadow-sm shadow-primary/30"
                      : "border-primary/60 bg-primary/60"
                  )}
                />
                {event.isLatest && (
                  <div className="absolute -inset-1 rounded-full bg-primary/15 animate-pulse-glow" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    event.isLatest
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {event.date}
                </p>
                <p
                  className={cn(
                    "text-sm mt-0.5",
                    event.isLatest
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { TrackingTimeline };
