import { supplierListingService } from "../services/supplier-service";
import type { SupplierListingState } from "../utils/queryState";

/**
 * Server-side query helpers for the /fournisseurs listing page.
 */
export async function queryAllSuppliers(state: SupplierListingState) {
  return supplierListingService.getSuppliers(state);
}

export async function queryFeaturedSuppliers() {
  return supplierListingService.getTopRatedSuppliers();
}
