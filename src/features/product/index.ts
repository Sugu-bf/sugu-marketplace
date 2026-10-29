// ─── Models (UI types) ───────────────────────────────────────
export { ProductSchema, ProductListItemSchema, ProductImageSchema, BulkPriceTierSchema, ProductVariantSchema, ProductVariantOptionSchema } from "./models/product";
export type { Product, ProductListItem, ProductImage, BulkPriceTier, ProductVariant, ProductVariantOption } from "./models/product";

// ─── Queries (entry points for pages) ────────────────────────
export { queryFeaturedProducts, queryProductBySlug, queryRelatedProducts } from "./queries/product-queries";

// ─── API (for direct use in client components) ───────────────
export { addToCart, fetchCartCount, fetchProductReviews } from "./api";
export type { ApiProductDetail, ApiVariant, ApiOption, ApiPricing, ApiBulkPrice, ApiStock, ApiSeller, ApiReview, AddToCartPayload, CartResponse } from "./api";
