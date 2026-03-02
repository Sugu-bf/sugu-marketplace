/**
 * Tests for buildBackendParams mapping.
 */
import { describe, it, expect } from "vitest";
import { buildBackendParams, SEARCH_PER_PAGE } from "../utils/buildBackendParams";
import { DEFAULT_SEARCH_STATE } from "../utils/queryState";
import type { SearchQueryState } from "../api/search.types";

describe("buildBackendParams", () => {
  it("returns minimal params for default state", () => {
    const params = buildBackendParams(DEFAULT_SEARCH_STATE);
    expect(params).toEqual({ per_page: SEARCH_PER_PAGE });
  });

  it("maps q to search", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, q: "fruits" });
    expect(params.search).toBe("fruits");
  });

  it("maps categories[0] to category_slug", () => {
    const params = buildBackendParams({
      ...DEFAULT_SEARCH_STATE,
      categories: ["fruits-legumes", "viande"],
    });
    expect(params.category_slug).toBe("fruits-legumes");
  });

  it("maps price_min/max", () => {
    const params = buildBackendParams({
      ...DEFAULT_SEARCH_STATE,
      price_min: 1000,
      price_max: 5000,
    });
    expect(params.min_price).toBe(1000);
    expect(params.max_price).toBe(5000);
  });

  it("maps rating_min", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, rating_min: 4 });
    expect(params.rating_min).toBe(4);
  });

  it("maps in_stock", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, in_stock: true });
    expect(params.in_stock).toBe(true);
  });

  it("maps sort (non-default)", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, sort: "price_asc" });
    expect(params.sort).toBe("price_asc");
  });

  it("does not include sort for default (relevance)", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, sort: "relevance" });
    expect(params.sort).toBeUndefined();
  });

  it("includes page when > 1", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, page: 3 });
    expect(params.page).toBe(3);
  });

  it("does not include page for page 1", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, page: 1 });
    expect(params.page).toBeUndefined();
  });

  it("does not include null price values", () => {
    const params = buildBackendParams({
      ...DEFAULT_SEARCH_STATE,
      price_min: null,
      price_max: null,
    });
    expect(params.min_price).toBeUndefined();
    expect(params.max_price).toBeUndefined();
  });

  it("does not include null rating_min", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, rating_min: null });
    expect(params.rating_min).toBeUndefined();
  });

  it("does not include in_stock when false", () => {
    const params = buildBackendParams({ ...DEFAULT_SEARCH_STATE, in_stock: false });
    expect(params.in_stock).toBeUndefined();
  });

  it("always sets per_page", () => {
    const params = buildBackendParams(DEFAULT_SEARCH_STATE);
    expect(params.per_page).toBe(SEARCH_PER_PAGE);
  });

  it("handles full state", () => {
    const state: SearchQueryState = {
      q: "mangues",
      categories: ["fruits"],
      price_min: 500,
      price_max: 3000,
      rating_min: 3,
      in_stock: true,
      sort: "newest",
      view: "list",
      page: 2,
    };
    const params = buildBackendParams(state);
    expect(params).toEqual({
      search: "mangues",
      category_slug: "fruits",
      min_price: 500,
      max_price: 3000,
      rating_min: 3,
      in_stock: true,
      sort: "newest",
      per_page: SEARCH_PER_PAGE,
      page: 2,
    });
  });
});
