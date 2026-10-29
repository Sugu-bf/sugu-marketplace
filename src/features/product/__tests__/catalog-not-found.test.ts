/**
 * P1-9 (audit 2026-10-29): a passing outage became a cached 404.
 *
 * The product and category fetchers returned null on any error, the pages
 * called notFound(), and ISR plus the CDN kept that 404 for minutes: a
 * backend restart or a schema drift took the whole catalogue down. Only a
 * 404 of the API is "not found" now; anything else throws to the error
 * boundary (and ISR keeps serving the last good page).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProductDetail } from "@/features/product/api/product-detail.api";
import { queryProductBySlug } from "@/features/product/queries/product-queries";
import { fetchCategoryDetail, fetchCategoryProducts } from "@/features/category/api/category-listing.api";
import { DEFAULT_FILTERS } from "@/features/category/utils/category-url-state";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("product detail", () => {
  it("is null when the API answers 404, and the page shows no stand-in product", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    expect(await fetchProductDetail("fraises-fraiches-bio")).toBeNull();
    expect(await queryProductBySlug("fraises-fraiches-bio")).toBeNull();
  });

  it("throws on an outage instead of answering 404", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Server Error" }, 503));

    await expect(fetchProductDetail("pagne")).rejects.toThrow();
    await expect(queryProductBySlug("pagne")).rejects.toThrow();
  });

  it("throws when the response no longer matches its schema", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { unexpected: true } }));

    await expect(fetchProductDetail("pagne")).rejects.toThrow();
  });

  it("encodes the slug in the API URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    await fetchProductDetail("../me/orders");

    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/products/..%2Fme%2Forders");
  });
});

describe("category", () => {
  it("is null when the API answers 404", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not found" }, 404));

    expect(await fetchCategoryDetail("inconnue")).toBeNull();
  });

  it("throws on an outage, for the category and for its listing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Server Error" }, 503));

    await expect(fetchCategoryDetail("mode")).rejects.toThrow();
    await expect(fetchCategoryProducts("mode", DEFAULT_FILTERS)).rejects.toThrow();
  });
});
