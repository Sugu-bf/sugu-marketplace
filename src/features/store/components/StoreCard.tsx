import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { StoreListItem } from "../models/store";
import { getCategoryIcon } from "../utils/categoryIcons";

interface StoreCardProps {
  store: StoreListItem;
  className?: string;
}

/**
 * Store card for the "Toutes les boutiques" grid.
 * Server component — no interaction needed.
 */
export default function StoreCard({ store, className }: StoreCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border-light bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 ${className ?? ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Logo circle */}
        <div
          className="flex-shrink-0 h-[60px] w-[60px] sm:h-[70px] sm:w-[70px] rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-md"
          style={{ backgroundColor: store.logoColor }}
        >
          {store.logoInitials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/store/${store.slug}`}
            className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {store.name}
          </Link>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{store.location}</span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-0.5">
            Membre depuis {store.memberSince}
          </p>

          {/* Category pills with Lucide icons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {store.categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  <Icon size={11} strokeWidth={1.5} className="flex-shrink-0" />
                  {cat.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right stats column */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="text-right">
            <span className="text-sm font-bold text-foreground">
              {store.rating.toFixed(1)}
            </span>{" "}
            <span className="text-[11px] text-muted-foreground">
              ({store.reviewCount} avis)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {store.totalProducts.toLocaleString("fr-FR")} produits
          </p>
          <p className="text-xs text-muted-foreground">
            {store.totalSales.toLocaleString("fr-FR")} ventes
          </p>

          {/* Visiter button */}
          <Link
            href={`/store/${store.slug}`}
            className="mt-1 rounded-full border border-primary text-primary px-3 py-1 text-xs font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Visiter
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
