import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import {
  querySearchResults,
  queryRelatedSearches,
  queryPriceRanges,
  queryFilterCategories,
  querySearchResultsCount,
} from "@/features/search";
import SearchPageClient from "./SearchPageClient";

export const metadata = createMetadata({
  title: "Recherche",
  description:
    "Recherchez parmi des milliers de produits sur Sugu. Fruits, légumes, électronique, vêtements et plus encore.",
  path: "/search",
});

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q : "Fruits";

  // Fetch all data via queries (SSR)
  const [products, relatedSearches, priceRanges, filterCategories, totalResults] =
    await Promise.all([
      querySearchResults(query),
      queryRelatedSearches(query),
      queryPriceRanges(),
      queryFilterCategories(),
      querySearchResultsCount(query),
    ]);

  return (
    <Container as="section" className="py-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Recherche", href: "/search" },
          { label: query },
        ]}
        className="mb-4"
      />

      {/* Page Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Résultats pour{" "}
          <span className="text-primary">&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {totalResults} produit{totalResults !== 1 ? "s" : ""} trouvé
          {totalResults !== 1 ? "s" : ""} sur Sugu
        </p>
      </div>

      {/* Client-side interactive search UI */}
      <SearchPageClient
        query={query}
        products={products}
        relatedSearches={relatedSearches}
        priceRanges={priceRanges}
        filterCategories={filterCategories}
        totalResults={totalResults}
      />
    </Container>
  );
}
