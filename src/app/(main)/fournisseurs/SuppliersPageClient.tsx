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
  Factory,
  BookOpen,
  Bath,
  Cross,
  type LucideIcon,
} from "lucide-react";
import { Pagination, SectionHeader } from "@/components/ui";
import type { SupplierListItem } from "@/features/supplier";
import SupplierCard from "@/features/supplier/components/SupplierCard";
import FeaturedSupplierCard from "@/features/supplier/components/FeaturedSupplierCard";

// ─── Sector filter options ───────────────────────────────

const supplierSectors: {
  id: string;
  label: string;
  icon?: LucideIcon;
}[] = [
  { id: "all", label: "Tous" },
  { id: "alimentaire", label: "Alimentaire", icon: UtensilsCrossed },
  { id: "cosmétique", label: "Cosmétique", icon: SprayCan },
  { id: "maison", label: "Maison", icon: Home },
  { id: "textile", label: "Textile", icon: Shirt },
  { id: "électronique", label: "Électronique", icon: Monitor },
  { id: "santé", label: "Santé", icon: Cross },
  { id: "hygiène", label: "Hygiène", icon: Bath },
  { id: "industriel", label: "Industriel", icon: Factory },
  { id: "papeterie", label: "Papeterie", icon: BookOpen },
];

// ─── Props ───────────────────────────────────────────────

interface SuppliersPageClientProps {
  featuredSuppliers: SupplierListItem[];
  suppliers: SupplierListItem[];
  totalSuppliers: number;
  totalPages: number;
  currentPage: number;
  initialSector: string;
  initialSearch: string;
}

// ─── Component ───────────────────────────────────────────

export default function SuppliersPageClient({
  featuredSuppliers,
  suppliers,
  totalSuppliers,
  totalPages,
  currentPage,
  initialSector,
  initialSearch,
}: SuppliersPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeSector, setActiveSector] = useState(initialSector);
  const [searchValue, setSearchValue] = useState(initialSearch);

  // Build URL and navigate with transition
  const navigate = useCallback(
    (params: { sector?: string; q?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const sec = params.sector ?? activeSector;
      const q = params.q ?? searchValue;
      const page = params.page ?? 1;

      if (sec && sec !== "all") sp.set("sector", sec);
      if (q) sp.set("q", q);
      if (page > 1) sp.set("page", String(page));

      const qs = sp.toString();
      startTransition(() => {
        router.push(qs ? `/fournisseurs?${qs}` : "/fournisseurs", {
          scroll: false,
        });
      });
    },
    [activeSector, searchValue, router],
  );

  const handleSectorChange = (sectorId: string) => {
    setActiveSector(sectorId);
    navigate({ sector: sectorId, page: 1 });
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
  const rangeEnd = Math.min(currentPage * perPage, totalSuppliers);

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
              {totalSuppliers} fournisseur{totalSuppliers !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm bg-white text-foreground focus:outline-none focus:border-primary"
              defaultValue="popular"
            >
              <option value="popular">Trier: Populaires</option>
              <option value="newest">Plus récents</option>
              <option value="top_rated">Mieux notés</option>
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
                placeholder="Rechercher un fournisseur..."
                className="rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm w-[220px] focus:outline-none focus:border-primary transition-colors"
              />
            </form>
          </div>
        </div>

        {/* Sector pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {supplierSectors.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => handleSectorChange(sec.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                  activeSector === sec.id
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {Icon && <Icon size={13} strokeWidth={1.5} />}
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── B. Featured Suppliers (horizontal scroll) ─────────────── */}
      {featuredSuppliers.length > 0 && (
        <div
          className="mt-8 animate-fade-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <SectionHeader title="⭐ Fournisseurs vedettes" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {featuredSuppliers.map((supplier) => (
              <FeaturedSupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </div>
      )}

      {/* ─── C. All Suppliers Grid ─────────────────────────────────── */}
      <div
        className="mt-8 animate-fade-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <SectionHeader
          title="Tous les fournisseurs"
          subtitle={`${totalSuppliers} fournisseur${totalSuppliers !== 1 ? "s" : ""}`}
        />

        {suppliers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Aucun fournisseur trouvé
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Essayez de modifier vos filtres ou votre recherche pour trouver
              des fournisseurs.
            </p>
          </div>
        )}
      </div>

      {/* ─── D. Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <p className="text-sm text-muted-foreground">
            {rangeStart}-{rangeEnd} sur {totalSuppliers} fournisseur
            {totalSuppliers !== 1 ? "s" : ""}
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
