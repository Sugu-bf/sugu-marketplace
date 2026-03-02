"use client";

import { useCallback, useRef, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  Star,
  PackageSearch,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice, DEFAULT_PRICE_RANGES } from "@/lib/constants";
import { ProductCard, Pagination, Badge } from "@/components/ui";
import type { ProductListItem } from "@/features/product";
import type { Subcategory } from "@/features/category";
import {
  type CategoryFiltersState,
  type SortValue,
  type ViewMode,
  serializeCategoryFilters,
  countActiveFilters,
  DEFAULT_FILTERS,
  SORT_VALUES,
} from "@/features/category";
import { useState } from "react";

// ─── Sort Options ────────────────────────────────────────────

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating", label: "Meilleures notes" },
  { value: "newest", label: "Nouveautés" },
  { value: "best_selling", label: "Meilleures ventes" },
];

// Price ranges from the central currency constant
const PRICE_RANGES = DEFAULT_PRICE_RANGES;

// ─── Types ───────────────────────────────────────────────────

interface CategoryPageClientProps {
  categoryName: string;
  categorySlug: string;
  products: ProductListItem[];
  subcategories: Subcategory[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  initialFilters: CategoryFiltersState;
}

// ─── Debounce Hook ───────────────────────────────────────────

function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// ─── Component ───────────────────────────────────────────────

export default function CategoryPageClient({
  categoryName,
  categorySlug,
  products,
  subcategories,
  totalProducts,
  totalPages,
  currentPage,
  initialFilters,
}: CategoryPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Local UI state (dropdowns, mobile drawer)
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters derived from props (SSR source of truth)
  const filters = initialFilters;
  const activeFilterCount = countActiveFilters(filters);

  // ─── Navigation (pushes new URL, triggers SSR) ─────────────

  const navigateWithFilters = useCallback(
    (newFilters: CategoryFiltersState) => {
      const params = serializeCategoryFilters(newFilters);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [pathname, router]
  );

  const debouncedNavigate = useDebouncedCallback(navigateWithFilters, 300);

  // ─── Filter Handlers (update URL) ──────────────────────────

  const updateFilters = useCallback(
    (partial: Partial<CategoryFiltersState>, immediate = false) => {
      const newFilters: CategoryFiltersState = {
        ...filters,
        ...partial,
        // Reset page when filters change (except when page itself changes)
        page: "page" in partial ? partial.page! : 1,
      };

      if (immediate) {
        navigateWithFilters(newFilters);
      } else {
        debouncedNavigate(newFilters);
      }
    },
    [filters, navigateWithFilters, debouncedNavigate]
  );

  const toggleSubcategory = useCallback(
    (slug: string) => {
      const newSubcats = filters.subcats.includes(slug)
        ? filters.subcats.filter((s) => s !== slug)
        : [...filters.subcats, slug];
      updateFilters({ subcats: newSubcats });
    },
    [filters.subcats, updateFilters]
  );

  const clearAllFilters = useCallback(() => {
    navigateWithFilters({
      ...DEFAULT_FILTERS,
      view: filters.view, // Preserve view mode
    });
  }, [navigateWithFilters, filters.view]);

  const handlePageChange = useCallback(
    (page: number) => {
      updateFilters({ page }, true);
      // Scroll to top of listing
      const listingEl = document.querySelector("[data-listing-top]");
      if (listingEl) {
        listingEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [updateFilters]
  );

  const handleSortChange = useCallback(
    (value: SortValue) => {
      updateFilters({ sort: value }, true);
      setShowSortDropdown(false);
    },
    [updateFilters]
  );

  const handleViewChange = useCallback(
    (view: ViewMode) => {
      updateFilters({ view, page: filters.page }, true);
    },
    [updateFilters, filters.page]
  );

  const handlePriceRange = useCallback(
    (idx: number) => {
      const range = PRICE_RANGES[idx];
      const isAlreadySelected =
        filters.priceMin === range.min && filters.priceMax === range.max;

      if (isAlreadySelected) {
        updateFilters({ priceMin: null, priceMax: null });
      } else {
        updateFilters({ priceMin: range.min, priceMax: range.max });
      }
    },
    [filters.priceMin, filters.priceMax, updateFilters]
  );

  const handleRatingChange = useCallback(
    (rating: number) => {
      updateFilters({
        ratingMin: filters.ratingMin === rating ? null : rating,
      });
    },
    [filters.ratingMin, updateFilters]
  );

  const handleInStockChange = useCallback(() => {
    updateFilters({ inStock: !filters.inStock });
  }, [filters.inStock, updateFilters]);

  // ─── Computed ──────────────────────────────────────────────

  const selectedPriceRangeIdx = PRICE_RANGES.findIndex(
    (r) => r.min === filters.priceMin && r.max === filters.priceMax
  );

  // ─── Filter Sidebar Content ──────────────────────────────────

  const FilterContent = (
    <div className="space-y-6">
      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
            Sous-catégories
          </h3>
          <div className="space-y-2">
            {subcategories.map((sub) => (
              <label
                key={sub.slug}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-primary-50"
              >
                <input
                  type="checkbox"
                  checked={filters.subcats.includes(sub.slug)}
                  onChange={() => toggleSubcategory(sub.slug)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                />
                <span className="flex-1 text-sm text-foreground">
                  {sub.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({sub.productCount})
                </span>
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
          {PRICE_RANGES.map((range, idx) => (
            <label
              key={idx}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-primary-50"
            >
              <input
                type="radio"
                name="priceRange"
                checked={selectedPriceRangeIdx === idx}
                onChange={() => handlePriceRange(idx)}
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
              onClick={() => handleRatingChange(rating)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200",
                filters.ratingMin === rating
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
            checked={filters.inStock}
            onChange={handleInStockChange}
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
      {/* ─── Subcategory Chips ───────────────────────────────────── */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={clearAllFilters}
            className={cn(
              "flex items-center gap-2 flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200",
              filters.subcats.length === 0
                ? "bg-primary text-white hover:bg-primary-dark"
                : "border border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
            )}
          >
            Tout voir
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.slug}
              onClick={() => toggleSubcategory(sub.slug)}
              className={cn(
                "flex items-center gap-2 flex-shrink-0 rounded-full px-4 py-2 text-sm shadow-sm transition-all duration-200",
                filters.subcats.includes(sub.slug)
                  ? "bg-primary text-white hover:bg-primary-dark font-medium"
                  : "border border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
              )}
            >
              {sub.image && (
                <div className="relative h-5 w-5 overflow-hidden rounded-full">
                  <Image
                    src={sub.image}
                    alt={sub.name}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
              )}
              {sub.name}
              <span className={cn(
                "text-xs",
                filters.subcats.includes(sub.slug) ? "text-white/70" : "text-muted-foreground"
              )}>
                ({sub.productCount})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ─── Sort Bar ─────────────────────────────────────────── */}
      <div
        data-listing-top
        className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-light bg-background p-3 shadow-sm"
      >
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
              {totalProducts}
            </span>{" "}
            produit{totalProducts !== 1 ? "s" : ""}{" "}
            <span className="hidden sm:inline">
              dans{" "}
              <span className="font-medium text-primary">{categoryName}</span>
            </span>
            {isPending && (
              <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                {SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}
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
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={cn(
                        "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                        filters.sort === option.value
                          ? "bg-primary-50 font-medium text-primary"
                          : "text-foreground hover:bg-muted"
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
                filters.view === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Vue grille"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={cn(
                "rounded-md p-1.5 transition-all duration-200",
                filters.view === "list"
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
          {filters.subcats.map((slug) => {
            const sub = subcategories.find((s) => s.slug === slug);
            return sub ? (
              <button
                key={slug}
                onClick={() => toggleSubcategory(slug)}
                className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              >
                {sub.name}
                <X
                  size={12}
                  className="opacity-60 group-hover/chip:opacity-100"
                />
              </button>
            ) : null;
          })}
          {selectedPriceRangeIdx >= 0 && (
            <button
              onClick={() => updateFilters({ priceMin: null, priceMax: null }, true)}
              className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              {PRICE_RANGES[selectedPriceRangeIdx]?.label}
              <X
                size={12}
                className="opacity-60 group-hover/chip:opacity-100"
              />
            </button>
          )}
          {filters.ratingMin !== null && (
            <button
              onClick={() => updateFilters({ ratingMin: null }, true)}
              className="group/chip flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              {filters.ratingMin}★ & plus
              <X
                size={12}
                className="opacity-60 group-hover/chip:opacity-100"
              />
            </button>
          )}
          {filters.inStock && (
            <button
              onClick={() => updateFilters({ inStock: false }, true)}
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
                  isPending && "opacity-60 transition-opacity duration-200",
                  filters.view === "grid"
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
                    {filters.view === "grid" ? (
                      <ProductCard
                        product={product}
                        showSaleBadge
                        className="w-full"
                      />
                    ) : (
                      <CategoryListItem product={product} />
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <EmptyCategoryState categoryName={categoryName} />
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
                Voir les produits ({totalProducts})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── List View Item ──────────────────────────────────────────

function CategoryListItem({ product }: { product: ProductListItem }) {
  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="group flex gap-4 rounded-2xl border border-border-light bg-background p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
      {/* Image */}
      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <PackageSearch size={32} />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount}%
          </span>
        )}
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>
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
      {/* Quick Add */}
      <div className="hidden items-center sm:flex">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-90"
          aria-label={`Ajouter ${product.name} au panier`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyCategoryState({ categoryName }: { categoryName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50">
        <PackageSearch size={40} className="text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">
        Aucun produit trouvé
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Aucun produit ne correspond à vos critères dans la catégorie &quot;
        <span className="font-medium text-foreground">{categoryName}</span>
        &quot;. Essayez de modifier vos filtres.
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
