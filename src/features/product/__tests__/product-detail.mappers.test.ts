/**
 * Tests — Product Detail Mappers.
 *
 * Verifies that the API-to-UI mapping is correct, especially:
 * - Variant availability resolution from real backend data
 * - Bulk price tier label generation
 * - Image mapping
 * - Safe defaults for missing fields
 */

import { describe, it, expect } from "vitest";
import { mapApiProductToProduct, mapApiRelatedToListItem } from "../api/product-detail.mappers";
import type { ApiProductDetail, ApiRelatedProduct } from "../api/product-detail.schemas";

// ─── mapApiProductToProduct ──────────────────────────────────

describe("mapApiProductToProduct", () => {
  const BASE_API_PRODUCT: ApiProductDetail = {
    id: "01PROD",
    slug: "tomates-bio",
    name: "Tomates Bio",
    sku: "TOM-BIO",
    brand: { id: 1, name: "Bio Farm", slug: "bio-farm" },
    category: { id: 5, name: "Fruits & Légumes", slug: "fruits-legumes" },
    short_description: "Tomates bio locales",
    description_html: "<p>Tomates bio</p>",
    media: {
      images: [
        { url: "/img1.jpg", alt: "Tomates" },
        { url: "/img2.jpg", alt: "Tomates vue 2" },
      ],
      video_url: null,
    },
    pricing: {
      currency: "F",
      price: 1500,
      compare_at_price: 2000,
      discount_percent: 25,
      unit_label: "/Qty",
      formatted: "1 500 F",
      formatted_compare: "2 000 F",
    },
    bulkPrices: [
      { id: 1, minQty: 1, price: 1500, currency: "XOF", isActive: true },
      { id: 2, minQty: 5, price: 1300, currency: "XOF", isActive: true },
      { id: 3, minQty: 10, price: 1100, currency: "XOF", isActive: true },
    ],
    stock: { in_stock: true, quantity_available: 50, low_stock: false },
    options: [
      {
        id: 1,
        name: "Poids",
        values: [
          { id: 10, label: "250g" },
          { id: 11, label: "500g" },
          { id: 12, label: "1kg" },
        ],
      },
    ],
    variants: [
      {
        id: 100,
        sku: "TOM-250",
        option_values: { Poids: "250g" },
        pricing: { price: 800, compare_at_price: null, formatted: "800 F", formatted_compare: null },
        stock: { in_stock: true, quantity: 30 },
        image_url: null,
      },
      {
        id: 101,
        sku: "TOM-500",
        option_values: { Poids: "500g" },
        pricing: { price: 1500, compare_at_price: 2000, formatted: "1 500 F", formatted_compare: "2 000 F" },
        stock: { in_stock: true, quantity: 50 },
        image_url: null,
      },
      {
        id: 102,
        sku: "TOM-1KG",
        option_values: { Poids: "1kg" },
        pricing: { price: 2800, compare_at_price: null, formatted: "2 800 F", formatted_compare: null },
        stock: { in_stock: false, quantity: 0 },
        image_url: null,
      },
    ],
    default_variant_id: 101,
    seller: {
      id: "01SELLER",
      name: "Ferme du Soleil",
      slug: "ferme-du-soleil",
      logo_url: null,
      rating: { avg: 4.2, count: 87 },
    },
    shipping: {
      deliverable: true,
      estimated_time: "24-72h",
      fees: { amount: 0, currency: "XOF", label: "Voir à la commande" },
    },
    rating: { avg: 4.5, count: 128, distribution: [2, 5, 10, 30, 81] },
    seo: {
      title: "Tomates Bio | Sugu",
      description: "Tomates bio locales",
      canonical: "/product/tomates-bio",
    },
  };

  it("maps basic fields correctly", () => {
    const result = mapApiProductToProduct(BASE_API_PRODUCT);

    expect(result.id).toBeNaN(); // String "01PROD" → Number("01PROD") = NaN (ULID IDs)
    expect(result.slug).toBe("tomates-bio");
    expect(result.name).toBe("Tomates Bio");
    expect(result.price).toBe(1500);
    expect(result.originalPrice).toBe(2000);
    expect(result.currency).toBe("F");
    expect(result.discount).toBe(25);
    expect(result.vendorName).toBe("Ferme du Soleil");
    expect(result.vendorSlug).toBe("ferme-du-soleil");
    expect(result.categoryName).toBe("Fruits & Légumes");
    expect(result.rating).toBe(4.5);
    expect(result.reviewCount).toBe(128);
    expect(result.stock).toBe(50);
  });

  it("maps images with correct IDs", () => {
    const result = mapApiProductToProduct(BASE_API_PRODUCT);
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toEqual({ id: 1, url: "/img1.jpg", alt: "Tomates" });
    expect(result.images[1]).toEqual({ id: 2, url: "/img2.jpg", alt: "Tomates vue 2" });
    expect(result.thumbnail).toBe("/img1.jpg");
  });

  it("maps bulk prices with computed labels", () => {
    const result = mapApiProductToProduct(BASE_API_PRODUCT);
    expect(result.bulkPrices).toHaveLength(3);
    expect(result.bulkPrices![0]).toEqual({
      minQty: 1,
      maxQty: 4,
      unitPrice: 1500,
      label: "1-4 unités",
    });
    expect(result.bulkPrices![1]).toEqual({
      minQty: 5,
      maxQty: 9,
      unitPrice: 1300,
      label: "5-9 unités",
    });
    expect(result.bulkPrices![2]).toEqual({
      minQty: 10,
      maxQty: undefined,
      unitPrice: 1100,
      label: "10+ unités",
    });
  });

  it("maps variant availability from real stock data", () => {
    const result = mapApiProductToProduct(BASE_API_PRODUCT);
    expect(result.variants).toHaveLength(1); // 1 option group: Poids
    expect(result.variants![0].name).toBe("Poids");
    expect(result.variants![0].options).toHaveLength(3);

    // 250g: in stock
    expect(result.variants![0].options[0].value).toBe("250g");
    expect(result.variants![0].options[0].available).toBe(true);

    // 500g: in stock
    expect(result.variants![0].options[1].value).toBe("500g");
    expect(result.variants![0].options[1].available).toBe(true);

    // 1kg: out of stock
    expect(result.variants![0].options[2].value).toBe("1kg");
    expect(result.variants![0].options[2].available).toBe(false);
  });

  it("handles missing optional fields gracefully", () => {
    const minimal: ApiProductDetail = {
      ...BASE_API_PRODUCT,
      brand: null,
      category: null,
      seller: null,
      bulkPrices: [],
      options: [],
      variants: [],
      seo: undefined,
    };
    const result = mapApiProductToProduct(minimal);
    expect(result.vendorName).toBe("");
    expect(result.categoryName).toBe("");
    expect(result.bulkPrices).toBeUndefined();
    expect(result.variants).toBeUndefined();
  });

  it("sets promoPrice when compare_at_price > price", () => {
    const result = mapApiProductToProduct(BASE_API_PRODUCT);
    expect(result.promoPrice).toBe(1500); // price when compare_at > price
  });

  it("sets promoPrice undefined when no discount", () => {
    const noDiscount: ApiProductDetail = {
      ...BASE_API_PRODUCT,
      pricing: { ...BASE_API_PRODUCT.pricing, compare_at_price: null },
    };
    const result = mapApiProductToProduct(noDiscount);
    expect(result.promoPrice).toBeUndefined();
  });
});

