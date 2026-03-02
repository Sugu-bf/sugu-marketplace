/**
 * MarketplaceHeader — Server Component wrapper for the global header.
 *
 * Responsibilities:
 * - Fetch public data server-side (categories, popular searches)
 * - Pass pre-fetched data to the client-side interactive shell
 * - SSR-friendly: no "use client", no hooks, no browser APIs
 *
 * Data fetching strategy:
 * - Categories tree: ISR-cached (revalidate: 600s), tagged ["categories", "header"]
 * - Popular searches: derived from categories (no dedicated endpoint yet)
 * - Wishlist/Cart: lazy-fetched client-side on dropdown open (user-specific)
 */

import { fetchCategoriesTree, derivePopularSearches } from "../api/header.api";
import MarketplaceHeaderClient from "./MarketplaceHeaderClient";

export default async function MarketplaceHeader() {
  // Fetch public data server-side with ISR caching
  const categories = await fetchCategoriesTree();
  const popularSearches = derivePopularSearches(categories);

  return (
    <MarketplaceHeaderClient
      categories={categories}
      popularSearches={popularSearches}
    />
  );
}
