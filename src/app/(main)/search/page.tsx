import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import {
  fetchSearchResults,
  getStaticPriceRanges,
  parseSearchParams,
} from "@/features/search";
import type { SearchResultData } from "@/features/search";
import SearchPageClient from "./SearchPageClient";

/**
 * /search page — SSR Server Component.
 *
 * 1. Reads all filters/sort/page from URL query params (deep-linkable, SEO-stable).
 * 2. Fetches results server-side for initial render (indexable page 1).
 * 3. Passes everything to SearchPageClient for interactivity.
 *
 * Typesense: transparent. The backend decides engine based on SCOUT_DRIVER.
 */

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  return createMetadata({
    title: q ? `Résultats pour "${q}"` : "Recherche",
    description: q
      ? `Trouvez ${q} parmi des milliers de produits sur Sugu. Prix, avis et livraison rapide.`
      : "Recherchez parmi des milliers de produits sur Sugu. Fruits, légumes, électronique, vêtements et plus encore.",
    path: "/search",
    noIndex: !q, // Don't index empty search page
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const state = parseSearchParams(rawParams);

  // SSR fetch — parallel where possible
  let searchData: SearchResultData;
  try {
    searchData = await fetchSearchResults(state);
  } catch (error) {
    console.error("[Search] SSR fetch failed:", (error as Error).message);
    // Graceful degradation — show empty state
    searchData = {
      products: [],
      pagination: { currentPage: 1, lastPage: 1, perPage: 24, total: 0 },
      filtersApplied: {},
      categoryFacets: [],
    };
  }

  const priceRanges = getStaticPriceRanges();
  const query = state.q;

  return (
    <Container as="section" className="py-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Recherche", href: "/search" },
          ...(query ? [{ label: query }] : []),
        ]}
        className="mb-4"
      />

      {/* Page Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {query ? (
            <>
              Résultats pour{" "}
              <span className="text-primary">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Découvrir les produits"
          )}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {searchData.pagination.total} produit
          {searchData.pagination.total !== 1 ? "s" : ""} trouvé
          {searchData.pagination.total !== 1 ? "s" : ""} sur Sugu
        </p>
      </div>

      {/* Client-side interactive search UI */}
      <SearchPageClient
        initialState={state}
        initialProducts={searchData.products}
        initialPagination={searchData.pagination}
        initialCategoryFacets={searchData.categoryFacets}
        priceRanges={priceRanges}
      />
    </Container>
  );
}
