import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import { queryCart } from "@/features/cart/queries/cart-queries";
import { queryFeaturedProducts } from "@/features/product";
import { CartOrchestrator } from "@/features/cart/components/CartOrchestrator";
import { CartSuggestions } from "@/features/cart/components/CartSuggestions";

// ─── SEO Metadata ────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Mon Panier",
  description: "Consultez et gérez votre panier d'achat sur Sugu. Livraison rapide et paiement sécurisé.",
  path: "/cart",
  noIndex: true,
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function CartPage() {
  const [cart, suggestedProducts] = await Promise.all([
    queryCart(),
    queryFeaturedProducts(5),
  ]);

  const breadcrumbItems = [{ label: "Mon Panier" }];

  return (
    <main className="pb-12">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <Breadcrumb items={breadcrumbItems} />
      </Container>

      {/* Page Header */}
      <Container className="pb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Mon Panier
          </h1>
          <span className="text-base text-muted-foreground">
            ({cart.totals.itemCount} article{cart.totals.itemCount > 1 ? "s" : ""})
          </span>
        </div>
      </Container>

      {/* Cart Content */}
      <Container>
        <CartOrchestrator initialCart={cart} />
      </Container>

      {/* Suggested Products */}
      <Container className="py-10 mt-8 border-t border-border-light">
        <CartSuggestions products={suggestedProducts} />
      </Container>
    </main>
  );
}
