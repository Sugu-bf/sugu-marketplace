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
  DailyBestSalesPromo,
  WeeklyDeal,
  ProductColumnItem,
  Tag,
} from "../models/home";

import type { ProductListItem } from "@/features/product";

/**
 * Home Repository — contract for homepage data.
 * Implementation: ApiHomeService. A single card is null when the API has none.
 */
export interface HomeRepository {
  getBannerSlides(): Promise<BannerSlide[]>;
  getHeroBanner(): Promise<HeroBanner | null>;
  getCategoryPills(): Promise<CategoryPill[]>;
  getFreshCategories(): Promise<FreshCategory[]>;
  getPromotionalDeals(): Promise<PromotionalDeal[]>;
  getTrendingTags(): Promise<Tag[]>;
  getTrendingProducts(): Promise<ProductListItem[]>;
  getOrderNowProducts(): Promise<ProductListItem[]>;
  getDailyDealCard(): Promise<DailyDealCard | null>;
  getBrands(): Promise<Brand[]>;
  getDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]>;
  getDailyBestSalesPromo(): Promise<DailyBestSalesPromo | null>;
  getProduitsVedettes(): Promise<ProductColumnItem[]>;
  getMeilleuresVentes(): Promise<ProductColumnItem[]>;
  getEnPromotion(): Promise<ProductColumnItem[]>;
  getWeeklyDeal(): Promise<WeeklyDeal | null>;
  getTrustBadges(): Promise<TrustBadge[]>;
}
