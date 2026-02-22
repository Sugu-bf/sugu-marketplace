import HeroBanners from "@/components/HeroBanners";
import CategoryBar from "@/components/CategoryBar";
import BestSeller from "@/components/BestSeller";
import TrendingStores from "@/components/TrendingStores";
import OrderNowBanner from "@/components/OrderNowBanner";
import TrendingStoresSecond from "@/components/TrendingStoresSecond";
import FreshCategories from "@/components/FreshCategories";
import PromotionalDeals from "@/components/PromotionalDeals";
import ShopByBrands from "@/components/ShopByBrands";
import DailyBestSales from "@/components/DailyBestSales";
import NewsletterAndTrust from "@/components/NewsletterAndTrust";
import { createMetadata } from "@/lib/metadata";
import {
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
} from "@/features/home";
import { queryFeaturedProducts } from "@/features/product";

export const metadata = createMetadata({
  title: "Accueil",
  description:
    "Découvrez des milliers de produits au meilleur prix sur Sugu. Livraison rapide, paiement sécurisé.",
  path: "/",
});

export default async function Home() {
  // ─── Data fetching (SSR) — all via queries, no direct mock/API access ───
  const [
    bannerSlides,
    heroBanner,
    categoryPills,
    freshCategories,
    bestSellerProducts,
    promotionalDeals,
    trendingTags,
    trendingProducts,
    orderNowProducts,
    dailyDealCard,
    brands,
    dailyBestSaleProducts,
    produitsVedettes,
    meilleuresVentes,
    enPromotion,
    weeklyDeal,
    trustBadges,
  ] = await Promise.all([
    queryBannerSlides(),
    queryHeroBanner(),
    queryCategoryPills(),
    queryFreshCategories(),
    queryFeaturedProducts(6),
    queryPromotionalDeals(),
    queryTrendingTags(),
    queryTrendingProducts(),
    queryOrderNowProducts(),
    queryDailyDealCard(),
    queryBrands(),
    queryDailyBestSaleProducts(),
    queryProduitsVedettes(),
    queryMeilleuresVentes(),
    queryEnPromotion(),
    queryWeeklyDeal(),
    queryTrustBadges(),
  ]);

  return (
    <>
      {/* Hidden h1 for SEO — the visual header is in the hero section */}
      <h1 className="sr-only">
        Sugu — Votre marketplace en ligne au Burkina Faso
      </h1>

      <HeroBanners slides={bannerSlides} heroBanner={heroBanner} />
      <CategoryBar categories={categoryPills} />
      <FreshCategories categories={freshCategories} />
      <BestSeller products={bestSellerProducts} />
      <PromotionalDeals deals={promotionalDeals} />
      <TrendingStores tags={trendingTags} products={trendingProducts} />
      <OrderNowBanner products={orderNowProducts} dealCard={dailyDealCard} />
      <TrendingStoresSecond
        produitsVedettes={produitsVedettes}
        meilleuresVentes={meilleuresVentes}
        enPromotion={enPromotion}
        weeklyDeal={weeklyDeal}
      />
      <ShopByBrands brands={brands} />
      <DailyBestSales products={dailyBestSaleProducts} />
      <NewsletterAndTrust trustBadges={trustBadges} />
    </>
  );
}
