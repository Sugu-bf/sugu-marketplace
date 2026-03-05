import type { SupplierListItem } from "../models/supplier";
import { getMockAllSuppliers, getMockFeaturedSuppliers } from "../mocks/suppliers";

/**
 * Supplier listing service — currently backed by mock data.
 *
 * READY FOR API: Replace getMockAllSuppliers() with:
 *   const res = await fetchSuppliers({ limit: perPage, sort: "top_rated", q: search });
 *   const suppliers = res.data.items.map(item => mapVendorToSupplier(item));
 *   return { suppliers, total, totalPages };
 */
export const supplierListingService = {
  async getAllSuppliers(
    sector?: string,
    search?: string,
    page?: number,
    perPage?: number,
  ): Promise<{
    suppliers: SupplierListItem[];
    total: number;
    totalPages: number;
  }> {
    return getMockAllSuppliers(sector, search, page, perPage);
  },

  async getFeaturedSuppliers(): Promise<SupplierListItem[]> {
    return getMockFeaturedSuppliers();
  },
};
