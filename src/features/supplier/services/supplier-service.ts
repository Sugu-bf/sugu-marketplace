import type { SupplierListItem } from "../models/supplier";
import { fetchSuppliers, type SuppliersParams } from "../api/supplier.api";
import { mapVendorToSupplier } from "../api/supplier.mappers";
import { getMockAllSuppliers, getMockFeaturedSuppliers } from "../mocks/suppliers";

/**
 * Supplier listing service — backed by the real vendors API.
 *
 * Endpoint: GET /api/v1/vendors
 * Falls back to mock data if the API call fails (e.g. local dev without backend).
 *
 * Pagination note: the backend uses cursor pagination (next_cursor, has_more)
 * but the frontend expects page-based (page, totalPages). We adapt by treating
 * each API call as a single page and using `has_more` to signal additional pages.
 * The backend doesn't expose a total count, so `total` reflects the current page
 * item count when data comes from the API.
 */
export const supplierListingService = {
  async getAllSuppliers(
    sector?: string,
    search?: string,
    page?: number,
    perPage: number = 12,
  ): Promise<{
    suppliers: SupplierListItem[];
    total: number;
    totalPages: number;
  }> {
    try {
      const params: SuppliersParams = {
        limit: perPage,
        sort: "popular",
        q: search || undefined,
      };

      const { data: response } = await fetchSuppliers(params, {
        revalidate: 300,
        tags: ["suppliers"],
      });

      let suppliers = response.items.map((item) =>
        mapVendorToSupplier(item),
      );

      // Sector filtering — the backend doesn't support a `sector` param,
      // so we filter client-side. Since sectors are not yet returned by the
      // API (placeholder []), this filter is a no-op for now but will work
      // once the backend enriches the vendor card with sector data.
      if (sector && sector !== "all") {
        suppliers = suppliers.filter((s) =>
          s.sectors.some(
            (sec) => sec.name.toLowerCase() === sector.toLowerCase(),
          ),
        );
      }

      // The backend uses cursor pagination without a total count.
      // We approximate page-based pagination: the current page is always
      // valid, and if has_more is true there's at least one more page.
      const currentPage = page ?? 1;
      const total = suppliers.length;
      const totalPages = response.meta.has_more ? currentPage + 1 : currentPage;

      return { suppliers, total, totalPages };
    } catch {
      // Fallback to mock data if the API is unreachable (local dev, network issue).
      return getMockAllSuppliers(sector, search, page, perPage);
    }
  },

  async getFeaturedSuppliers(): Promise<SupplierListItem[]> {
    try {
      const { data: response } = await fetchSuppliers(
        { limit: 4, sort: "top_rated" },
        { revalidate: 300, tags: ["suppliers", "featured"] },
      );

      return response.items.map((item) =>
        mapVendorToSupplier(item, true),
      );
    } catch {
      // Fallback to mock data if the API is unreachable.
      return getMockFeaturedSuppliers();
    }
  },
};
