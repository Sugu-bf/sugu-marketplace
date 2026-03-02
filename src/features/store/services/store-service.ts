import type { StoreListItem } from "../models/store";
import { getMockAllStores, getMockFeaturedStores } from "../mocks/stores";

/**
 * Store listing service — currently backed by mock data.
 * Replace with real API calls when backend is ready.
 */
export const storeListingService = {
  async getAllStores(
    category?: string,
    search?: string,
    page?: number,
    perPage?: number,
  ): Promise<{
    stores: StoreListItem[];
    total: number;
    totalPages: number;
  }> {
    return getMockAllStores(category, search, page, perPage);
  },

  async getFeaturedStores(): Promise<StoreListItem[]> {
    return getMockFeaturedStores();
  },
};
