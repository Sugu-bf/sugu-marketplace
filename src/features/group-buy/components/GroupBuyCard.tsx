import Image from "next/image";
import Link from "next/link";
import { Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupBuySummary } from "../api/group-buy.schemas";
import { formatCentimes, nextStepLabel } from "../lib/group-buy-format";
import { GroupBuyCountdown } from "./GroupBuyCountdown";
import { GroupBuyProgress } from "./GroupBuyProgress";

export function GroupBuyThumb({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={cn("relative flex-shrink-0 overflow-hidden rounded-xl border border-border-light bg-white", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="96px" className="object-contain p-1.5 mix-blend-multiply" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary-50/60 text-primary/40">
          <Package size={28} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

interface GroupBuyCardProps {
  group: GroupBuySummary;
  /** Server time minus device time. */
  offset?: number;
  className?: string;
}

/** One open group, for the lists and the home strip. */
export function GroupBuyCard({ group, offset = 0, className }: GroupBuyCardProps) {
  const name = group.product?.name ?? "Produit";
  const discounted = group.current_unit_price < group.base_unit_price;
  const bestSaving = Math.round(
    group.tiers.reduce((best, tier) => Math.max(best, tier.saving_percent), 0),
  );

  return (
    <Link
      href={`/groupe/${group.code}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-border-light bg-white p-3.5 shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      aria-label={`Achat groupé : ${name}, ${group.members_count} membre${group.members_count > 1 ? "s" : ""}`}
    >
      <div className="flex gap-3">
        <GroupBuyThumb src={group.product?.image_url ?? null} alt={name} className="h-20 w-20" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {name}
          </p>
          <p className="mt-0.5 truncate text-xs text-foreground/60">
            {group.store?.name}
            {group.city ? ` · ${group.city}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-primary">{formatCentimes(group.current_unit_price)}</span>
            {discounted && (
              <span className="text-xs text-foreground/50 line-through">{formatCentimes(group.base_unit_price)}</span>
            )}
          </div>
        </div>
        {bestSaving > 0 && (
          <span className="h-fit flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
            -{bestSaving} %
          </span>
        )}
      </div>

      <GroupBuyProgress tiers={group.tiers} reservedQty={group.reserved_qty} size="sm" className="mt-3" />

      <p className="mt-2 text-xs font-semibold text-primary-700">{nextStepLabel(group)}</p>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-foreground/70">
          <Users size={14} aria-hidden="true" />
          {group.members_count} membre{group.members_count > 1 ? "s" : ""} · {group.reserved_qty} réservé{group.reserved_qty > 1 ? "s" : ""}
        </span>
        {group.status === "open" && <GroupBuyCountdown target={group.closes_at} offset={offset} className="text-xs" />}
      </div>
    </Link>
  );
}
