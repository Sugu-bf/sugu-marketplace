// ─── Models ──────────────────────────────────────────────
export {
  SupplierListItemSchema,
  SupplierSectorSchema,
} from "./models/supplier";

export type {
  SupplierListItem,
  SupplierSector,
} from "./models/supplier";

// ─── API ─────────────────────────────────────────────────
export { fetchSuppliers } from "./api/supplier.api";
export type { SuppliersParams } from "./api/supplier.api";

export {
  SuppliersResponseSchema,
  SupplierVendorCardSchema,
  SupplierFacetSchema,
} from "./api/supplier.schemas";

export type {
  SupplierVendorCard,
  SupplierFacet,
  SuppliersResponse,
} from "./api/supplier.schemas";

// ─── Mappers ─────────────────────────────────────────────
export { mapVendorToSupplier } from "./api/supplier.mappers";

// ─── Listing Queries ─────────────────────────────────────
export {
  queryAllSuppliers,
  queryFeaturedSuppliers,
} from "./queries/supplier-queries";

// ─── URL State ───────────────────────────────────────────
export {
  parseSupplierSearchParams,
  serializeSupplierListingState,
  buildSupplierListingUrl,
  SUPPLIER_LISTING_DEFAULTS,
} from "./utils/queryState";
export type { SupplierListingState } from "./utils/queryState";
