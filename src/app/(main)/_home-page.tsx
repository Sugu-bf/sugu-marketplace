import HeroBanners from "@/components/HeroBanners";
import SmallBanners from "@/components/SmallBanners";
import CategoryBar from "@/components/CategoryBar";
import BestSeller from "@/components/BestSeller";
import TrendingStores from "@/components/TrendingStores";
import OrderNowBanner from "@/components/OrderNowBanner";
import TrendingStoresSecond from "@/components/TrendingStoresSecond";
import FreshCategories from "@/components/FreshCategories";
import PromotionalDeals from "@/components/PromotionalDeals";
import ShopByBrands from "@/components/ShopByBrands";
import DailyBestSales from "@/components/DailyBestSales";
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
  queryDailyBestSalesPromo,
  queryProduitsVedettes,
  queryMeilleuresVentes,
  queryEnPromotion,
  queryWeeklyDeal,
  HOME_RECOMMENDED_SLICES,
} from "@/features/home";
import { queryFeaturedProducts } from "@/features/product";

/**
 * Home page content — Server Component with ISR + parallel data fetching.
 *
 * Extracted into its own module so page.tsx can conditionally render
 * either this or the Coming Soon page based on an env flag.
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
 *
 * Products: the API draws them again at each rotation window (24 h by
 * default, set in the back office) and gives each section its own, so the
 * page changes from one day to the next and never shows a product twice.
 * The carousels read consecutive slices of the recommended list
 * (HOME_RECOMMENDED_SLICES). Every visitor gets the same page during a
 * window: the ISR and CDN caches stay as they are.
 *
 * A section the API has nothing for is left out: no stand-in content.
 */
export default async function HomePage() {
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
    dailyBestSalesPromo,
    produitsVedettes,
    meilleuresVentes,
    enPromotion,
    weeklyDeal,
  ] = await Promise.all([
    queryBannerSlides(),
    queryHeroBanner(),
    queryCategoryPills(),
    queryFreshCategories(),
    queryFeaturedProducts(HOME_RECOMMENDED_SLICES.bestSeller.limit),
    queryPromotionalDeals(),
    queryTrendingTags(),
    queryTrendingProducts(),
    queryOrderNowProducts(),
    queryDailyDealCard(),
    queryBrands(),
    queryDailyBestSaleProducts(),
    queryDailyBestSalesPromo(),
    queryProduitsVedettes(),
    queryMeilleuresVentes(),
    queryEnPromotion(),
    queryWeeklyDeal(),
  ]);

  return (
    <>
      {/* Hidden h1 for SEO — the visual header is in the hero section */}
      <h1 className="sr-only">
        Sugu — Votre marketplace en ligne
      </h1>

      {/* SECTION 1: Main Hero Banner */}
      {heroBanner && <HeroBanners heroBanner={heroBanner} />}

      {/* SECTION 3: Category Pills */}
      {categoryPills.length > 0 && <CategoryBar categories={categoryPills} />}

      {/* SECTION 4: Promo Cards Carousel */}
      {freshCategories.length > 0 && <FreshCategories categories={freshCategories} />}

      {/* SECTION 5: Selection of the day (first slice of the recommended list) */}
      {bestSellerProducts.length > 0 && <BestSeller products={bestSellerProducts} />}

      {/* SECTION 5b: Promotional Deal Banners (with timer) */}
      {promotionalDeals.length > 0 && <PromotionalDeals deals={promotionalDeals} />}

      {/* SECTION 6: Trending Store Favorites (with tabs) */}
      {trendingProducts.length > 0 && <TrendingStores tags={trendingTags} products={trendingProducts} />}

      {/* SECTION 6b: Products + Deal Card (Deals of the day) */}
      {(orderNowProducts.length > 0 || dailyDealCard) && (
        <OrderNowBanner products={orderNowProducts} dealCard={dailyDealCard} />
      )}

      {/* SECTION 6c: 3 Small Banners */}
      {bannerSlides.length > 0 && <SmallBanners slides={bannerSlides} />}

      {/* SECTION 7: 4 Columns (Vedettes, Ventes, Promo, Weekly Deal / Offres de la semaine) */}
      {(produitsVedettes.length > 0 || meilleuresVentes.length > 0 || enPromotion.length > 0 || weeklyDeal) && (
        <TrendingStoresSecond
          produitsVedettes={produitsVedettes}
          meilleuresVentes={meilleuresVentes}
          enPromotion={enPromotion}
          weeklyDeal={weeklyDeal}
        />
      )}

      {/* SECTION 8: Shop by Brands */}
      {brands.length > 0 && <ShopByBrands brands={brands} />}

      {/* SECTION 9: Daily Best Sales */}
      {(dailyBestSaleProducts.length > 0 || dailyBestSalesPromo) && (
        <DailyBestSales products={dailyBestSaleProducts} promo={dailyBestSalesPromo} />
      )}
    </>
  );
}
