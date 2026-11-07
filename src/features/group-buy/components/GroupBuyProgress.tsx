import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupBuyTier } from "../api/group-buy.schemas";
import { formatCentimes } from "../lib/group-buy-format";

interface GroupBuyProgressProps {
  tiers: GroupBuyTier[];
  reservedQty: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * The tier gauge: how much the group has reserved, and where each price
 * drop starts. `md` names each tier under its mark; `sm` (cards) shows the
 * bar and the marks only.
 */
export function GroupBuyProgress({ tiers, reservedQty, size = "md", className }: GroupBuyProgressProps) {
  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  const top = Math.max(sorted.at(-1)?.min_qty ?? 1, reservedQty, 1);
  const fill = Math.min(100, (reservedQty / top) * 100);
  const position = (qty: number) => Math.min(100, (qty / top) * 100);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn("relative w-full rounded-full bg-primary-50", size === "md" ? "h-3" : "h-2")}
        role="progressbar"
        aria-label="Quantité réservée par le groupe"
        aria-valuemin={0}
        aria-valuemax={top}
        aria-valuenow={reservedQty}
        aria-valuetext={`${reservedQty} réservé${reservedQty > 1 ? "s" : ""} sur ${top} pour le meilleur prix`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-light to-primary transition-[width] duration-700 ease-out"
          style={{ width: `${fill}%` }}
        />
        {sorted.map((tier) => {
          const reached = reservedQty >= tier.min_qty;
          return (
            <span
              key={tier.min_qty}
              className={cn(
                "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white",
                size === "md" ? "h-5 w-5" : "h-3.5 w-3.5",
                reached ? "bg-primary" : "bg-primary-200",
              )}
              style={{ left: `${position(tier.min_qty)}%` }}
              aria-hidden="true"
            >
              {reached && size === "md" && <Check size={11} strokeWidth={3} className="text-white" />}
            </span>
          );
        })}
      </div>

      {size === "md" && sorted.length > 0 && (
        <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Paliers de prix">
          {sorted.map((tier) => {
            const reached = reservedQty >= tier.min_qty;
            return (
              <li
                key={tier.min_qty}
                className={cn(
                  "min-w-[96px] flex-1 rounded-xl border px-2.5 py-2 text-center",
                  reached ? "border-primary/40 bg-primary-50" : "border-border bg-white",
                )}
              >
                <p className={cn("text-[11px] font-semibold", reached ? "text-primary-700" : "text-foreground/70")}>
                  {reached && <Check size={11} strokeWidth={3} className="mr-0.5 inline -mt-0.5" aria-hidden="true" />}
                  Dès {tier.min_qty}
                </p>
                <p className={cn("text-sm font-bold", reached ? "text-primary" : "text-foreground")}>
                  {formatCentimes(tier.unit_price)}
                </p>
                <p className="text-[11px] text-foreground/60">-{Math.round(tier.saving_percent)} %</p>
                <span className="sr-only">{reached ? "palier atteint" : "palier à atteindre"}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
