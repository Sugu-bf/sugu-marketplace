import { storeListingService } from "../services/store-service";

/**
 * Server-side query helpers for the /stores listing page.
 */
export async function queryAllStores(
  category?: string,
  search?: string,
  page?: number,
) {
  return storeListingService.getAllStores(category, search, page);
}

export async function queryFeaturedStores() {
  return storeListingService.getFeaturedStores();
}
