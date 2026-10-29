/**
 * P0-5 (audit 2026-10-29): category pages showed prices 100 times too low
 * and gave every product (and category) the id 1.
 *
 * Contract: GET /api/v1/web-products answers prices in francs (major units,
 * ProductService::formatProductForSearch divides by 100) and ULID string ids.
 * The Laravel side pins the same contract in WebProductsContractTest.
 */
import { describe, it, expect } from "vitest";
import {
  mapApiCategoryToCategory,
  mapApiChildToSubcategory,
  mapApiProductsToListItems,
} from "../api/category-listing.mappers";
import { CategoryDetailApiSchema, ProductListingResponseSchema } from "../api/category-listing.schemas";
import { toSearchSuggestion } from "@/features/header/hooks/useSearchSuggestions";

const webProductsResponse = {
  success: true,
  data: {
    products: [
      {
        id: "01JB8Z5K3M4N5P6Q7R8S9T0V1W",
        name: "Pagne tissé",
        slug: "pagne-tisse",
        price: 15000,
        compare_price: 18000,
        sale_price: null,
        currency: "XOF",
        discount_percent: 17,
        thumbnail: "https://cdn.sugu.pro/s/p.png",
        avg_rating: 4,
        review_count: 2,
        total_stock: 5,
        sales_count: 1,
        store: { id: "01JB8Z5K3M4N5P6Q7R8S9T0V2X", name: "Atelier", slug: "atelier" },
        primary_category: { id: "01JB8Z5K3M4N5P6Q7R8S9T0V3Y", name: "Mode", slug: "mode" },
        images: [],
      },
      {
        id: "01JB8Z5K3M4N5P6Q7R8S9T0V4Z",
        name: "Boubou",
        slug: "boubou",
        price: 25000,
        compare_price: null,
        sale_price: 20000,
        currency: "XOF",
        images: [],
      },
    ],
    pagination: { current_page: 1, last_page: 1, per_page: 24, total: 2 },
  },
};

describe("mapApiProductsToListItems — /web-products contract", () => {
  const items = mapApiProductsToListItems(ProductListingResponseSchema.parse(webProductsResponse).data.products);

  it("keeps the prices in francs, as the API sends them", () => {
    expect(items[0].price).toBe(15000);
    expect(items[0].originalPrice).toBe(18000);
    expect(items[1].price).toBe(20000);
    expect(items[1].originalPrice).toBeUndefined();
  });

  it("keeps each product's ULID, so cart, favorites and keys address the right product", () => {
    expect(items.map((item) => item.id)).toEqual(["01JB8Z5K3M4N5P6Q7R8S9T0V1W", "01JB8Z5K3M4N5P6Q7R8S9T0V4Z"]);
  });
});

describe("category mappers", () => {
  it("keeps the category, parent and child ULIDs", () => {
    const api = CategoryDetailApiSchema.parse({
      id: "01JB8Z5K3M4N5P6Q7R8S9T0V3Y",
      slug: "mode",
      name: "Mode",
      parent: { id: "01JB8Z5K3M4N5P6Q7R8S9T0V5A", slug: "tout", name: "Tout" },
      children: [],
      product_count: 2,
    });

    const category = mapApiCategoryToCategory(api);
    const child = mapApiChildToSubcategory(
      { id: "01JB8Z5K3M4N5P6Q7R8S9T0V6B", slug: "pagnes", name: "Pagnes", product_count: 1 },
      "mode",
    );

    expect(category.id).toBe("01JB8Z5K3M4N5P6Q7R8S9T0V3Y");
    expect(category.parentId).toBe("01JB8Z5K3M4N5P6Q7R8S9T0V5A");
    expect(child.id).toBe("01JB8Z5K3M4N5P6Q7R8S9T0V6B");
  });
});

describe("header search suggestions — same /web-products contract", () => {
  it("shows the price in francs and keeps the ULID", () => {
    const suggestion = toSearchSuggestion(webProductsResponse.data.products[0]);
    expect(suggestion.price).toBe(15000);
    expect(suggestion.id).toBe("01JB8Z5K3M4N5P6Q7R8S9T0V1W");
  });
});
