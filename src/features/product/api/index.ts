/**
 * Product API — barrel export.
 */
export {
  fetchProductDetail,
  fetchRelatedProducts,
  fetchProductReviews,
  addToCart,
  fetchCartCount,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "./product-detail.api";
export type { AddToCartPayload, AddToWishlistPayload } from "./product-detail.api";

export {
  mapApiProductToProduct,
  mapApiRelatedToListItem,
} from "./product-detail.mappers";

export type {
  ApiProductDetail,
  ApiRelatedProduct,
  ApiReview,
  ApiPricing,
  ApiVariant,
  ApiOption,
  ApiBulkPrice,
  ApiStock,
  ApiSeller,
  CartResponse,
  WishlistResponse,
} from "./product-detail.schemas";
