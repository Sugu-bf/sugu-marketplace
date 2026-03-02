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
    price: api.pricing.price,
    originalPrice: api.pricing.compare_at_price ?? undefined,
    currency: api.pricing.currency || "F",
    discount: api.pricing.discount_percent || undefined,
    images: mapImages(api),
    thumbnail: api.media.images[0]?.url || "/products/placeholder.png",
    categoryId: Number(api.category?.id ?? 0),
    categoryName: api.category?.name ?? "",
    vendorId: Number(api.seller?.id ?? 0),
    vendorName: api.seller?.name ?? "",
    vendorSlug: api.seller?.slug,
    rating: api.rating.avg,
    reviewCount: api.rating.count,
    stock: api.stock.quantity_available,
    sold: 0, // Backend doesn't expose sold count yet
    tags: [], // Backend doesn't expose tags in PDP — safe default
    isFeatured: false,
    createdAt: new Date().toISOString(),
    promoPrice: api.pricing.compare_at_price && api.pricing.compare_at_price > api.pricing.price
      ? api.pricing.price
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
      unitPrice: tier.price,
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

  return options.map((option, optionIdx) => {
    const optionId = Number(option.id);

    return {
      // Guard: fall back to a negative index-based ID when the API returns
      // a null/undefined/empty id (Number() would produce NaN, which React
      // renders as duplicate keys and logs a warning).
      id: Number.isFinite(optionId) ? optionId : -(optionIdx + 1),
      name: option.name,
      options: option.values.map((val, valIdx) => {
        const valId = Number(val.id);

        // Check if any variant with this option value is in stock
        const matchingVariants = variants.filter((v) =>
          v.option_values[option.name] === val.label
        );
        const available = matchingVariants.some((v) => v.stock.in_stock);

        // Price adjustment: difference between this variant's price and the base price
        // For simplicity, we use 0 as default — actual price from variant is used at selection time
        const priceAdjustment = 0;

        return {
          // Same NaN guard for option values.
          id: Number.isFinite(valId) ? valId : -(optionIdx * 1000 + valIdx + 1),
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
    price: rel.pricing.price,
    originalPrice: rel.pricing.compare_at_price ?? undefined,
    discount: undefined,
    thumbnail: rel.image.url,
    rating: rel.rating.avg,
    reviewCount: rel.rating.count,
    stock: rel.in_stock ? 10 : 0, // Backend doesn't give exact stock for related
    sold: 0,
    vendorName: rel.seller?.name ?? "",
    categoryName: "",
  };
}
