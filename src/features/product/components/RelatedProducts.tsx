import { SectionHeader, ProductCard, ViewAllButton } from "@/components/ui";
import type { ProductListItem } from "@/features/product";

interface RelatedProductsProps {
  products: ProductListItem[];
  className?: string;
}

/**
 * Related products section — horizontal scrollable product cards.
 * Server Component — purely presentational.
 *
 * NOTE: ProductCard is itself a <Link>. Do NOT wrap it in another <Link>,
 * as that would create invalid nested <a> tags and cause a hydration error.
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
          // ProductCard contains its own <Link> — no outer Link wrapper needed
          <div key={product.id} className="flex-shrink-0">
            <ProductCard product={product} showSaleBadge />
          </div>
        ))}
      </div>
    </section>
  );
}

export { RelatedProducts };
