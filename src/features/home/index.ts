// ─── Models ──────────────────────────────────────────────────
export type {
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
  Countdown,
} from "./models/home";

// ─── Queries ─────────────────────────────────────────────────
export {
  queryBannerSlides,
  queryHeroBanner,
  queryCategoryPills,
  queryFreshCategories,
  queryPromotionalDeals,
  queryTrendingTags,
  queryTrendingProducts,
  queryOrderNowProducts,
  queryDailyDealCard,
  queryBrands,
  queryDailyBestSaleProducts,
  queryProduitsVedettes,
  queryMeilleuresVentes,
  queryEnPromotion,
  queryWeeklyDeal,
  queryTrustBadges,
} from "./queries/home-queries";

// ─── API Functions (for client-side use) ─────────────────────
export {
  addToCart,
  subscribeNewsletter,
  fetchRecommended,
} from "./api/home.api";
export type { AddToCartParams, AddToCartResult } from "./api/home.api";
