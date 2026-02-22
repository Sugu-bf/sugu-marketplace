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
 * Home Repository — contract for homepage data.
 * Implementations: MockHomeService (now), ApiHomeService (later).
 */
export interface HomeRepository {
  getBannerSlides(): Promise<BannerSlide[]>;
  getHeroBanner(): Promise<HeroBanner>;
  getCategoryPills(): Promise<CategoryPill[]>;
  getFreshCategories(): Promise<FreshCategory[]>;
  getPromotionalDeals(): Promise<PromotionalDeal[]>;
  getTrendingTags(): Promise<Tag[]>;
  getTrendingProducts(): Promise<ProductListItem[]>;
  getOrderNowProducts(): Promise<ProductListItem[]>;
  getDailyDealCard(): Promise<DailyDealCard>;
  getBrands(): Promise<Brand[]>;
  getDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]>;
  getProduitsVedettes(): Promise<ProductColumnItem[]>;
  getMeilleuresVentes(): Promise<ProductColumnItem[]>;
  getEnPromotion(): Promise<ProductColumnItem[]>;
  getWeeklyDeal(): Promise<WeeklyDeal>;
  getTrustBadges(): Promise<TrustBadge[]>;
}
