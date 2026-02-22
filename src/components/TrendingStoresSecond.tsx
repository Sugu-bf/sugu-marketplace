import { Star, ShoppingCart, Camera } from "lucide-react";
import { Container } from "@/components/ui";
import type { ProductColumnItem, WeeklyDeal } from "@/features/home";

interface TrendingStoresSecondProps {
  produitsVedettes: ProductColumnItem[];
  meilleuresVentes: ProductColumnItem[];
  enPromotion: ProductColumnItem[];
  weeklyDeal: WeeklyDeal;
}

/* ── Small product row used in the first 3 columns ──── */

function ProductRow({ product, index }: { product: ProductColumnItem; index: number }) {
  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-border-light last:border-b-0 cursor-pointer group transition-colors duration-200 hover:bg-muted/60 px-1 -mx-1 rounded-lg"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${300 + index * 60}ms both`,
      }}
    >
      {/* Thumbnail placeholder */}
      <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-muted flex items-center justify-center overflow-hidden">
        <Camera size={18} className="text-border" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-foreground">{product.rating}</span>
          <Star size={11} className="text-primary fill-primary" />
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold text-foreground">{product.price.toLocaleString()} F</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.originalPrice.toLocaleString()} F</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Column card ──────────────────────────────────── */

function ProductColumn({
  title,
  products,
  delay = 0,
}: {
  title: string;
  products: ProductColumnItem[];
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-border-light bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-md"
      style={{
        animation: `fadeSlideUp 0.5s ease-out ${delay}ms both`,
      }}
    >
      {/* Title with orange left border */}
      <h3 className="text-base font-bold text-foreground mb-4 pl-3 border-l-[3px] border-primary">
        {title}
      </h3>

      <div>
        {products.map((product, index) => (
          <ProductRow key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */

export default function TrendingStoresSecond({
  produitsVedettes,
  meilleuresVentes,
  enPromotion,
  weeklyDeal,
}: TrendingStoresSecondProps) {
  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ProductColumn title="Produits Vedettes" products={produitsVedettes} delay={150} />
        <ProductColumn title="Meilleures Ventes" products={meilleuresVentes} delay={250} />
        <ProductColumn title="En Promotion" products={enPromotion} delay={350} />

        {/* Column 4 – Offres de la semaine */}
        <div
          className="rounded-2xl border border-border-light bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-md flex flex-col"
          style={{ animation: "fadeSlideUp 0.5s ease-out 450ms both" }}
        >
          <h3 className="text-lg font-bold text-foreground italic mb-1">
            Offres de la semaine
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Ne manquez pas cette opportunité spéciale
          </p>

          {/* Featured product image placeholder */}
          <div className="relative w-full aspect-square rounded-2xl bg-muted flex items-center justify-center mb-4 overflow-hidden">
            <Camera size={36} className="text-border" />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className="text-accent fill-accent" />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({weeklyDeal.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-primary">{weeklyDeal.price} F</span>
            {weeklyDeal.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{weeklyDeal.originalPrice} F</span>
            )}
          </div>

          {/* Product name */}
          <p className="text-sm font-medium text-foreground mb-3 leading-snug">
            {weeklyDeal.name}
          </p>

          {/* Stock notice */}
          <p className="text-xs text-error font-medium mb-1">
            Ce produit est bientôt en rupture
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            disponible seulement :{" "}
            <span className="font-bold text-foreground">{weeklyDeal.price} F</span>
          </p>

          {/* Add to cart */}
          <button className="mt-auto group flex items-center justify-center gap-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]">
            Ajouter au panier
            <ShoppingCart size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </Container>
  );
}
