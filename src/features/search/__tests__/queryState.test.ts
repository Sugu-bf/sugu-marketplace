/**
 * Tests for search query state parse/serialize (DRY URL state).
 */
import { describe, it, expect } from "vitest";
import {
  parseSearchParams,
  serializeSearchState,
  buildSearchPath,
  sanitizeQuery,
  DEFAULT_SEARCH_STATE,
} from "../utils/queryState";
import type { SearchQueryState } from "../api/search.types";

// ─── sanitizeQuery ──────────────────────────────────────────

describe("sanitizeQuery", () => {
  it("trims whitespace", () => {
    expect(sanitizeQuery("  hello  ")).toBe("hello");
  });

  it("collapses multiple spaces", () => {
    expect(sanitizeQuery("hello   world")).toBe("hello world");
  });

  it("removes control characters", () => {
    expect(sanitizeQuery("hello\x00world")).toBe("helloworld");
  });

  it("caps at max length", () => {
    const long = "a".repeat(300);
    expect(sanitizeQuery(long).length).toBe(200);
  });

  it("handles empty string", () => {
    expect(sanitizeQuery("")).toBe("");
  });
});

// ─── parseSearchParams ──────────────────────────────────────

describe("parseSearchParams", () => {
  it("returns default state for empty params", () => {
    expect(parseSearchParams({})).toEqual(DEFAULT_SEARCH_STATE);
  });

  it("parses q correctly", () => {
    const state = parseSearchParams({ q: " Fruits Bio " });
    expect(state.q).toBe("Fruits Bio");
  });

  it("parses categories (comma-separated)", () => {
    const state = parseSearchParams({ categories: "fruits,legumes,viande" });
    expect(state.categories).toEqual(["fruits", "legumes", "viande"]);
  });

  it("parses price_min and price_max", () => {
    const state = parseSearchParams({ price_min: "1000", price_max: "5000" });
    expect(state.price_min).toBe(1000);
    expect(state.price_max).toBe(5000);
  });

  it("parses rating_min (1-5 only)", () => {
    expect(parseSearchParams({ rating_min: "3" }).rating_min).toBe(3);
    expect(parseSearchParams({ rating_min: "0" }).rating_min).toBeNull();
    expect(parseSearchParams({ rating_min: "6" }).rating_min).toBeNull();
    expect(parseSearchParams({ rating_min: "abc" }).rating_min).toBeNull();
  });

  it("parses in_stock", () => {
    expect(parseSearchParams({ in_stock: "1" }).in_stock).toBe(true);
    expect(parseSearchParams({ in_stock: "true" }).in_stock).toBe(true);
    expect(parseSearchParams({ in_stock: "false" }).in_stock).toBe(false);
    expect(parseSearchParams({}).in_stock).toBe(false);
  });

  it("parses sort (valid values only)", () => {
    expect(parseSearchParams({ sort: "price_asc" }).sort).toBe("price_asc");
    expect(parseSearchParams({ sort: "invalid" }).sort).toBe("relevance");
    expect(parseSearchParams({}).sort).toBe("relevance");
  });

  it("parses view mode", () => {
    expect(parseSearchParams({ view: "list" }).view).toBe("list");
    expect(parseSearchParams({ view: "grid" }).view).toBe("grid");
    expect(parseSearchParams({ view: "table" }).view).toBe("grid");
  });

  it("parses page (valid range)", () => {
    expect(parseSearchParams({ page: "3" }).page).toBe(3);
    expect(parseSearchParams({ page: "0" }).page).toBe(1);
    expect(parseSearchParams({ page: "-1" }).page).toBe(1);
    expect(parseSearchParams({ page: "abc" }).page).toBe(1);
  });

  it("handles invalid price gracefully", () => {
    expect(parseSearchParams({ price_min: "abc" }).price_min).toBeNull();
    expect(parseSearchParams({ price_min: "-100" }).price_min).toBeNull();
  });
});

// ─── serializeSearchState ───────────────────────────────────

describe("serializeSearchState", () => {
  it("omits page=1 (canonical)", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test", page: 1 });
    expect(params.has("page")).toBe(false);
  });

  it("includes page > 1", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test", page: 3 });
    expect(params.get("page")).toBe("3");
  });

  it("omits default sort (relevance)", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test" });
    expect(params.has("sort")).toBe(false);
  });

  it("includes non-default sort", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test", sort: "price_asc" });
    expect(params.get("sort")).toBe("price_asc");
  });

  it("omits default view (grid)", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test" });
    expect(params.has("view")).toBe(false);
  });

  it("includes list view", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, q: "test", view: "list" });
    expect(params.get("view")).toBe("list");
  });

  it("omits empty/null/default values", () => {
    const params = serializeSearchState(DEFAULT_SEARCH_STATE);
    expect(params.toString()).toBe("");
  });

  it("serializes categories as comma-separated", () => {
    const params = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      categories: ["fruits", "legumes"],
    });
    expect(params.get("categories")).toBe("fruits,legumes");
  });

  it("serializes in_stock as 1", () => {
    const params = serializeSearchState({ ...DEFAULT_SEARCH_STATE, in_stock: true });
    expect(params.get("in_stock")).toBe("1");
  });

  it("keys are in alphabetical order", () => {
    const params = serializeSearchState({
      ...DEFAULT_SEARCH_STATE,
      q: "test",
      sort: "newest",
      in_stock: true,
      categories: ["a"],
    });
    const keys = Array.from(params.keys());
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

// ─── buildSearchPath ────────────────────────────────────────

describe("buildSearchPath", () => {
  it("returns /search for default state", () => {
    expect(buildSearchPath(DEFAULT_SEARCH_STATE)).toBe("/search");
  });

  it("builds path with query", () => {
    const path = buildSearchPath({ ...DEFAULT_SEARCH_STATE, q: "fruits frais" });
    expect(path).toContain("/search?");
    expect(path).toContain("q=fruits+frais");
  });

  it("roundtrips: parse(serialize(state)) ≈ state", () => {
    const original: SearchQueryState = {
      q: "mangues",
      categories: ["fruits"],
      price_min: 1000,
      price_max: 5000,
      rating_min: 3,
      in_stock: true,
      sort: "price_asc",
      view: "list",
      page: 2,
    };

    const params = serializeSearchState(original);
    const obj: Record<string, string | undefined> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    const parsed = parseSearchParams(obj);

    expect(parsed).toEqual(original);
  });
});
