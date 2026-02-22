import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/features/product";
import { formatPrice } from "@/lib/constants";

interface ProductCardProps {
  product: ProductListItem;
  /** Show SALE badge on hover */
  showSaleBadge?: boolean;
  className?: string;
}

/**
 * Reusable product card — used in BestSeller, Trending Stores, and Order Now sections.
 * Server Component by default. Wrap in a client component if onClick needed.
 */
function ProductCard({ product, showSaleBadge, className }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      className={cn(
        "group flex-shrink-0 w-[200px] sm:w-[220px] cursor-pointer",
        className
      )}
    >
      {/* Product Image */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/10">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          sizes="220px"
        />
        {/* Sale badge (hover reveal) */}
        {showSaleBadge && hasDiscount && (
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            SALE
          </div>
        )}
        {/* Quick add button */}
        <button
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-90"
          aria-label={`Ajouter ${product.name} au panier`}
        >
          +
        </button>
      </div>

      {/* Product Info */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-1">
          {product.name}
        </h3>
        {product.vendorName && (
          <p className="text-xs text-muted-foreground">{product.vendorName}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {product.stock > 0 && (
            <span className="text-error font-medium">
              {product.stock} restant{product.stock > 1 ? "s" : ""}
            </span>
          )}
          {product.sold > 0 && (
            <span className="text-muted-foreground">
              {product.sold} vendu{product.sold > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { ProductCard };
