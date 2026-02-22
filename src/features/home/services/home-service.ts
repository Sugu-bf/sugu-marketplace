import type { HomeRepository } from "../repositories/home-repository";
import type {
  BannerSlide,
  HeroBanner,
  CategoryPill,
  FreshCategory,
  PromotionalDeal,
  Brand,
  TrustBadge,
  DailyDealCard,
  DailyBestSaleProduct,
  WeeklyDeal,
  ProductColumnItem,
  Tag,
} from "../models/home";
import type { ProductListItem } from "@/features/product";
import {
  mockBannerSlides,
  mockHeroBanner,
  mockCategoryPills,
  mockFreshCategories,
  mockPromotionalDeals,
  mockTrendingTags,
  mockDailyDealCard,
  mockBrands,
  mockDailyBestSaleProducts,
  mockProduitsVedettes,
  mockMeilleuresVentes,
  mockEnPromotion,
  mockWeeklyDeal,
  mockTrustBadges,
} from "../mocks/home";
import { getMockProducts } from "@/features/product/mocks/products";

/**
 * Mock implementation — returns static fixture data, no network calls.
 */
export class MockHomeService implements HomeRepository {
  async getBannerSlides(): Promise<BannerSlide[]> {
    return mockBannerSlides;
  }

  async getHeroBanner(): Promise<HeroBanner> {
    return mockHeroBanner;
  }

  async getCategoryPills(): Promise<CategoryPill[]> {
    return mockCategoryPills;
  }

  async getFreshCategories(): Promise<FreshCategory[]> {
    return mockFreshCategories;
  }

  async getPromotionalDeals(): Promise<PromotionalDeal[]> {
    return mockPromotionalDeals;
  }

  async getTrendingTags(): Promise<Tag[]> {
    return mockTrendingTags;
  }

  async getTrendingProducts(): Promise<ProductListItem[]> {
    return getMockProducts(6);
  }

  async getOrderNowProducts(): Promise<ProductListItem[]> {
    return getMockProducts(4);
  }

  async getDailyDealCard(): Promise<DailyDealCard> {
    return mockDailyDealCard;
  }

  async getBrands(): Promise<Brand[]> {
    return mockBrands;
  }

  async getDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]> {
    return mockDailyBestSaleProducts;
  }

  async getProduitsVedettes(): Promise<ProductColumnItem[]> {
    return mockProduitsVedettes;
  }

  async getMeilleuresVentes(): Promise<ProductColumnItem[]> {
    return mockMeilleuresVentes;
  }

  async getEnPromotion(): Promise<ProductColumnItem[]> {
    return mockEnPromotion;
  }

  async getWeeklyDeal(): Promise<WeeklyDeal> {
    return mockWeeklyDeal;
  }

  async getTrustBadges(): Promise<TrustBadge[]> {
    return mockTrustBadges;
  }
}
