import { fetchSuppliers } from "@/features/supplier/api/supplier.api";
import { mapVendorToSupplier } from "@/features/supplier/api/supplier.mappers";
import type { SupplierVendorCard } from "@/features/supplier/api/supplier.schemas";
import type { SupplierListingState } from "@/features/supplier/utils/queryState";
import type { StoreListItem } from "../models/store";

/**
 * Server-side query helpers for the /stores listing page.
 *
 * Real vendors API (GET /api/v1/vendors, the endpoint /fournisseurs reads
 * too): cursor pages, no total, no category. A failure throws to the error
 * boundary — the page was entirely made of mock stores.
 */

function toStoreListItem(card: SupplierVendorCard): StoreListItem {
  const vendor = mapVendorToSupplier(card);
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    logoUrl: vendor.logoUrl,
    logoInitials: vendor.logoInitials,
    logoColor: vendor.logoColor,
    location: vendor.location,
    memberSince: vendor.memberSince,
    rating: vendor.rating,
    reviewCount: vendor.reviewCount,
    totalProducts: vendor.totalProducts,
    totalSales: vendor.totalSales,
    isFeatured: false,
    categories: [],
  };
}

export async function queryAllStores(
  state: SupplierListingState,
  perPage = 12,
): Promise<{ stores: StoreListItem[]; nextCursor: string | null }> {
  const { data } = await fetchSuppliers(
    { limit: perPage, sort: state.sort, q: state.q || undefined, cursor: state.cursor },
    { revalidate: 300, tags: ["stores"] },
  );

  return {
    stores: data.items.map(toStoreListItem),
    nextCursor: data.meta.has_more ? data.meta.next_cursor : null,
  };
}

export async function queryTopRatedStores(limit = 4): Promise<StoreListItem[]> {
  const { data } = await fetchSuppliers(
    { limit, sort: "top_rated" },
    { revalidate: 300, tags: ["stores", "featured"] },
  );

  return data.items.map(toStoreListItem);
}
