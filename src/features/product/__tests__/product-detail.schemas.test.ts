/**
 * Tests — Product Detail API Schemas.
 *
 * Validates that Zod schemas correctly parse real-world API responses 
 * and reject malformed data.
 */

import { describe, it, expect } from "vitest";
import {
  ProductDetailResponseSchema,
  RelatedProductsResponseSchema,
  ReviewsResponseSchema,
  CartResponseSchema,
  WishlistResponseSchema,
  CartCountResponseSchema,
  ApiProductDetailSchema,
} from "../api/product-detail.schemas";

// ─── Fixtures ────────────────────────────────────────────────

const MOCK_API_PRODUCT = {
  id: "01HXYZ123",
  slug: "tomates-bio-500g",
  name: "Tomates Bio 500g",
  sku: "TOM-BIO-500",
  brand: { id: 1, name: "Bio Farm", slug: "bio-farm" },
  category: { id: 5, name: "Fruits & Légumes", slug: "fruits-legumes" },
  short_description: "Tomates bio cultivées localement",
  description_html: "<p>Tomates bio cultivées localement, 100% naturelles.</p>",
  media: {
    images: [
      { url: "https://cdn.sugu.pro/products/tomates.jpg", alt: "Tomates bio" },
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
    { id: 1, minQty: 5, price: 1300, currency: "XOF", isActive: true },
    { id: 2, minQty: 10, price: 1100, currency: "XOF", isActive: true },
  ],
  stock: {
    in_stock: true,
    quantity_available: 50,
    low_stock: false,
  },
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
      sku: "TOM-BIO-250",
      option_values: { Poids: "250g" },
      pricing: {
        price: 800,
        compare_at_price: null,
        formatted: "800 F",
        formatted_compare: null,
      },
      stock: { in_stock: true, quantity: 30 },
      image_url: null,
    },
    {
      id: 101,
      sku: "TOM-BIO-500",
      option_values: { Poids: "500g" },
      pricing: {
        price: 1500,
        compare_at_price: 2000,
        formatted: "1 500 F",
        formatted_compare: "2 000 F",
      },
      stock: { in_stock: true, quantity: 50 },
      image_url: null,
    },
    {
      id: 102,
      sku: "TOM-BIO-1KG",
      option_values: { Poids: "1kg" },
      pricing: {
        price: 2800,
        compare_at_price: null,
        formatted: "2 800 F",
        formatted_compare: null,
      },
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
    title: "Tomates Bio 500g | Sugu",
    description: "Tomates bio cultivées localement",
    canonical: "/product/tomates-bio-500g",
  },
};

// ─── ProductDetailResponseSchema ─────────────────────────────

