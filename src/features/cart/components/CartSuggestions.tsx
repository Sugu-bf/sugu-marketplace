import { SectionHeader, ProductCard, ViewAllButton } from "@/components/ui";
import type { ProductListItem } from "@/features/product";

interface CartSuggestionsProps {
  products: ProductListItem[];
}

/**
 * "Vous aimerez aussi" — suggested products section below the cart.
 * Server Component — purely presentational.
 *
 * Note: ProductCard already contains its own <Link>, so we must NOT
 * wrap it in another <Link> — nested <a> tags are invalid HTML.
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
          <div key={product.id} className="flex-shrink-0">
            <ProductCard product={product} showSaleBadge />
          </div>
        ))}
      </div>
    </section>
  );
}

export { CartSuggestions };
