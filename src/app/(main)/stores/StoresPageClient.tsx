"use client";

import { Search } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { VendorListingPager, VendorListingToolbar } from "@/components/VendorListingControls";
import type { StoreListItem } from "@/features/store";
import type { SupplierListingState } from "@/features/supplier/utils/queryState";
import StoreCard from "@/features/store/components/StoreCard";
import FeaturedStoreCard from "@/features/store/components/FeaturedStoreCard";

// ─── Props ───────────────────────────────────────────────

interface StoresPageClientProps {
  topRatedStores: StoreListItem[];
  stores: StoreListItem[];
  nextCursor: string | null;
  state: SupplierListingState;
}

// ─── Component ───────────────────────────────────────────

export default function StoresPageClient({
  topRatedStores,
  stores,
  nextCursor,
  state,
}: StoresPageClientProps) {
  return (
    <VendorListingToolbar basePath="/stores" state={state} searchPlaceholder="Rechercher une boutique...">
      {/* ─── A. Best-rated Stores (horizontal scroll) ─────────────── */}
      {topRatedStores.length > 0 && (
        <div className="mt-4 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
          <SectionHeader title="Boutiques les mieux notées" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {topRatedStores.map((store) => (
              <FeaturedStoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      )}

      {/* ─── B. All Stores Grid ───────────────────────────────────── */}
      <div className="mt-8 animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
        <SectionHeader title="Toutes les boutiques" />

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
              Essayez une autre recherche pour trouver des boutiques.
            </p>
          </div>
        )}
      </div>

      {/* ─── C. Next page ─────────────────────────────────────────── */}
      <VendorListingPager basePath="/stores" state={state} nextCursor={nextCursor} nextLabel="Boutiques suivantes" />
    </VendorListingToolbar>
  );
}
