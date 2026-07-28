import { describe, expect, it } from "vitest";
import type { ApiProductDetail } from "../api/product-detail.schemas";
import {
  isStockQuantityUnknown,
  resolveApiVariant,
  toLegacyStockQuantity,
} from "../utils/product-availability";

function simpleProduct(overrides: Partial<ApiProductDetail> = {}): ApiProductDetail {
  return {
    id: "01kvwpp2kddy93p4edaxnbnefs",
    slug: "simple-product",
    name: "Simple product",
    sku: "",
    short_description: "",
    description_html: "",
    media: { images: [{ url: "/product.jpg", alt: "Simple product" }] },
    pricing: {
      currency: "F",
      price: 2_200_000,
      compare_at_price: null,
      discount_percent: 0,
      unit_label: "/Qty",
      formatted: "22 000 F CFA",
      formatted_compare: null,
      promo_ends_at: null,
    },
    bulkPrices: [],
    stock: {
      in_stock: true,
      quantity_available: null,
      low_stock: false,
      is_unlimited: false,
    },
    options: [],
    variants: [{
      id: "01kvwpp2qcga5jettydr24a67n",
      sku: "VAR-DRM3YE6S",
      option_values: {},
      pricing: {
        price: 2_200_000,
        compare_at_price: null,
        formatted: "22 000 F CFA",
        formatted_compare: null,
      },
      stock: {
        in_stock: true,
        quantity: 10_000,
        is_unlimited: false,
      },
      min_order_quantity: 1,
      bulkPrices: [],
      image_url: null,
    }],
    default_variant_id: null,
    min_order_quantity: 1,
    has_variants: false,
    seller: null,
    shipping: {
      deliverable: true,
      estimated_time: "24-72h",
    },
    rating: {
      avg: 0,
      count: 0,
      distribution: [0, 0, 0, 0, 0],
    },
    ...overrides,
  };
}

describe("simple product availability", () => {
  it("resolves the sole technical variant when there are no selectable options", () => {
    const product = simpleProduct();

    const variant = resolveApiVariant(product, {});

    expect(variant?.id).toBe("01kvwpp2qcga5jettydr24a67n");
    expect(variant?.stock.quantity).toBe(10_000);
  });

  it("does not turn a fail-open in-stock snapshot into an out-of-stock value", () => {
    const product = simpleProduct();

    expect(toLegacyStockQuantity(product.stock)).toBe(1);
    expect(isStockQuantityUnknown(product)).toBe(true);
  });

  it("keeps a real out-of-stock snapshot at zero", () => {
    const product = simpleProduct({
      stock: {
        in_stock: false,
        quantity_available: 0,
        low_stock: false,
        is_unlimited: false,
      },
      variants: [],
    });

    expect(toLegacyStockQuantity(product.stock)).toBe(0);
    expect(isStockQuantityUnknown(product)).toBe(false);
  });

  it("does not auto-select a variant for an inconsistent configurable product without options", () => {
    const product = simpleProduct({ has_variants: true });

    expect(resolveApiVariant(product, {})).toBeNull();
  });
});
