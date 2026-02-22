import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import { Star } from "lucide-react";
import type { BulkPriceTier } from "@/features/product";

interface BulkPriceTableProps {
  tiers: BulkPriceTier[];
  basePrice: number;
  className?: string;
}

/**
 * Bulk pricing table — shows volume discount tiers.
 * Server Component — purely presentational.
 */
function BulkPriceTable({ tiers, basePrice, className }: BulkPriceTableProps) {
  if (!tiers.length) return null;

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <div className="bg-muted px-4 py-2.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          📦 Remises sur volume
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Quantité</th>
            <th className="px-4 py-2 font-medium">Prix unitaire</th>
            <th className="px-4 py-2 font-medium text-right">Économie</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, idx) => {
            const savingsPercent = basePrice > 0
              ? Math.round(((basePrice - tier.unitPrice) / basePrice) * 100)
              : 0;
            const isLastTier = idx === tiers.length - 1;
            const isBestDeal = isLastTier && tiers.length > 1;

            return (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border last:border-b-0 transition-colors",
                  isBestDeal
                    ? "bg-green-50/70"
                    : savingsPercent > 0
                    ? "bg-green-50/30"
                    : "bg-background"
                )}
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {tier.label}
                </td>
                <td className="px-4 py-2.5 font-semibold text-foreground">
                  {formatPrice(tier.unitPrice)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {savingsPercent > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-green-600 font-semibold">-{savingsPercent}%</span>
                      {isBestDeal && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <Star size={8} className="fill-green-600 text-green-600" />
                          Meilleur prix
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { BulkPriceTable };
