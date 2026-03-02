"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, LayoutGrid, List, PackageSearch, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui";
import type { ProductListItem } from "@/features/product";
import type { Store } from "../models/store";
import { buildStoreListingUrl } from "../utils/queryState";
import { fetchVendorPage } from "../api/store.api";
import { mapVendorProductToListItem } from "../api/store.mappers";

// ─── Sort Options ────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "popular", label: "Populaires" },
  { value: "newest", label: "Nouveautés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "top_rated", label: "Meilleures notes" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─── Types ───────────────────────────────────────────────────

interface StorePageClientProps {
  store: Store;
  storeSlug: string;
  initialProducts: ProductListItem[];
  totalProducts: number;
  hasMore: boolean;
  nextCursor: string | null;
  initialSort: SortValue;
  initialSearch: string;
  initialView: "grid" | "list";
}

// ─── Component ───────────────────────────────────────────────

export default function StorePageClient({
  store,
  storeSlug,
  initialProducts,
  totalProducts,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
  initialSort,
  initialSearch,
  initialView,
}: StorePageClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── State ────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortValue, setSortValue] = useState<SortValue>(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialView);

  // ─── Cursor pagination ("Load more") ──────────────────────
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(totalProducts);

  // ─── Client-side category filter ──────────────────────────
  // The BFF doesn't support category filtering, so we do it client-side
  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter(
          (p) =>
            p.categoryName.toLowerCase() === activeCategory.toLowerCase(),
        );

  // ─── Navigate with URL state (triggers RSC re-render) ─────

  const navigateWithState = useCallback(
    (overrides: { sort?: SortValue; q?: string; view?: "grid" | "list" }) => {
      const url = buildStoreListingUrl(storeSlug, {
        sort: overrides.sort ?? sortValue,
        q: overrides.q ?? searchQuery,
        view: overrides.view ?? viewMode,
        cursor: null, // Reset cursor on filter/sort change
      });

      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [storeSlug, sortValue, searchQuery, viewMode, router],
  );

  // ─── Handlers ────────────────────────────────────────────────

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveCategory(slug);
  }, []);

  const handleSortChange = useCallback(
    (value: SortValue) => {
      setSortValue(value);
      setShowSortDropdown(false);
      navigateWithState({ sort: value });
    },
    [navigateWithState],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      // Debounce 300ms
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        navigateWithState({ q: value });
      }, 300);
    },
    [navigateWithState],
  );

  const handleViewChange = useCallback(
    (mode: "grid" | "list") => {
      setViewMode(mode);
      navigateWithState({ view: mode });
    },
    [navigateWithState],
  );

  // ─── Load More (cursor pagination) ───────────────────────

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const { data } = await fetchVendorPage({
        slug: storeSlug,
        limit: 20,
        sort: sortValue,
        q: searchQuery || undefined,
        cursor: nextCursor,
      });

      const newProducts = data.products.items.map((p) =>
        mapVendorProductToListItem(p, store.name),
      );

      setProducts((prev) => [...prev, ...newProducts]);
      setHasMore(data.products.meta.has_more);
      setNextCursor(data.products.meta.next_cursor);
      setDisplayTotal(data.products.meta.total);
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoadingMore, storeSlug, sortValue, searchQuery, store.name]);

  return (
    <div>
      {/* ─── Header Row: count + sort + view + search ────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {displayTotal.toLocaleString("fr-FR")} produits
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
              aria-expanded={showSortDropdown}
              aria-haspopup="listbox"
            >
              Trier:{" "}
              <span className="text-primary">
                {SORT_OPTIONS.find((o) => o.value === sortValue)?.label}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  showSortDropdown && "rotate-180",
                )}
              />
            </button>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border-light bg-white p-1.5 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                        sortValue === option.value
                          ? "bg-primary-50 font-medium text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="hidden items-center gap-1 rounded-lg border border-border p-0.5 sm:flex">
            <button
              onClick={() => handleViewChange("grid")}
              className={cn(
                "rounded-md p-1.5 transition-all duration-200",
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Vue grille"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={cn(
                "rounded-md p-1.5 transition-all duration-200",
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Vue liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Category Tabs + Search ──────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 shadow-sm",
              activeCategory === "all"
                ? "bg-primary text-white hover:bg-primary-dark"
                : "border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            Tous
          </button>
          {store.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 shadow-sm",
                activeCategory === cat.slug
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Rechercher dans la boutique..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* ─── Product Grid ───────────────────────────────────── */}
      {filteredProducts.length > 0 ? (
        <>
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
                : "flex flex-col gap-4",
            )}
          >
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                className="animate-fade-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  showSaleBadge
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {/* Load More — cursor pagination */}
          {hasMore && activeCategory === "all" && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Chargement…
                  </>
                ) : (
                  "Charger plus de produits"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyStoreState storeName={store.name} />
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyStoreState({ storeName }: { storeName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
        <PackageSearch size={40} className="text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">
        Aucun produit trouvé
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Aucun produit ne correspond à vos critères dans la boutique &quot;
        <span className="font-medium text-foreground">{storeName}</span>
        &quot;. Essayez de modifier vos filtres.
      </p>
    </div>
  );
}
