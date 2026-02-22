import { Tabs } from "@/components/ui";
import type { Product } from "@/features/product";

interface ProductTabsProps {
  product: Product;
}

/**
 * Product detail tabs — Description, Specifications, Reviews.
 * Uses the shared Tabs component (client) but wraps it with server-rendered content.
 */
function ProductDetailTabs({ product }: ProductTabsProps) {
  const tabs = [
    {
      id: "description",
      label: "Description",
      content: (
        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
          <p>{product.description}</p>
        </div>
      ),
    },
    {
      id: "specifications",
      label: "Caractéristiques",
      content: product.specifications ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(product.specifications).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-border-light pb-2 text-sm"
            >
              <span className="font-medium text-muted-foreground">{key}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune caractéristique disponible.</p>
      ),
    },
    {
      id: "reviews",
      label: `Avis (${product.reviewCount})`,
      content: (
        <div className="space-y-4">
          {/* Mock reviews */}
          {[
            {
              author: "Aminata K.",
              date: "15 fév. 2026",
              rating: 5,
              comment: "Excellentes fraises, très fraîches et bien sucrées. Je recommande vivement !",
            },
            {
              author: "Ibrahim D.",
              date: "10 fév. 2026",
              rating: 4,
              comment: "Bon produit dans l'ensemble. La livraison était rapide. Quelques fraises un peu écrasées.",
            },
            {
              author: "Fatou S.",
              date: "5 fév. 2026",
              rating: 5,
              comment: "Parfait pour les smoothies ! Bio et sans pesticides, j'en rachèterai.",
            },
          ].map((review, idx) => (
            <article
              key={idx}
              className="rounded-xl border border-border-light p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.author}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${i < review.rating ? "text-amber-400" : "text-gray-200"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            </article>
          ))}
        </div>
      ),
    },
  ];

  return <Tabs tabs={tabs} defaultTab="description" />;
}

export { ProductDetailTabs };
