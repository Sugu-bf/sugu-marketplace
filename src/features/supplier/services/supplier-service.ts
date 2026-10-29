import type { SupplierListItem } from "../models/supplier";
import { fetchSuppliers } from "../api/supplier.api";
import { mapVendorToSupplier } from "../api/supplier.mappers";
import type { SupplierListingState } from "../utils/queryState";

/**
 * Supplier listing service — the real vendors API, nothing else.
 *
 * Endpoint: GET /api/v1/vendors. It pages with a cursor and returns no total
 * nor sector: the listing moves forward with `nextCursor` and shows no count.
 * A failure throws to the error boundary (no stand-in suppliers).
 */
export const supplierListingService = {
  async getSuppliers(
    state: SupplierListingState,
    perPage = 12,
  ): Promise<{ suppliers: SupplierListItem[]; nextCursor: string | null }> {
    const { data } = await fetchSuppliers(
      { limit: perPage, sort: state.sort, q: state.q || undefined, cursor: state.cursor },
      { revalidate: 300, tags: ["suppliers"] },
    );

    return {
      suppliers: data.items.map((item) => mapVendorToSupplier(item)),
      nextCursor: data.meta.has_more ? data.meta.next_cursor : null,
    };
  },

  async getTopRatedSuppliers(limit = 4): Promise<SupplierListItem[]> {
    const { data } = await fetchSuppliers(
      { limit, sort: "top_rated" },
      { revalidate: 300, tags: ["suppliers", "featured"] },
    );

    return data.items.map((item) => mapVendorToSupplier(item, true));
  },
};
