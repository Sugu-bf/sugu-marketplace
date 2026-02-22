import Link from "next/link";
import { SectionHeader, ProductCard, ViewAllButton } from "@/components/ui";
import type { ProductListItem } from "@/features/product";

interface CartSuggestionsProps {
  products: ProductListItem[];
}

/**
 * "Vous aimerez aussi" — suggested products section below the cart.
 * Server Component — purely presentational.
 */
function CartSuggestions({ products }: CartSuggestionsProps) {
  if (!products.length) return null;

  return (
    <section aria-labelledby="cart-suggestions-heading">
      <SectionHeader
        title="Vous aimerez aussi"
        action={<ViewAllButton href="/search" label="Voir tout" />}
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

export { CartSuggestions };
