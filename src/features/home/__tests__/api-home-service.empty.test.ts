/**
 * P0-17 (audit 2026-10-29): when the API had nothing (or failed), the home
 * page served mock products, deals, brands and a "5 000 F de réduction sur
 * votre première commande" offer nobody honours, cached by ISR and the CDN;
 * the trust strip of every page promised free delivery everywhere, a 24/7
 * support and "100 % satisfaction".
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/home/api/home.api", () => ({
  fetchBannerSlot: vi.fn(async () => []),
  fetchFeaturedCategories: vi.fn(async () => []),
  fetchAllCategories: vi.fn(async () => []),
  fetchHomeBrands: vi.fn(async () => []),
  fetchRecommended: vi.fn(async () => ({ tabs: [], products: [] })),
  fetchHotDeals: vi.fn(async () => ({ banner: null, countdown: null, items: [] })),
  fetchProductLists: vi.fn(async () => ({
    featured: { title: "Produits Vedettes", items: [] },
    topSelling: { title: "Meilleures Ventes", items: [] },
    onSale: { title: "En Promotion", items: [] },
    dealOfWeek: null,
  })),
  fetchDailyBestSells: vi.fn(async () => ({ items: [], promoBanner: null })),
}));

import { ApiHomeService } from "../services/api-home-service";
import { TRUST_BADGES } from "../content/trust-badges";

describe("home page without API content", () => {
  const service = new ApiHomeService();

  it("returns empty lists, never stand-in products or banners", async () => {
    const lists = await Promise.all([
      service.getBannerSlides(),
      service.getCategoryPills(),
      service.getFreshCategories(),
      service.getPromotionalDeals(),
      service.getTrendingTags(),
      service.getTrendingProducts(),
      service.getOrderNowProducts(),
      service.getBrands(),
      service.getDailyBestSaleProducts(),
      service.getProduitsVedettes(),
      service.getMeilleuresVentes(),
      service.getEnPromotion(),
    ]);

    for (const list of lists) {
      expect(list).toEqual([]);
    }
  });

  it("returns no card, so no offer is made up", async () => {
    expect(await service.getHeroBanner()).toBeNull();
    expect(await service.getDailyDealCard()).toBeNull();
    expect(await service.getDailyBestSalesPromo()).toBeNull();
    expect(await service.getWeeklyDeal()).toBeNull();
  });
});

describe("trust badges", () => {
  it("promise nothing the marketplace does not do, and give the support address only", () => {
    const text = JSON.stringify(TRUST_BADGES);

    expect(text).not.toMatch(/gratuit|24\s?\/\s?7|100\s?%|satisfaction/i);
    expect(text).not.toMatch(/\+226|contact@sugu\.pro/);
    expect(text).toContain("support@sugu.pro");
  });
});
