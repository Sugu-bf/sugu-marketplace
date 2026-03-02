import { ApiHomeService } from "../services/api-home-service";
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
 *
 * Production: uses ApiHomeService (real API → https://api.mysugu.com)
 * Fallback: each API call falls back to mock data on failure.
 *
 * Cache strategy documented in each function.
 */

const homeService = new ApiHomeService();

/**
 * Top banner slides (3 cards).
 * Cache: frequent (2 min) — banners change moderately.
 */
export async function queryBannerSlides(): Promise<BannerSlide[]> {
  return homeService.getBannerSlides();
}

/**
 * Hero banner (single large image).
 * Cache: frequent (2 min) — same cache as banner slides.
 */
export async function queryHeroBanner(): Promise<HeroBanner> {
  return homeService.getHeroBanner();
}

/**
 * Category pills (emoji chips).
 * Cache: static (10 min) — categories rarely change.
 */
export async function queryCategoryPills(): Promise<CategoryPill[]> {
  return homeService.getCategoryPills();
}

/**
 * Fresh category promo cards (4 cards with prices).
 * Cache: static — uses mock data (no dedicated API endpoint).
 */
export async function queryFreshCategories(): Promise<FreshCategory[]> {
  return homeService.getFreshCategories();
}

/**
 * Promotional deal banners with countdown.
 * Cache: short (1 min) — time-sensitive deals.
 */
export async function queryPromotionalDeals(): Promise<PromotionalDeal[]> {
  return homeService.getPromotionalDeals();
}

/**
 * Trending tags/tabs for filter chips.
 * Cache: frequent (2 min) — derived from recommended tabs.
 */
export async function queryTrendingTags(): Promise<Tag[]> {
  return homeService.getTrendingTags();
}

/**
 * Trending products grid (6 items).
 * Cache: frequent (2 min) — from recommended endpoint.
 */
export async function queryTrendingProducts(): Promise<ProductListItem[]> {
  return homeService.getTrendingProducts();
}

/**
 * Products for the "Order Now" section (4 items).
 * Cache: frequent (2 min) — from recommended endpoint.
 */
export async function queryOrderNowProducts(): Promise<ProductListItem[]> {
  return homeService.getOrderNowProducts();
}

/**
 * Daily deal sidebar card.
 * Cache: short (1 min) — from hot-deals endpoint.
 */
export async function queryDailyDealCard(): Promise<DailyDealCard> {
  return homeService.getDailyDealCard();
}

/**
 * Brand logos for "Shop by Brands" carousel.
 * Cache: standard (5 min) — brands rarely change.
 */
export async function queryBrands(): Promise<Brand[]> {
  return homeService.getBrands();
}

/**
 * Daily best sale products (6 items + progress bars).
 * Cache: short (1 min) — stock counts change frequently.
 */
export async function queryDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]> {
  return homeService.getDailyBestSaleProducts();
}

/**
 * "Produits Vedettes" column (6 compact items).
 * Cache: frequent (2 min) — from product-lists endpoint.
 */
export async function queryProduitsVedettes(): Promise<ProductColumnItem[]> {
  return homeService.getProduitsVedettes();
}

/**
 * "Meilleures Ventes" column (6 compact items).
 * Cache: frequent (2 min) — from product-lists endpoint.
 */
export async function queryMeilleuresVentes(): Promise<ProductColumnItem[]> {
  return homeService.getMeilleuresVentes();
}

/**
 * "En Promotion" column (6 compact items).
 * Cache: frequent (2 min) — from product-lists endpoint.
 */
export async function queryEnPromotion(): Promise<ProductColumnItem[]> {
  return homeService.getEnPromotion();
}

/**
 * Weekly deal feature product.
 * Cache: frequent (2 min) — from product-lists endpoint.
 */
export async function queryWeeklyDeal(): Promise<WeeklyDeal> {
  return homeService.getWeeklyDeal();
}

/**
 * Trust badges (static content, no API needed).
 * Cache: infinite — never changes.
 */
export async function queryTrustBadges(): Promise<TrustBadge[]> {
  return homeService.getTrustBadges();
}
