/**
 * Search category facets (audit 2026-10-29, catalogue low findings).
 *
 * The facets were the category names, slugified here into something that is
 * not always the category slug: picking "Mode & Beauté" filtered on
 * "mode-beaute" while the category is "mode-et-beaute". The backend now
 * sends the real slug. The price stats object of the facets also made the
 * whole response fail validation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSearchResults } from "../api/search.api";
import { DEFAULT_SEARCH_STATE } from "../utils/queryState";

const fetchMock = vi.fn();

function webProducts(facets: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        products: [
          {
            id: "01JB8Z5K3M4N5P6Q7R8S9T0V1W",
            name: "Pagne",
            slug: "pagne",
            price: 15000,
            primary_category: { name: "Mode & Beauté", slug: "mode-et-beaute" },
          },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 24, total: 1, from: 1, to: 1 },
        facets,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("search category facets", () => {
  it("use the category slug sent by the API, next to the price stats", async () => {
    fetchMock.mockResolvedValue(
      webProducts({
        category: [{ value: "mode-et-beaute", count: 3, label: "Mode & Beauté" }],
        category_name: [{ value: "Mode & Beauté", count: 3, label: "Mode & Beauté" }],
        price: { min: 1000, max: 20000, avg: 9000 },
      }),
    );

    const result = await fetchSearchResults({ ...DEFAULT_SEARCH_STATE, q: "pagne" });

    expect(result.categoryFacets).toEqual([{ slug: "mode-et-beaute", name: "Mode & Beauté", count: 3 }]);
  });

  it("fall back to the slugs of the listed products, not to their names", async () => {
    fetchMock.mockResolvedValue(webProducts([]));

    const result = await fetchSearchResults(DEFAULT_SEARCH_STATE);

    expect(result.categoryFacets).toEqual([{ slug: "mode-et-beaute", name: "Mode & Beauté", count: 1 }]);
  });
});
