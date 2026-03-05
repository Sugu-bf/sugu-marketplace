import { supplierListingService } from "../services/supplier-service";

/**
 * Server-side query helpers for the /fournisseurs listing page.
 */
export async function queryAllSuppliers(
  sector?: string,
  search?: string,
  page?: number,
) {
  return supplierListingService.getAllSuppliers(sector, search, page);
}

export async function queryFeaturedSuppliers() {
  return supplierListingService.getFeaturedSuppliers();
}
