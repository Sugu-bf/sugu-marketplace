import Link from "next/link";
import { Star, ArrowRight, MapPin } from "lucide-react";
import type { StoreListItem } from "../models/store";
import { getCategoryIcon } from "../utils/categoryIcons";

interface FeaturedStoreCardProps {
  store: StoreListItem;
}

/**
 * Darken a hex colour by a percentage (0–1 range).
 */
function darkenHex(hex: string, amount = 0.25): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 255 * amount);
  const g = Math.max(0, ((n >> 8) & 255) - 255 * amount);
  const b = Math.max(0, (n & 255) - 255 * amount);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * Featured store card with gradient cover, shown in horizontal scroll.
 * Server component.
 */
export default function FeaturedStoreCard({ store }: FeaturedStoreCardProps) {
  const darkColor = darkenHex(store.logoColor, 0.3);

  return (
    <div className="flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl border border-border-light bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md group">
      {/* Cover gradient */}
      <div
        className="relative h-[80px] w-full"
        style={{
          background: `linear-gradient(135deg, ${store.logoColor}, ${darkColor})`,
        }}
      >
        {/* Vedette badge */}
        <span className="absolute top-2 right-2 rounded-full bg-primary text-white px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-0.5">
          <Star size={10} className="fill-white" />
          Vedette
        </span>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center px-4 pb-4">
        <div
          className="-mt-7 h-[56px] w-[56px] rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-base"
          style={{ backgroundColor: store.logoColor }}
        >
          {store.logoInitials}
        </div>

        {/* Name */}
        <Link
          href={`/store/${store.slug}`}
          className="text-sm font-bold text-foreground text-center mt-2 hover:text-primary transition-colors line-clamp-1"
        >
          {store.name}
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{store.location}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-1.5">
          <span className="font-semibold text-foreground">
            ⭐ {store.rating.toFixed(1)}
          </span>
          <span>{store.totalProducts.toLocaleString("fr-FR")} produits</span>
          <span>{store.totalSales.toLocaleString("fr-FR")} ventes</span>
        </div>

        {/* Category pills with Lucide icons */}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {store.categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <span
                key={cat.name}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Icon size={10} strokeWidth={1.5} className="flex-shrink-0" />
                {cat.name}
              </span>
            );
          })}
        </div>

        {/* Visit link */}
        <Link
          href={`/store/${store.slug}`}
          className="mt-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Visiter la boutique
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
