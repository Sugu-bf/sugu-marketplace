"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { fetchGroupBuyOffer } from "../api/group-buy.api";
import { clockOffsetFrom, formatCentimes, nextStepLabel } from "../lib/group-buy-format";
import { GroupBuyCountdown } from "./GroupBuyCountdown";
import { LaunchGroupDialog } from "./LaunchGroupDialog";

interface GroupBuyOfferPanelProps {
  productId: string;
  /** The variant chosen on the page; null for a product without variants. */
  variantId: string | null;
}

/**
 * On the product page: what buying together would cost, the open groups to
 * join, and a button to launch one. Shows nothing for a product the seller
 * has not opened to group buying.
 */
export function GroupBuyOfferPanel({ productId, variantId }: GroupBuyOfferPanelProps) {
  const [launching, setLaunching] = useState(false);
  const query = useQuery({
    queryKey: ["group-buys", "offer", productId, variantId],
    queryFn: () => fetchGroupBuyOffer(productId, variantId),
    staleTime: 30_000,
    retry: 1,
  });

  const offer = query.data;
  if (!offer || !offer.groupable || offer.tiers.length === 0) return null;

  const tiers = [...offer.tiers].sort((a, b) => a.min_qty - b.min_qty);
  const offset = clockOffsetFrom(offer.open_groups[0]?.server_now, query.dataUpdatedAt || undefined);

  return (
    <section
      className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary-50 via-white to-white p-4 shadow-sm"
      aria-labelledby="gb-offer-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-700">
            <Users size={14} aria-hidden="true" /> Achat groupé
          </p>
          <h2 id="gb-offer-title" className="mt-1 text-base font-bold leading-snug text-foreground">
            Jusqu’à -{Math.round(offer.best_saving_percent)} % en achetant à plusieurs
          </h2>
          <p className="mt-0.5 text-xs text-foreground/70">
            Rejoignez ou lancez un groupe : le prix baisse pour tous à chaque palier. Rien à payer avant la clôture.
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[11px] text-foreground/60">jusqu’à</p>
          <p className="text-lg font-extrabold text-primary">{formatCentimes(offer.best_unit_price)}</p>
        </div>
      </div>

      <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Paliers du groupe">
        {tiers.map((tier) => (
          <li key={tier.min_qty} className="min-w-[88px] flex-1 rounded-xl border border-primary/15 bg-white px-2 py-1.5 text-center">
            <p className="text-[11px] font-semibold text-foreground/70">Dès {tier.min_qty}</p>
            <p className="text-sm font-bold text-foreground">{formatCentimes(tier.unit_price)}</p>
          </li>
        ))}
      </ol>

      {offer.open_groups.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">
            {offer.open_groups.length === 1 ? "Un groupe est ouvert" : `${offer.open_groups.length} groupes sont ouverts`} sur ce produit
          </p>
          <ul className="space-y-2">
            {offer.open_groups.map((group) => (
              <li key={group.code}>
                <Link
                  href={`/groupe/${group.code}`}
                  className="flex items-center gap-3 rounded-xl border border-border-light bg-white p-2.5 transition-colors hover:border-primary/40"
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary" aria-hidden="true">
                    <Users size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {group.members_count} membre{group.members_count > 1 ? "s" : ""} · {formatCentimes(group.current_unit_price)}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-foreground/60">
                      <span className="inline-flex items-center gap-1 text-primary-700">
                        <TrendingDown size={12} aria-hidden="true" /> {nextStepLabel(group)}
                      </span>
                      <GroupBuyCountdown target={group.closes_at} offset={offset} className="text-xs" />
                    </span>
                  </span>
                  <span className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-bold text-primary">
                    Rejoindre <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="secondary" fullWidth pill className="mt-3" onClick={() => setLaunching(true)}>
        <Users size={16} aria-hidden="true" />
        {offer.open_groups.length > 0 ? "Lancer mon propre groupe" : "Lancer un groupe"}
      </Button>

      {launching && (
        <LaunchGroupDialog
          open={launching}
          onClose={() => setLaunching(false)}
          offer={offer}
          productId={productId}
          variantId={variantId}
        />
      )}
    </section>
  );
}
