/**
 * Product Detail — Mappers from API response to UI types.
 *
 * These functions bridge the gap between the backend API shape
 * (ApiProductDetail) and the existing UI type (Product).
 *
 * RULE: No data invention. All mapped fields come from the API.
 * If a field doesn't exist in the API, it's set to a safe default.
 */

import type { Product, ProductListItem, BulkPriceTier, ProductVariant, ProductImage } from "../models/product";
import type { ApiProductDetail, ApiRelatedProduct, ApiBulkPrice, ApiVariant, ApiOption } from "./product-detail.schemas";
import { toLegacyStockQuantity } from "../utils/product-availability";

/**
 * Map API product detail → UI Product type.
 *
 * This preserves the existing Product interface so no UI component changes are needed.
 */
export function mapApiProductToProduct(api: ApiProductDetail): Product {
  return {
    id: String(api.id),
    slug: api.slug,
    name: api.name,
    description: api.description_html || api.short_description || "",
    price: Math.round(api.pricing.price / 100),
    originalPrice: api.pricing.compare_at_price ? Math.round(api.pricing.compare_at_price / 100) : undefined,
    currency: api.pricing.currency || "F",
    discount: api.pricing.discount_percent || undefined,
    images: mapImages(api),
    thumbnail: api.media.images[0]?.url || "/products/placeholder.png",
    categoryId: api.category?.id ? String(api.category.id) : 0,
    categoryName: api.category?.name ?? "",
    vendorId: api.seller?.id ? String(api.seller.id) : 0,
    vendorName: api.seller?.name ?? "",
    vendorSlug: api.seller?.slug,
    rating: api.rating.avg,
    reviewCount: api.rating.count,
    stock: toLegacyStockQuantity(api.stock),
    isInStock: api.stock.in_stock,
    isStockUnlimited: api.stock.is_unlimited ?? false,
    minOrderQuantity: api.min_order_quantity ?? 1,
    hasVariants: api.has_variants ?? api.options.length > 0,
    defaultVariantId: api.default_variant_id,
    sold: 0, // Backend doesn't expose sold count yet
    tags: [], // Backend doesn't expose tags in PDP — safe default
    isFeatured: false,
    createdAt: new Date().toISOString(),
    promoPrice: api.pricing.compare_at_price && api.pricing.compare_at_price > api.pricing.price
      ? Math.round(api.pricing.price / 100)
      : undefined,
    promoEndsAt: api.pricing.promo_ends_at ?? undefined,
    bulkPrices: mapBulkPrices(api.bulkPrices),
    variants: mapVariantsToLegacy(api.options, api.variants),
    specifications: undefined, // TODO: Add specifications endpoint if available
  };
}

/**
 * Map API images → ProductImage[].
 */
function mapImages(api: ApiProductDetail): ProductImage[] {
  return api.media.images.map((img, idx) => ({
    id: idx + 1,
    url: img.url,
    alt: img.alt || api.name,
  }));
}

/**
 * Map API bulk prices → BulkPriceTier[].
 *
 * The backend returns { minQty, price } without maxQty or label.
 * We compute them from the sorted list.
 */
function mapBulkPrices(bulkPrices: ApiBulkPrice[]): BulkPriceTier[] | undefined {
  if (!bulkPrices.length) return undefined;

  const sorted = [...bulkPrices].sort((a, b) => a.minQty - b.minQty);

  return sorted.map((tier, idx) => {
    const nextTier = sorted[idx + 1];
    const maxQty = nextTier ? nextTier.minQty - 1 : undefined;
    const label = maxQty
      ? `${tier.minQty}-${maxQty} unités`
      : `${tier.minQty}+ unités`;

    return {
      minQty: tier.minQty,
      maxQty,
      unitPrice: Math.round(tier.price / 100),
      label,
    };
  });
}

/**
 * Map API options + variants → legacy ProductVariant[] for UI.
 *
 * The backend has a modern options/variants model:
 * - options: [{id, name, values: [{id, label}]}]   → e.g. "Poids" with "250g", "500g"
 * - variants: [{id, option_values: {Poids: "250g"}, pricing, stock}]
 *
 * The legacy UI expects:
 * - variants: [{id, name, options: [{id, value, available, priceAdjustment}]}]
 *
 * We transform options into the legacy format, computing availability
 * from the actual variant stock data.
 */
function mapVariantsToLegacy(
  options: ApiOption[],
  variants: ApiVariant[]
): ProductVariant[] | undefined {
  if (!options.length) return undefined;

  return options.map((option) => {
    return {
      id: String(option.id),
      name: option.name,
      options: option.values.map((val) => {
        // Check if any variant with this option value is in stock
        const matchingVariants = variants.filter((v) =>
          v.option_values[option.name] === val.label
        );
        const available = matchingVariants.some((v) => v.stock.in_stock);

        // Price adjustment: difference between this variant's price and the base price
        // For simplicity, we use 0 as default — actual price from variant is used at selection time
        const priceAdjustment = 0;

        return {
          id: String(val.id),
          value: val.label,
          available,
          priceAdjustment,
        };
      }),
    };
  });
}

/**
 * Map API related product → ProductListItem for the UI.
 */
export function mapApiRelatedToListItem(rel: ApiRelatedProduct): ProductListItem {
  return {
    id: String(rel.id),
    slug: rel.slug,
    name: rel.name,
    price: Math.round(rel.pricing.price / 100),
    originalPrice: rel.pricing.compare_at_price ? Math.round(rel.pricing.compare_at_price / 100) : undefined,
    discount: undefined,
    thumbnail: rel.image.url,
    rating: rel.rating.avg,
    reviewCount: rel.rating.count,
    stock: rel.stock?.available ?? (rel.in_stock ? 1 : 0),
    isInStock: rel.in_stock,
    minOrderQuantity: rel.min_order_quantity ?? 1,
    hasVariants: rel.has_variants ?? false,
    defaultVariantId: rel.default_variant_id,
    sold: 0,
    vendorName: rel.seller?.name ?? "",
    categoryName: "",
  };
}
