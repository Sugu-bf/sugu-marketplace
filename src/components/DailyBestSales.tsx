import Image from "next/image";
import { Star, ShoppingCart, ArrowRight, Camera, ShoppingBag } from "lucide-react";
import { Container, SectionHeader } from "@/components/ui";
import type { DailyBestSaleProduct } from "@/features/home";

interface DailyBestSalesProps {
  products: DailyBestSaleProduct[];
}

function formatDailyPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("fr-FR");
  }
  return price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProductCard({ product, index }: { product: DailyBestSaleProduct; index: number }) {
  const soldPercent = (product.soldCount / product.totalStock) * 100;

  return (
    <div
      className="group flex items-stretch gap-0 rounded-2xl border border-border-light bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${200 + index * 80}ms both`,
      }}
    >
      {/* Product Image */}
      <div className="relative w-[130px] flex-shrink-0 bg-muted flex items-center justify-center">
        {product.promoPercent && (
          <span className="absolute top-2 left-2 z-10 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            Promo {product.promoPercent}%
          </span>
        )}
        <Camera size={32} className="text-border" />
      </div>

      {/* Product Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs text-muted-foreground line-through">
            {formatDailyPrice(product.originalPrice)} F
          </span>
          <span className="text-sm font-bold text-primary">
            {formatDailyPrice(product.price)} F
          </span>
          <span className="text-[10px] text-muted-foreground">/Qty</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span>
          <Star size={10} className="text-accent fill-accent" />
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-foreground truncate mb-1.5 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </p>

        {/* Store */}
        <div className="flex items-center gap-1 mb-1.5">
          <ShoppingBag size={11} className="text-primary" />
          <span className="text-[11px] text-muted-foreground">Par {product.store}</span>
        </div>

        {/* Sold progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">
              Vendus : {product.soldCount}/{product.totalStock}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${soldPercent}%` }}
            />
          </div>
        </div>

        {/* Add to cart */}
        <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors duration-200">
          Ajouter au panier
          <ShoppingCart size={12} />
        </button>
      </div>
    </div>
  );
}

export default function DailyBestSales({ products }: DailyBestSalesProps) {
  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* Title */}
      <SectionHeader title="Meilleures Ventes du Jour" />

      {/* Grid: product cards + promo card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_280px] gap-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}

        {/* Promo card */}
        <div
          className="rounded-2xl overflow-hidden relative lg:row-span-2 lg:-order-1 order-last flex flex-col"
          style={{
            background: "linear-gradient(180deg, #FFF8F0 0%, #FEF3E8 100%)",
            gridRow: "1 / 3",
            gridColumn: "-2 / -1",
            animation: "fadeSlideUp 0.5s ease-out 300ms both",
          }}
        >
          <div className="p-5 flex-1 flex flex-col">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag size={20} className="text-primary" />
            </div>

            {/* Text */}
            <p className="text-base font-bold text-foreground leading-snug mb-2">
              5 000 F de réduction sur votre première commande
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Livraison avant 6h15
            </p>

            {/* CTA */}
            <button className="group flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-95 w-fit">
              Acheter maintenant
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Grocery Image */}
          <div className="relative w-full h-[180px] mt-auto">
            <Image
              src="/promos/grocery-bag.png"
              alt="Promotion panier de courses"
              fill
              className="object-cover object-top"
              sizes="280px"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
