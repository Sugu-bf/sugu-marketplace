/**
 * Product API — barrel export.
 */
export {
  fetchProductDetail,
  fetchRelatedProducts,
  fetchProductReviews,
  addToCart,
  fetchCartCount,
} from "./product-detail.api";
export type { AddToCartPayload } from "./product-detail.api";

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
} from "./product-detail.schemas";