describe("ProductDetailResponseSchema", () => {
  it("validates a correct product detail response", () => {
    const response = { success: true, product: MOCK_API_PRODUCT };
    const result = ProductDetailResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("rejects when success is false", () => {
    const response = { success: false, product: MOCK_API_PRODUCT };
    const result = ProductDetailResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("rejects when product is missing", () => {
    const response = { success: true };
    const result = ProductDetailResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it("validates product without optional fields", () => {
    const minimal = {
      id: 1,
      slug: "test",
      name: "Test",
      media: { images: [{ url: "/test.jpg" }] },
      pricing: { currency: "F", price: 100, discount_percent: 0, formatted: "100 F" },
      stock: { in_stock: true, quantity_available: 10 },
      rating: { avg: 0, count: 0 },
    };
    const result = ApiProductDetailSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bulkPrices).toEqual([]);
      expect(result.data.variants).toEqual([]);
      expect(result.data.options).toEqual([]);
      expect(result.data.sku).toBe("");
    }
  });

  it("accepts variant.option_values as empty array (PHP quirk)", () => {
    // PHP serializes empty associative arrays as [] instead of {}
    const productWithArrayOptionValues = {
      ...MOCK_API_PRODUCT,
      variants: [
        {
          id: 100,
          sku: "SKU-001",
          option_values: [],  // <-- PHP sends [] for empty assoc array
          pricing: { price: 800, compare_at_price: null, formatted: "800 F", formatted_compare: null },
          stock: { in_stock: true, quantity: 30 },
          image_url: null,
        },
      ],
    };
    const result = ProductDetailResponseSchema.safeParse({ success: true, product: productWithArrayOptionValues });
    expect(result.success).toBe(true);
    if (result.success) {
      // Normalized to empty Record
      expect(result.data.product.variants[0].option_values).toEqual({});
    }
  });

  it("accepts variant.option_values as object (normal case)", () => {
    const productWithObjectOptionValues = {
      ...MOCK_API_PRODUCT,
      variants: [
        {
          id: 100,
          sku: "SKU-001",
          option_values: { Poids: "500g", Couleur: "Rouge" },
          pricing: { price: 800, compare_at_price: null, formatted: "800 F", formatted_compare: null },
          stock: { in_stock: true, quantity: 30 },
          image_url: null,
        },
      ],
    };
    const result = ProductDetailResponseSchema.safeParse({ success: true, product: productWithObjectOptionValues });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product.variants[0].option_values).toEqual({ Poids: "500g", Couleur: "Rouge" });
    }
  });
});

// ─── RelatedProductsResponseSchema ───────────────────────────

describe("RelatedProductsResponseSchema", () => {
  it("validates a correct related products response", () => {
    const response = {
      success: true,
      items: [
        {
          id: 1,
          slug: "oranges",
          name: "Oranges",
          image: { url: "/oranges.jpg", alt: "Oranges" },
          pricing: {
            currency: "F",
            price: 1800,
            compare_at_price: null,
            discount_percent: 0,
            formatted: "1 800 F",
          },
          rating: { avg: 4.8, count: 256 },
          in_stock: true,
          seller: { name: "Saveurs d'Afrique", slug: "saveurs-dafrique" },
        },
      ],
    };
    const result = RelatedProductsResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("validates empty items array", () => {
    const result = RelatedProductsResponseSchema.safeParse({ success: true, items: [] });
    expect(result.success).toBe(true);
  });
});

// ─── ReviewsResponseSchema ───────────────────────────────────

describe("ReviewsResponseSchema", () => {
  it("validates a correct reviews response", () => {
    const response = {
      success: true,
      reviews: [
        {
          id: 1,
          rating: 5,
          title: "Excellent",
          body: "Très bon produit",
          is_verified_purchase: true,
          helpful_count: 3,
          author: "Aminata K.",
          images: [],
          created_at: "2026-02-15T10:00:00Z",
        },
      ],
      meta: {
        total: 128,
        limit: 10,
        next_cursor: null,
        has_more: false,
      },
    };
    const result = ReviewsResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ─── CartResponseSchema ──────────────────────────────────────

describe("CartResponseSchema", () => {
  it("validates a correct cart response", () => {
    const response = {
      success: true,
      data: {
        items: [
          { id: 1, variant_id: 101, qty: 2 },
        ],
        totals: { subtotal: 3000, total: 3000 },
      },
      warnings: [],
    };
    const result = CartResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("validates cart with warnings", () => {
    const response = {
      success: true,
      data: {
        items: [],
        totals: {},
      },
      warnings: ["Stock ajusté pour un article"],
    };
    const result = CartResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toEqual(["Stock ajusté pour un article"]);
    }
  });
});

// ─── CartCountResponseSchema ─────────────────────────────────

describe("CartCountResponseSchema", () => {
  it("validates a correct cart count response", () => {
    const result = CartCountResponseSchema.safeParse({
      success: true,
      data: { qty_total: 5, item_count: 2 },
    });
    expect(result.success).toBe(true);
  });
});

// ─── WishlistResponseSchema ──────────────────────────────────

describe("WishlistResponseSchema", () => {
  it("validates a correct wishlist response", () => {
    const result = WishlistResponseSchema.safeParse({
      success: true,
      data: {
        items: [
          { id: 1, variant_id: 101, product_id: "01HXYZ123" },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});