// ─── mapApiRelatedToListItem ─────────────────────────────────

describe("mapApiRelatedToListItem", () => {
  it("maps related product correctly", () => {
    const related: ApiRelatedProduct = {
      id: 5,
      slug: "oranges-navel",
      name: "Oranges Navel",
      image: { url: "/oranges.jpg", alt: "Oranges" },
      pricing: {
        currency: "F",
        price: 1800,
        compare_at_price: 2500,
        discount_percent: 28,
        unit_label: "/Qty",
        formatted: "1 800 F",
        formatted_compare: "2 500 F",
      },
      rating: { avg: 4.8, count: 256 },
      in_stock: true,
      seller: { name: "Saveurs d'Afrique", slug: "saveurs-dafrique" },
    };

    const result = mapApiRelatedToListItem(related);
    expect(result.id).toBe(5);
    expect(result.slug).toBe("oranges-navel");
    expect(result.name).toBe("Oranges Navel");
    expect(result.price).toBe(1800);
    expect(result.originalPrice).toBe(2500);
    expect(result.thumbnail).toBe("/oranges.jpg");
    expect(result.rating).toBe(4.8);
    expect(result.reviewCount).toBe(256);
    expect(result.vendorName).toBe("Saveurs d'Afrique");
    expect(result.stock).toBe(10); // in_stock = true → 10
  });

  it("handles out-of-stock related product", () => {
    const related: ApiRelatedProduct = {
      id: 6,
      slug: "mangues",
      name: "Mangues",
      image: { url: "/mangues.jpg", alt: "Mangues" },
      pricing: {
        currency: "F",
        price: 2000,
        compare_at_price: null,
        discount_percent: 0,
        unit_label: "/Qty",
        formatted: "2 000 F",
      },
      rating: { avg: 0, count: 0 },
      in_stock: false,
      seller: null,
    };

    const result = mapApiRelatedToListItem(related);
    expect(result.stock).toBe(0); // out of stock
    expect(result.vendorName).toBe("");
  });
});
