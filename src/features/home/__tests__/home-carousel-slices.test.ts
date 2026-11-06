/**
 * The home carousels read consecutive slices of the recommended list. They
 * used to request the same list, so "Sélection du jour", "Favoris des
 * boutiques" and "Commander" showed the same first products three times.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchRecommended: vi.fn<(...args: unknown[]) => Promise<{ tabs: never[]; products: never[] }>>(
    async () => ({ tabs: [], products: [] }),
  ),
  fetchHotDeals: vi.fn<(...args: unknown[]) => Promise<{ banner: null; countdown: null; items: never[] }>>(
    async () => ({ banner: null, countdown: null, items: [] }),
  ),
}));

vi.mock("@/features/home/api/home.api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/home/api/home.api")>()),
  fetchRecommended: mocks.fetchRecommended,
  fetchHotDeals: mocks.fetchHotDeals,
}));

import { HOME_RECOMMENDED_SLICES } from "../api/home.api";
import { ApiHomeService } from "../services/api-home-service";
import { queryFeaturedProducts } from "@/features/product/queries/product-queries";

describe("home carousels", () => {
  beforeEach(() => {
    mocks.fetchRecommended.mockClear();
    mocks.fetchHotDeals.mockClear();
  });

  it("each read their own slice of the recommended list", async () => {
    const service = new ApiHomeService();

    await queryFeaturedProducts(HOME_RECOMMENDED_SLICES.bestSeller.limit);
    await service.getTrendingProducts();
    await service.getOrderNowProducts();

    expect(mocks.fetchRecommended.mock.calls).toEqual([
      ["all", 6, 0],
      ["all", 6, 6],
      ["all", 4, 12],
    ]);
  });

  it("slices follow one another without overlap", () => {
    const slices = Object.values(HOME_RECOMMENDED_SLICES).sort((a, b) => a.offset - b.offset);

    expect(slices[0]!.offset).toBe(0);
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i]!.offset).toBe(slices[i - 1]!.offset + slices[i - 1]!.limit);
    }
  });

  it("ask for the one hot deal the page shows", async () => {
    const service = new ApiHomeService();

    await service.getPromotionalDeals();
    await service.getDailyDealCard();

    expect(mocks.fetchHotDeals.mock.calls).toEqual([[1], [1]]);
  });
});
