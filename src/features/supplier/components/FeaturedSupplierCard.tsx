import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { SupplierListItem } from "../models/supplier";
import { getSectorIcon } from "../utils/sectorIcons";

interface FeaturedSupplierCardProps {
  supplier: SupplierListItem;
}

/**
 * Featured supplier card — clean white card, no rating stars.
 */
export default function FeaturedSupplierCard({ supplier }: FeaturedSupplierCardProps) {
  return (
    <div className="flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl border border-border-light bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
      <div className="flex flex-col items-center px-4 pt-5 pb-4">
        <div
          className="h-[56px] w-[56px] rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm"
          style={{ backgroundColor: supplier.logoColor }}
        >
          {supplier.logoInitials}
        </div>

        <span className="mt-3 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-bold">
          Vedette
        </span>

        <Link
          href={`/store/${supplier.slug}`}
          className="text-sm font-bold text-foreground text-center mt-2 hover:text-primary transition-colors line-clamp-1"
        >
          {supplier.name}
        </Link>

        {supplier.tagline && (
          <p className="text-[11px] text-muted-foreground text-center mt-0.5 line-clamp-2">
            {supplier.tagline}
          </p>
        )}

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{supplier.location}</span>
        </div>

        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-2">
          <span>{supplier.totalProducts.toLocaleString("fr-FR")} produits</span>
          <span>{supplier.totalSales.toLocaleString("fr-FR")} ventes</span>
        </div>

        {supplier.sectors.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {supplier.sectors.slice(0, 3).map((sec) => {
              const Icon = getSectorIcon(sec.icon);
              return (
                <span
                  key={sec.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  <Icon size={10} strokeWidth={1.5} className="flex-shrink-0" />
                  {sec.name}
                </span>
              );
            })}
          </div>
        )}

        <Link
          href={`/store/${supplier.slug}`}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:bg-primary-dark"
        >
          Voir le fournisseur
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
