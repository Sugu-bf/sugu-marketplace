import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { SupplierListItem } from "../models/supplier";
import { getSectorIcon } from "../utils/sectorIcons";

interface SupplierCardProps {
  supplier: SupplierListItem;
  className?: string;
}

/**
 * Supplier card for the "Tous les fournisseurs" grid.
 * Server component — no interaction needed.
 */
export default function SupplierCard({ supplier, className }: SupplierCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border-light bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 ${className ?? ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Logo circle */}
        <div
          className="flex-shrink-0 h-[60px] w-[60px] sm:h-[70px] sm:w-[70px] rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-md"
          style={{ backgroundColor: supplier.logoColor }}
        >
          {supplier.logoInitials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/store/${supplier.slug}`}
            className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {supplier.name}
          </Link>

          {/* Tagline */}
          {supplier.tagline && (
            <p className="italic text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {supplier.tagline}
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">
              {supplier.countryFlag} {supplier.location}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-0.5">
            Grossiste depuis {supplier.memberSince}
          </p>

          {/* Sector pills with Lucide icons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {supplier.sectors.map((sec) => {
              const Icon = getSectorIcon(sec.icon);
              return (
                <span
                  key={sec.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  <Icon size={11} strokeWidth={1.5} className="flex-shrink-0" />
                  {sec.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right stats column */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="text-right">
            <span className="text-sm font-bold text-foreground">
              {supplier.rating.toFixed(1)}
            </span>{" "}
            <span className="text-[11px] text-muted-foreground">
              ({supplier.reviewCount} avis)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {supplier.totalProducts.toLocaleString("fr-FR")} produits
          </p>
          <p className="text-xs text-muted-foreground">
            {supplier.totalSales.toLocaleString("fr-FR")} ventes
          </p>

          {/* Voir button */}
          <Link
            href={`/store/${supplier.slug}`}
            className="mt-1 rounded-full border border-primary text-primary px-3 py-1 text-xs font-semibold hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Voir
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
