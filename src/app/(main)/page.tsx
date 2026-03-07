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
import { createMetadata } from "@/lib/metadata";
import { SITE_NAME, SITE_URL, SEO } from "@/lib/constants";
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
} from "@/features/home";
import { queryFeaturedProducts } from "@/features/product";

export const metadata = createMetadata({
  title: "Accueil",
  description:
    "Découvrez des milliers de produits au meilleur prix sur Sugu. Livraison rapide, paiement sécurisé.",
  path: "/",
});

/**
 * ISR floor — the page is revalidated at most every 60 seconds.
 *
 * This is a safety net: individual queries already carry their own
 * `next: { revalidate }` values (60–600 s), but this route-level export
 * makes the ISR intent explicit and prevents accidental opt-out.
 */
export const revalidate = 60;

/**
 * Home page — Server Component with ISR + parallel data fetching.
 *
 * All data is fetched in parallel via Promise.all for maximum performance.
 * Interactive sections (carousel, tabs, timer) receive SSR data as props
 * and don't refetch on the client.
 *
 * Cache strategy:
 * - Categories: static (10 min) + tag "categories"
 * - Banners: frequent (2 min) + tag "home-banners"
 * - Products: frequent (2 min) + tag "products"
 * - Hot deals: short (1 min) + tag "products"
 * - Trust badges: infinite (static data)
 */
export default async function Home() {
  // ─── Data fetching (SSR) — all requests in parallel ─────────
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
  ]);

  // ─── JSON-LD structured data for SEO ────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SEO.defaultDescription,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.svg`,
      },
    },
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hidden h1 for SEO — the visual header is in the hero section */}
      <h1 className="sr-only">
        Sugu — Votre marketplace en ligne au Burkina Faso
      </h1>

      {/* SECTION 1+2: Top Banners + Hero */}
      <HeroBanners slides={bannerSlides} heroBanner={heroBanner} />

      {/* SECTION 3: Category Pills */}
      <CategoryBar categories={categoryPills} />

      {/* SECTION 4: Promo Cards Carousel */}
      <FreshCategories categories={freshCategories} />

      {/* SECTION 5: Best Seller */}
      <BestSeller products={bestSellerProducts} />

      {/* SECTION 5b: Promotional Deal Banners (with timer) */}
      <PromotionalDeals deals={promotionalDeals} />

      {/* SECTION 6: Trending Store Favorites (with tabs) */}
      <TrendingStores tags={trendingTags} products={trendingProducts} />

      {/* SECTION 6b: Products + Deal Card */}
      <OrderNowBanner products={orderNowProducts} dealCard={dailyDealCard} />

      {/* SECTION 7: 4 Columns (Vedettes, Ventes, Promo, Weekly) */}
      <TrendingStoresSecond
        produitsVedettes={produitsVedettes}
        meilleuresVentes={meilleuresVentes}
        enPromotion={enPromotion}
        weeklyDeal={weeklyDeal}
      />

      {/* SECTION 8: Shop by Brands */}
      <ShopByBrands brands={brands} />

      {/* SECTION 9: Daily Best Sales */}
      <DailyBestSales products={dailyBestSaleProducts} />
    </>
  );
}
