/**
 * Tests for header API functions.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { derivePopularSearches } from "../api/header.api";
import type { HeaderCategory } from "../api/header.schemas";

describe("derivePopularSearches", () => {
  it("returns category names as popular searches", () => {
    const categories: HeaderCategory[] = [
      { id: "1", name: "Électronique", slug: "electronique" },
      { id: "2", name: "Mode", slug: "mode" },
      { id: "3", name: "Sports", slug: "sports" },
    ];

    const result = derivePopularSearches(categories);
    expect(result).toEqual(["Électronique", "Mode", "Sports"]);
  });

  it("limits to 10 popular searches", () => {
    const categories: HeaderCategory[] = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      name: `Cat ${i}`,
      slug: `cat-${i}`,
    }));

    const result = derivePopularSearches(categories);
    expect(result).toHaveLength(10);
  });

  it("returns empty array for empty categories", () => {
    expect(derivePopularSearches([])).toEqual([]);
  });
});

describe("header.schemas", () => {
  it("validates a valid HeaderCategory", async () => {
    const { HeaderCategorySchema } = await import("../api/header.schemas");
    
    const valid = {
      id: "abc123",
      name: "Électronique",
      slug: "electronique",
      description: "Gadgets et accessoires",
      image: null,
      parent_id: null,
      depth: 0,
      product_count: 42,
      icon_url: "https://cdn.sugu.pro/category-icons/abc123/icon/monitor.svg",
      children: [
        {
          id: "def456",
          name: "Smartphones",
          slug: "smartphones",
          image: "https://cdn.sugu.pro/cats/smartphones.jpg",
          parent_id: "abc123",
          depth: 1,
        },
      ],
    };

    const result = HeaderCategorySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates CartPreviewItemSchema", async () => {
    const { CartPreviewItemSchema } = await import("../api/header.schemas");

    const valid = {
      id: 1,
      product_id: "p123",
      variant_id: "v456",
      qty: 2,
      unit_price: 2500,
      compare_at_price: null,
      line_total: 5000,
      name: "Fraises Bio",
      variant_title: null,
      image: "https://cdn.sugu.pro/img.jpg",
      product_slug: "fraises-bio",
      currency: "XOF",
    };

    const result = CartPreviewItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates WishlistPreviewItemSchema", async () => {
    const { WishlistPreviewItemSchema } = await import("../api/header.schemas");

    const valid = {
      id: 1,
      product_id: "p123",
      variant_id: null,
      name: "Oranges Premium",
      product_slug: "oranges-premium",
      image: null,
      price: 1800,
      compare_at_price: 2200,
      currency: "XOF",
      available: true,
      in_stock: true,
      added_at: "2026-02-20T10:00:00Z",
    };

    const result = WishlistPreviewItemSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
