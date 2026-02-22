import Link from "next/link";
import { SectionHeader, ProductCard, ViewAllButton } from "@/components/ui";
import type { ProductListItem } from "@/features/product";

interface RelatedProductsProps {
  products: ProductListItem[];
  className?: string;
}

/**
 * Related products section — horizontal scrollable product cards.
 * Server Component — purely presentational.
 */
function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className={className} aria-labelledby="related-products-heading">
      <SectionHeader
        title="Produits Similaires"
        action={
          <ViewAllButton href="/search" label="Voir tout" />
        }
      />

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="flex-shrink-0"
          >
            <ProductCard product={product} showSaleBadge />
          </Link>
        ))}
      </div>
    </section>
  );
}

export { RelatedProducts };
