"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  Star,
  Search,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import { ProductCard, Pagination, Badge } from "@/components/ui";
import type {
  SearchQueryState,
  SortValue,
  ViewMode,
  SearchProductItem,
  FilterCategoryFacet,
} from "@/features/search";
import {
  SORT_VALUES,
  serializeSearchState,
  DEFAULT_SEARCH_STATE,
} from "@/features/search";
import type { PriceRange } from "@/features/search";

// ─── Sort Options (label map) ────────────────────────────────

const SORT_LABELS: Record<SortValue, string> = {
  relevance: "Pertinence",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
  newest: "Nouveautés",
  popular: "Meilleures ventes",
};

// ─── Types ───────────────────────────────────────────────────

interface SearchPageClientProps {
  initialState: SearchQueryState;
  initialProducts: SearchProductItem[];
  initialPagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  initialCategoryFacets: FilterCategoryFacet[];
  priceRanges: PriceRange[];
}

// ─── Debounce helper ─────────────────────────────────────────

function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: unknown[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
}

// ─── Component ───────────────────────────────────────────────

export default function SearchPageClient({
  initialState,
  initialProducts,
  initialPagination,
  initialCategoryFacets,
  priceRanges,
}: SearchPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ─── Local UI state ──────────────────────────────────────
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Navigation lock to avoid rapid-fire pushes
  const isNavigatingRef = useRef(false);

  // We read everything from initialState (SSR), so state is URL-driven.
  // The client interacts by navigating to new URLs.

  const query = initialState.q;
  const sortBy = initialState.sort;
  const viewMode = initialState.view;
  const currentPage = initialState.page;
  const selectedCategories = initialState.categories;
  const selectedPriceMin = initialState.price_min;
  const selectedPriceMax = initialState.price_max;
  const minRating = initialState.rating_min;
  const inStockOnly = initialState.in_stock;

  const products = initialProducts;
  const totalResults = initialPagination.total;
  const totalPages = initialPagination.lastPage;
  const filterCategories = initialCategoryFacets;

  // Determine which price range index is selected
  const selectedPriceRange = useMemo(() => {
    if (selectedPriceMin === null && selectedPriceMax === null) return null;
    return priceRanges.findIndex(
      (r) => r.min === selectedPriceMin && r.max === selectedPriceMax
    );
  }, [selectedPriceMin, selectedPriceMax, priceRanges]);

  // Active filter count
  const activeFilterCount =
    selectedCategories.length +
    (selectedPriceRange !== null && selectedPriceRange >= 0 ? 1 : 0) +
    (minRating !== null ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // ─── Navigation (URL update) ──────────────────────────────

  const navigateWithState = useCallback(
    (partial: Partial<SearchQueryState>) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const newState: SearchQueryState = {
        q: partial.q ?? query,
        categories: partial.categories ?? selectedCategories,
        price_min: partial.price_min !== undefined ? partial.price_min : selectedPriceMin,
        price_max: partial.price_max !== undefined ? partial.price_max : selectedPriceMax,
        rating_min: partial.rating_min !== undefined ? partial.rating_min : minRating,
        in_stock: partial.in_stock !== undefined ? partial.in_stock : inStockOnly,
        sort: partial.sort ?? sortBy,
        view: partial.view ?? viewMode,
        page: partial.page ?? 1, // Reset to page 1 on filter changes
      };

      const params = serializeSearchState(newState);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;

      router.push(url, { scroll: false });

      // Release lock after a tick
      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [
      query, selectedCategories, selectedPriceMin, selectedPriceMax,
      minRating, inStockOnly, sortBy, viewMode, pathname, router,
    ]
  );

  const debouncedNavigate = useDebouncedCallback(
    navigateWithState as (...args: unknown[]) => void,
    300
  );

  // ─── Filter handlers ──────────────────────────────────────

  const toggleCategory = useCallback(
    (slug: string) => {
      const updated = selectedCategories.includes(slug)
        ? selectedCategories.filter((c) => c !== slug)
        : [...selectedCategories, slug];
      navigateWithState({ categories: updated, page: 1 });
    },
    [selectedCategories, navigateWithState]
  );

  const selectPriceRange = useCallback(
    (idx: number | null) => {
      if (idx === null || idx < 0 || idx >= priceRanges.length) {
        navigateWithState({ price_min: null, price_max: null, page: 1 });
      } else {
        const range = priceRanges[idx];
        navigateWithState({ price_min: range.min, price_max: range.max, page: 1 });
      }
    },
    [priceRanges, navigateWithState]
  );

  const selectRating = useCallback(
    (rating: number | null) => {
      navigateWithState({ rating_min: rating, page: 1 });
    },
    [navigateWithState]
  );

  const toggleInStock = useCallback(() => {
    navigateWithState({ in_stock: !inStockOnly, page: 1 });
  }, [inStockOnly, navigateWithState]);

  const changeSortBy = useCallback(
    (value: SortValue) => {
      setShowSortDropdown(false);
      navigateWithState({ sort: value, page: 1 });
    },
    [navigateWithState]
  );

  const changeViewMode = useCallback(
    (mode: ViewMode) => {
      navigateWithState({ view: mode, page: currentPage });
    },
    [navigateWithState, currentPage]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      navigateWithState({ page });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigateWithState]
  );

  const clearAllFilters = useCallback(() => {
    navigateWithState({
      categories: [],
      price_min: null,
      price_max: null,
      rating_min: null,
      in_stock: false,
      page: 1,
    });
  }, [navigateWithState]);

  // ─── Suggestions (top categories or related) ──────────────

  const suggestions = useMemo(() => {
    const terms = [
      "Fruits frais",
      "Légumes bio",
      "Épicerie",
      "Boissons",
      "Viande & Poisson",
      "Produits laitiers",
    ];
    // If we have category facets, use them instead
    if (filterCategories.length > 0) {
      return filterCategories.slice(0, 6).map((c) => ({
        label: c.name,
        query: c.name,
      }));
    }
    return terms.map((t) => ({ label: t, query: t }));
  }, [filterCategories]);

  // ─── Filter Sidebar Content ─────────────────────────────────

  const FilterContent = (
    <div className="space-y-6">
      {/* Categories */}
      {filterCategories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
            Catégories
          </h3>
          <div className="space-y-2">
            {filterCategories.map((cat) => (
              <label
                key={cat.slug}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-primary-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                />
                <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">({cat.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
          Prix
        </h3>
        <div className="space-y-2">
          {priceRanges.map((range, idx) => (
            <label
              key={idx}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-primary-50"
            >
              <input
                type="radio"
                name="priceRange"
                checked={selectedPriceRange === idx}
                onChange={() => {
                  selectPriceRange(selectedPriceRange === idx ? null : idx);
                }}
                className="h-4 w-4 border-border text-primary accent-primary focus:ring-primary/30"
              />
              <span className="text-sm text-foreground">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
          Note minimale
        </h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                selectRating(minRating === rating ? null : rating);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200",
                minRating === rating
                  ? "bg-primary-50 text-primary font-medium"
                  : "text-foreground hover:bg-primary-50"
              )}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={cn(
                      i < rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span>& plus</span>
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-primary-50">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={toggleInStock}
            className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
          />
          <span className="text-sm font-medium text-foreground">
            En stock uniquement
          </span>
        </label>
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
        >
          Effacer les filtres ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* ─── Suggestion Chips ─────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {suggestions.map((rs) => (
          <a
            key={rs.query}
            href={`/search?q=${encodeURIComponent(rs.query)}`}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
          >
            <Search size={12} />
            {rs.label}
          </a>
        ))}
      </div>

      {/* ─── Sort Bar ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-light bg-background p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary lg:hidden"
            aria-label="Ouvrir les filtres"
          >
            <SlidersHorizontal size={16} />
            Filtres
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="xs" pill>
                {activeFilterCount}
              </Badge>
            )}
          </button>

          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {totalResults}
            </span>{" "}
            résultat{totalResults !== 1 ? "s" : ""}{" "}
            {query && (
              <span className="hidden sm:inline">
                pour &quot;<span className="font-medium text-primary">{query}</span>
                &quot;
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
              aria-expanded={showSortDropdown}
              aria-haspopup="listbox"
            >
              Trier par :{" "}
              <span className="text-primary">
                {SORT_LABELS[sortBy]}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-200",
                  showSortDropdown && "rotate-180"
                )}
              />
            </button>
            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-border-light bg-background p-1.5 shadow-lg animate-fade-slide-down">
                  {SORT_VALUES.map((value) => (
                    <button
                      key={value}
                      onClick={() => changeSortBy(value)}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                        sortBy === value
                          ? "bg-primary-50 font-medium text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {SORT_LABELS[value]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="hidden items-center gap-1 rounded-lg border border-border p-0.5 sm:flex">
            <button
              onClick={() => changeViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-all duration-200",
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vue grille"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => changeViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-all duration-200",
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vue liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Filters Chips ─────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Filtres actifs :
          </span>
          {selectedCategories.map((slug) => {
            const cat = filterCategories.find((c) => c.slug === slug);
            return cat ? (
              <button
                key={slug}
                onClick={() => toggleCategory(slug)}
                className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              >
                {cat.name}
                <X
                  size={12}
                  className="opacity-60 group-hover/chip:opacity-100"
                />
              </button>
            ) : null;
          })}
          {selectedPriceRange !== null && selectedPriceRange >= 0 && (
            <button
              onClick={() => selectPriceRange(null)}
              className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              {priceRanges[selectedPriceRange]?.label}
              <X
                size={12}
                className="opacity-60 group-hover/chip:opacity-100"
              />
            </button>
          )}
          {minRating !== null && (
            <button
              onClick={() => selectRating(null)}
              className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              {minRating}★ & plus
              <X
                size={12}
                className="opacity-60 group-hover/chip:opacity-100"
              />
            </button>
          )}
          {inStockOnly && (
            <button
              onClick={toggleInStock}
              className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              En stock
              <X
                size={12}
                className="opacity-60 group-hover/chip:opacity-100"
              />
            </button>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* ─── Main Grid (Sidebar + Products) ───────────────────── */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-4 rounded-2xl border border-border-light bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" />
                Filtres
              </h2>
              {activeFilterCount > 0 && (
                <Badge variant="primary" size="xs" pill>
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {FilterContent}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {products.length > 0 ? (
            <>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-4"
                )}
              >
                {products.map((product, idx) => (
                  <div
                    key={product.id}
                    className="animate-fade-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {viewMode === "grid" ? (
                      <ProductCard
                        product={product as any}
                        showSaleBadge
                        className="w-full"
                      />
                    ) : (
                      <SearchListItem product={product} />
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptySearchState query={query} />
          )}
        </div>
      </div>

      {/* ─── Mobile Filter Drawer ─────────────────────────────── */}
      {showMobileFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-background p-6 shadow-2xl animate-fade-slide-right">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary" />
                Filtres
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                aria-label="Fermer les filtres"
              >
                <X size={18} />
              </button>
            </div>
            {FilterContent}
            <div className="mt-6">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-primary-dark"
              >
                Voir les résultats ({totalResults})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── List View Item ──────────────────────────────────────────

function SearchListItem({ product }: { product: SearchProductItem }) {
  const hasDiscount =
    product.originalPrice !== null && product.originalPrice > product.price;

  return (
    <a
      href={`/product/${product.slug}`}
      className="group flex gap-4 rounded-2xl border border-border-light bg-background p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20"
    >
      {/* Image */}
      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={product.thumbnail}
          alt={product.name}
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
        />
        {hasDiscount && product.discount && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount}%
          </span>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        {product.highlightName ? (
          <h3
            className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2 [&_mark]:font-bold [&_mark]:text-primary [&_mark]:bg-transparent"
            dangerouslySetInnerHTML={{ __html: product.highlightName }}
          />
        ) : (
          <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {product.name}
          </h3>
        )}
        {product.vendorName && (
          <p className="text-xs text-muted-foreground">{product.vendorName}</p>
        )}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={cn(
                  i < Math.round(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through text-muted-foreground">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-error font-medium">
              Plus que {product.stock} restant{product.stock > 1 ? "s" : ""}
            </span>
          )}
          {product.sold > 0 && (
            <span className="text-muted-foreground">
              {product.sold} vendu{product.sold > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
        <Search size={40} className="text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">
        Aucun résultat trouvé
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {query ? (
          <>
            Nous n&apos;avons rien trouvé pour &quot;
            <span className="font-medium text-foreground">{query}</span>&quot;.
            Essayez de modifier vos filtres ou d&apos;utiliser des termes différents.
          </>
        ) : (
          <>Essayez d&apos;utiliser des termes de recherche ou de modifier vos filtres.</>
        )}
      </p>
      <a
        href="/"
        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-dark"
      >
        Retour à l&apos;accueil
      </a>
    </div>
  );
}
