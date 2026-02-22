import Link from "next/link";
import { Badge, StarRating } from "@/components/ui";
import { Store, CheckCircle } from "lucide-react";
import type { Product } from "@/features/product";

interface ProductInfoProps {
  product: Product;
}

/**
 * Product info header — badges, title, rating, and vendor.
 * Server Component — purely presentational.
 */
function ProductInfo({ product }: ProductInfoProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const inStock = product.stock > 0;

  return (
    <div className="space-y-3">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {product.tags.includes("bio") && (
          <Badge variant="success" size="sm" pill>
            🌿 Bio
          </Badge>
        )}
        {hasDiscount && product.discount && (
          <Badge variant="primary" size="sm" pill>
            -{product.discount}%
          </Badge>
        )}
        {product.promoPrice && (
          <Badge variant="danger" size="sm" pill>
            Promo
          </Badge>
        )}
        {inStock ? (
          <Badge variant="success" size="xs" pill className="gap-1">
            <CheckCircle size={10} />
            En stock
          </Badge>
        ) : (
          <Badge variant="danger" size="xs" pill>
            Rupture
          </Badge>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      <StarRating
        rating={product.rating}
        showValue
        reviewCount={product.reviewCount}
        size="md"
      />

      {/* Vendor */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Vendu par{" "}
          <span className="font-semibold text-foreground">{product.vendorName}</span>
        </span>
        {product.vendorSlug && (
          <Link
            href={`/store/${product.vendorSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary"
          >
            <Store size={12} />
            Visiter la Boutique
          </Link>
        )}
      </div>
    </div>
  );
}

export { ProductInfo };
