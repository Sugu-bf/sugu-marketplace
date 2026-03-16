"use client";

import type { RecommendedProduct } from "../api";
import { formatPrice } from "@/lib/constants";
import { safeSrc } from "../security";

interface ProductListItemProps {
  product: RecommendedProduct;
}

/**
 * ProductListItem — single item in the recommended products list.
 */
export function ProductListItem({ product }: ProductListItemProps) {
  return (
    <a
      href={`/product/${product.slug}`}
      className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50 transition-colors duration-150 group"
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border-light">
        {product.thumbnail ? (
          <img
            src={safeSrc(product.thumbnail)}
            alt={product.name}
            className="w-full h-full object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-[10px]">
            N/A
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.compare_price &&
            product.compare_price > product.price && (
              <span className="text-[10px] line-through text-primary">
                {formatPrice(product.compare_price)}
              </span>
            )}
        </div>
      </div>
    </a>
  );
}
