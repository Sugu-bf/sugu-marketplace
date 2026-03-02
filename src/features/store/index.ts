// ─── Models ──────────────────────────────────────────────
export {
  StoreSchema,
  StoreCategorySchema,
  StoreReviewSchema,
  RatingDistributionSchema,
  StoreListItemSchema,
} from "./models/store";

export type {
  Store,
  StoreCategory,
  StoreReview,
  RatingDistribution,
  StoreListItem,
} from "./models/store";

// ─── API ─────────────────────────────────────────────────
export { fetchVendorPage, followStore, unfollowStore } from "./api/store.api";
export type { VendorPageParams, VendorPageSort } from "./api/store.api";

export {
  VendorPageResponseSchema,
  VendorProfileSchema,
  ProductCardSchema,
  FollowResponseSchema,
  ReviewsSummarySchema,
} from "./api/store.schemas";

export type {
  VendorProfile,
  VendorCategory,
  VendorProductCard,
  VendorPageResponse,
  ReviewsSummary,
  FollowResponse,
  ProductsMeta,
} from "./api/store.schemas";

// ─── Mappers ─────────────────────────────────────────────
export {
  mapVendorToStore,
  mapVendorProductToListItem,
} from "./api/store.mappers";

// ─── Listing Queries ─────────────────────────────────────
export {
  queryAllStores,
  queryFeaturedStores,
} from "./queries/store-queries";

// ─── URL State ───────────────────────────────────────────
export {
  parseStoreSearchParams,
  serializeStoreListingState,
  buildStoreListingUrl,
  STORE_LISTING_DEFAULTS,
} from "./utils/queryState";
export type { StoreListingState } from "./utils/queryState";

