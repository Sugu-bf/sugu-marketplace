"use client";

import { Search } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { VendorListingPager, VendorListingToolbar } from "@/components/VendorListingControls";
import type { SupplierListItem, SupplierListingState } from "@/features/supplier";
import SupplierCard from "@/features/supplier/components/SupplierCard";
import FeaturedSupplierCard from "@/features/supplier/components/FeaturedSupplierCard";

// ─── Props ───────────────────────────────────────────────

interface SuppliersPageClientProps {
  featuredSuppliers: SupplierListItem[];
  suppliers: SupplierListItem[];
  nextCursor: string | null;
  state: SupplierListingState;
}

// ─── Component ───────────────────────────────────────────

export default function SuppliersPageClient({
  featuredSuppliers,
  suppliers,
  nextCursor,
  state,
}: SuppliersPageClientProps) {
  return (
    <VendorListingToolbar basePath="/fournisseurs" state={state} searchPlaceholder="Rechercher un fournisseur...">
      {/* ─── A. Best-rated Suppliers (horizontal scroll) ───────────── */}
      {featuredSuppliers.length > 0 && (
        <div
          className="mt-4 animate-fade-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <SectionHeader title="Fournisseurs les mieux notés" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {featuredSuppliers.map((supplier) => (
              <FeaturedSupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </div>
      )}

      {/* ─── B. All Suppliers Grid ─────────────────────────────────── */}
      <div
        className="mt-8 animate-fade-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <SectionHeader title="Tous les fournisseurs" />

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
              Essayez une autre recherche pour trouver des fournisseurs.
            </p>
          </div>
        )}
      </div>

      {/* ─── C. Next page ─────────────────────────────────────────── */}
      <VendorListingPager
        basePath="/fournisseurs"
        state={state}
        nextCursor={nextCursor}
        nextLabel="Fournisseurs suivants"
      />
    </VendorListingToolbar>
  );
}
