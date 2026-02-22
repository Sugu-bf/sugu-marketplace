import { MockHomeService } from "../services/home-service";
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

/**
 * Query functions for homepage data.
 * These are the ONLY entry points the page should use.
 * When API is ready → swap MockHomeService for ApiHomeService here.
 */

const homeService = new MockHomeService();

export async function queryBannerSlides(): Promise<BannerSlide[]> {
  return homeService.getBannerSlides();
}

export async function queryHeroBanner(): Promise<HeroBanner> {
  return homeService.getHeroBanner();
}

export async function queryCategoryPills(): Promise<CategoryPill[]> {
  return homeService.getCategoryPills();
}

export async function queryFreshCategories(): Promise<FreshCategory[]> {
  return homeService.getFreshCategories();
}

export async function queryPromotionalDeals(): Promise<PromotionalDeal[]> {
  return homeService.getPromotionalDeals();
}

export async function queryTrendingTags(): Promise<Tag[]> {
  return homeService.getTrendingTags();
}

export async function queryTrendingProducts(): Promise<ProductListItem[]> {
  return homeService.getTrendingProducts();
}

export async function queryOrderNowProducts(): Promise<ProductListItem[]> {
  return homeService.getOrderNowProducts();
}

export async function queryDailyDealCard(): Promise<DailyDealCard> {
  return homeService.getDailyDealCard();
}

export async function queryBrands(): Promise<Brand[]> {
  return homeService.getBrands();
}

export async function queryDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]> {
  return homeService.getDailyBestSaleProducts();
}

export async function queryProduitsVedettes(): Promise<ProductColumnItem[]> {
  return homeService.getProduitsVedettes();
}

export async function queryMeilleuresVentes(): Promise<ProductColumnItem[]> {
  return homeService.getMeilleuresVentes();
}

export async function queryEnPromotion(): Promise<ProductColumnItem[]> {
  return homeService.getEnPromotion();
}

export async function queryWeeklyDeal(): Promise<WeeklyDeal> {
  return homeService.getWeeklyDeal();
}

export async function queryTrustBadges(): Promise<TrustBadge[]> {
  return homeService.getTrustBadges();
}
