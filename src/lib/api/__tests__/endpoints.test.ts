/**
 * Tests for lib/api/endpoints.ts — URL builders & querystring
 */
import { describe, it, expect } from "vitest";
import {
  buildQueryString,
  buildApiUrl,
  publicUrl,
  meUrl,
  v1Url,
  paginationParams,
} from "@/lib/api/endpoints";

describe("buildQueryString", () => {
  it("should build simple key-value pairs", () => {
    const qs = buildQueryString({ page: 1, per_page: 20 });
    expect(qs).toBe("page=1&per_page=20");
  });

  it("should skip null and undefined values", () => {
    const qs = buildQueryString({ q: "test", category: null, brand: undefined });
    expect(qs).toBe("q=test");
  });

  it("should handle boolean values", () => {
    const qs = buildQueryString({ in_stock: true, featured: false });
    expect(qs).toBe("in_stock=true&featured=false");
  });

  it("should handle array values with [] suffix", () => {
    const qs = buildQueryString({ categories: ["electronics", "clothing"] });
    expect(qs).toContain("categories%5B%5D=electronics");
    expect(qs).toContain("categories%5B%5D=clothing");
  });

  it("should handle number arrays", () => {
    const qs = buildQueryString({ ids: [1, 2, 3] });
    expect(qs).toContain("ids%5B%5D=1");
    expect(qs).toContain("ids%5B%5D=2");
    expect(qs).toContain("ids%5B%5D=3");
  });

  it("should return empty string for empty params", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("should return empty string when all values are null/undefined", () => {
    expect(buildQueryString({ a: null, b: undefined })).toBe("");
  });
});

describe("buildApiUrl", () => {
  it("should build full URL with base", () => {
    const url = buildApiUrl("/api/v1/public/categories");
    expect(url).toContain("/api/v1/public/categories");
    expect(url).toContain("api.mysugu.com");
  });

  it("should normalize path with missing leading slash", () => {
    const url = buildApiUrl("api/v1/public/products");
    expect(url).toContain("/api/v1/public/products");
  });

  it("should append query params", () => {
    const url = buildApiUrl("/api/v1/public/products", { page: 1, per_page: 20 });
    expect(url).toContain("?page=1&per_page=20");
  });

  it("should not add ? when no params", () => {
    const url = buildApiUrl("/api/v1/test");
    expect(url).not.toContain("?");
  });

  it("should not add ? when all params are null", () => {
    const url = buildApiUrl("/api/v1/test", { a: null, b: undefined });
    expect(url).not.toContain("?");
  });
});

describe("publicUrl", () => {
  it("should prefix with /v1/public/", () => {
    const url = publicUrl("marketplace-config");
    expect(url).toContain("/api/v1/public/marketplace-config");
  });

  it("should strip leading slash from path", () => {
    const url = publicUrl("/categories");
    expect(url).toContain("/api/v1/public/categories");
    expect(url).not.toContain("/api/v1/public//categories");
  });
});

describe("meUrl", () => {
  it("should prefix with /v1/me/", () => {
    const url = meUrl("profile");
    expect(url).toContain("/api/v1/me/profile");
  });
});

describe("v1Url", () => {
  it("should prefix with /v1/", () => {
    const url = v1Url("categories");
    expect(url).toContain("/api/v1/categories");
  });
});

describe("paginationParams", () => {
  it("should return default pagination (page 1, per_page 20)", () => {
    const params = paginationParams();
    expect(params).toEqual({ page: 1, per_page: 20 });
  });

  it("should accept custom values", () => {
    const params = paginationParams({ page: 3, perPage: 50 });
    expect(params).toEqual({ page: 3, per_page: 50 });
  });
});
