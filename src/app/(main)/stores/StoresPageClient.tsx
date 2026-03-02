"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Monitor,
  Shirt,
  UtensilsCrossed,
  Home,
  SprayCan,
  Dumbbell,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Pagination, SectionHeader } from "@/components/ui";
import type { StoreListItem } from "@/features/store";
import StoreCard from "@/features/store/components/StoreCard";
import FeaturedStoreCard from "@/features/store/components/FeaturedStoreCard";

// ─── Category filter options ─────────────────────────────

const storeCategories: {
  id: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { id: "all", label: "Tous" },
  { id: "électronique", label: "Électronique", icon: Monitor },
  { id: "mode", label: "Mode", icon: Shirt },
  { id: "alimentaire", label: "Alimentaire", icon: UtensilsCrossed },
  { id: "maison", label: "Maison", icon: Home },
  { id: "cosmétique", label: "Beauté", icon: SprayCan },
  { id: "sport", label: "Sport", icon: Dumbbell },
  { id: "livres", label: "Librairie", icon: BookOpen },
];

// ─── Props ───────────────────────────────────────────────

interface StoresPageClientProps {
  featuredStores: StoreListItem[];
  stores: StoreListItem[];
  totalStores: number;
  totalPages: number;
  currentPage: number;
  initialCategory: string;
  initialSearch: string;
}

// ─── Component ───────────────────────────────────────────

export default function StoresPageClient({
  featuredStores,
  stores,
  totalStores,
  totalPages,
  currentPage,
  initialCategory,
  initialSearch,
}: StoresPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchValue, setSearchValue] = useState(initialSearch);

  // Build URL and navigate with transition
  const navigate = useCallback(
    (params: { category?: string; q?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const cat = params.category ?? activeCategory;
      const q = params.q ?? searchValue;
      const page = params.page ?? 1;

      if (cat && cat !== "all") sp.set("category", cat);
      if (q) sp.set("q", q);
      if (page > 1) sp.set("page", String(page));

      const qs = sp.toString();
      startTransition(() => {
        router.push(qs ? `/stores?${qs}` : "/stores", { scroll: false });
      });
    },
    [activeCategory, searchValue, router],
  );

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    navigate({ category: catId, page: 1 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchValue, page: 1 });
  };

  const handlePageChange = (page: number) => {
    navigate({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Compute display range
  const perPage = 12;
  const rangeStart = (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, totalStores);

  return (
    <div
      className={`transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}
    >
      {/* ─── A. Filter Bar ────────────────────────────────────────── */}
      <div className="animate-fade-slide-up">
        {/* Top row: count + sort + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {totalStores} boutique{totalStores !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm bg-white text-foreground focus:outline-none focus:border-primary"
              defaultValue="popular"
            >
              <option value="popular">Trier: Populaires</option>
              <option value="newest">Plus récentes</option>
              <option value="top_rated">Mieux notées</option>
              <option value="most_products">Plus de produits</option>
            </select>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Rechercher une boutique..."
                className="rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm w-[220px] focus:outline-none focus:border-primary transition-colors"
              />
            </form>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {storeCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {Icon && <Icon size={13} strokeWidth={1.5} />}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── B. Featured Stores (horizontal scroll) ───────────────── */}
      {featuredStores.length > 0 && (
        <div className="mt-8 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
          <SectionHeader title="⭐ Boutiques vedettes" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {featuredStores.map((store) => (
              <FeaturedStoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      )}

      {/* ─── C. All Stores Grid ───────────────────────────────────── */}
      <div className="mt-8 animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
        <SectionHeader
          title="Toutes les boutiques"
          subtitle={`${totalStores} boutique${totalStores !== 1 ? "s" : ""}`}
        />

        {stores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Aucune boutique trouvée
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Essayez de modifier vos filtres ou votre recherche pour trouver
              des boutiques.
            </p>
          </div>
        )}
      </div>

      {/* ─── D. Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <p className="text-sm text-muted-foreground">
            {rangeStart}-{rangeEnd} sur {totalStores} boutique
            {totalStores !== 1 ? "s" : ""}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
