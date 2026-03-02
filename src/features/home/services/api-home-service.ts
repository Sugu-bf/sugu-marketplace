/**
 * API Home Service — implements HomeRepository using real backend API.
 *
 * Transforms the *actual* API response shapes (nested pricing, rating, image
 * objects) into the flat front-end domain models expected by UI components.
 *
 * Fallback strategy: if API returns empty or fails → mock data is served.
 */

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
  fetchBannerSlot,
  fetchFeaturedCategories,
  fetchHomeBrands,
  fetchRecommended,
  fetchHotDeals,
  fetchProductLists,
  fetchDailyBestSells,
} from "../api/home.api";
import type {
  ApiBannerItem,
  ApiCategory,
  ApiRecommendedProduct,
  ApiHotDealItem,
  ApiProductListItem as ApiProdListItem,
  ApiDailyBestSellItem,
  ApiDealOfWeekProduct,
} from "../api/home.schemas";
// ─── Fallback mock data (used only on API failure) ───────────
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

// ─── Transform Helpers ───────────────────────────────────────

function bannerItemToSlide(item: ApiBannerItem, index: number): BannerSlide {
  return {
    id: Number(item.id) || index + 1,
    image: item.media?.url ?? "/banners/placeholder.png",
    alt: item.media?.alt ?? item.title ?? "Banner",
    href: item.cta_url ?? undefined,
  };
}

function bannerItemToHero(item: ApiBannerItem): HeroBanner {
  return {
    image: item.media?.url ?? "/banners/placeholder.png",
    alt: item.media?.alt ?? item.title ?? "Hero Banner",
    href: item.cta_url ?? undefined,
  };
}

// emoji lookup for category slugs/names
const categoryEmojis: Record<string, string> = {
  pain: "🍞", fromage: "🧀", boissons: "🍷", yaourt: "🥛",
  fruits: "🍎", pasteque: "🍉", snacks: "🍿", gateau: "🎂",
  bonbons: "🍬", legumes: "🥬", agrumes: "🍊", surgeles: "🧊",
  viande: "🥩", "fruits-de-mer": "🦐", boulangerie: "🥐", jus: "🥤",
  lait: "🥛", poisson: "🐟", riz: "🍚", huile: "🫒",
  epicerie: "🛒", bebe: "👶", beaute: "💄", "beaute-sante": "💄",
  maison: "🏠", electronique: "📱", mode: "👕", sport: "⚽",
  bureau: "📎", informatique: "💻", telephone: "📞",
  smartphones: "📱", accessoires: "🎧",
};

function categoryToEmoji(slug: string, name: string, iconName?: string | null): string {
  // Try icon name mapping first
  const iconEmojis: Record<string, string> = {
    sparkles: "✨", shirt: "👕", cpu: "📱", shopping_bag: "🛍️",
    home: "🏠", heart: "❤️", baby: "👶", book: "📚",
  };
  if (iconName && iconEmojis[iconName]) return iconEmojis[iconName];

  // Try slug
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z-]/g, "");
  if (categoryEmojis[normalizedSlug]) return categoryEmojis[normalizedSlug];

  // Try partial name match
  const normalizedName = name.toLowerCase();
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (normalizedName.includes(key)) return emoji;
  }
  return "📦";
}

function apiCategoryToPill(cat: ApiCategory): CategoryPill {
  const iconName = typeof cat.icon === "object" && cat.icon !== null
    ? (cat.icon as { name?: string }).name ?? null
    : null;
  return {
    name: cat.name,
    emoji: categoryToEmoji(cat.slug, cat.name, iconName),
    slug: cat.slug,
  };
}

/**
 * Transform recommended product (nested API shape) → flat ProductListItem.
 * API shape: { id, name, image:{url,alt}, pricing:{price,...}, rating:{avg,count}, store, category }
 */
function apiRecommendedToListItem(p: ApiRecommendedProduct): ProductListItem {
  return {
    id: String(p.id),
    slug: p.slug || "",
    name: p.name,
    price: Math.round((p.pricing?.price ?? 0) / 100),
    originalPrice: p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined,
    discount: undefined,
    thumbnail: p.image?.url ?? "/products/placeholder.png",
    rating: p.rating?.avg ?? 0,
    reviewCount: p.rating?.count ?? 0,
    stock: p.in_stock ? 10 : 0,
    sold: 0,
    vendorName: p.store?.name ?? "",
    categoryName: p.category?.name ?? "",
  };
}

/**
 * Transform hot-deal item (nested product wrapper) → flat ProductListItem.
 * API shape: { deal_id, product:{id,name,image}, pricing:{price,...}, rating, store, sold_qty, total_qty }
 */
function apiHotDealToListItem(p: ApiHotDealItem): ProductListItem {
  return {
    id: String(p.product.id),
    slug: p.product.slug || "",
    name: p.product.name,
    price: Math.round((p.pricing?.price ?? 0) / 100),
    originalPrice: p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined,
    discount: undefined,
    thumbnail: p.product.image?.url ?? "/products/placeholder.png",
    rating: p.rating?.avg ?? 0,
    reviewCount: p.rating?.count ?? 0,
    stock: p.total_qty ?? 0,
    sold: p.sold_qty ?? 0,
    vendorName: p.store?.name ?? "",
    categoryName: "",
  };
}

/**
 * Transform product-list item (nested API) → ProductColumnItem.
 * API shape: { id, name, image:{url,alt}, pricing:{price, compare_at_price}, rating:{avg, count} }
 */
function apiProdListToColumnItem(p: ApiProdListItem): ProductColumnItem {
  return {
    id: String(p.id),
    slug: p.slug || undefined,
    name: p.name,
    price: Math.round((p.pricing?.price ?? 0) / 100),
    originalPrice: p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined,
    rating: p.rating?.avg ?? 0,
    reviews: p.rating?.count ?? 0,
    image: p.image?.url ?? undefined,
  };
}

/**
 * Transform daily-best-sell item (nested product wrapper) → DailyBestSaleProduct.
 * API shape: { deal_id, discount_percent, sold_qty, total_qty,
 *              product:{id,name,image}, store:{name}, pricing:{price,...}, rating }
 */
function apiDailyBestSellToProduct(p: ApiDailyBestSellItem): DailyBestSaleProduct {
  const price = Math.round((p.pricing?.price ?? 0) / 100);
  const compareAt = p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined;
  return {
    id: String(p.product.id),
    slug: p.product.slug || undefined,
    name: p.product.name,
    price,
    originalPrice: compareAt ?? price,
    rating: p.rating?.avg ?? 0,
    reviews: p.rating?.count ?? 0,
    store: p.store?.name ?? "Sugu Store",
    soldCount: p.sold_qty ?? 0,
    totalStock: p.total_qty ?? 0,
    promoPercent: p.discount_percent ?? undefined,
    image: p.product.image?.url ?? undefined,
  };
}

// ─── Compute countdown from ISO 8601 dates ───────────────────

function computeCountdown(endsAt?: string | null, serverNow?: string | null) {
  if (!endsAt) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const end = new Date(endsAt).getTime();
  const now = serverNow ? new Date(serverNow).getTime() : Date.now();
  const diff = Math.max(0, end - now);

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// ─── ApiHomeService ──────────────────────────────────────────

export class ApiHomeService implements HomeRepository {
  async getBannerSlides(): Promise<BannerSlide[]> {
    const items = await fetchBannerSlot("marketplace.home.top");
    if (items.length > 0) return items.map(bannerItemToSlide);
    return mockBannerSlides;
  }

  async getHeroBanner(): Promise<HeroBanner> {
    const items = await fetchBannerSlot("marketplace.home.hero");
    if (items.length > 0) return bannerItemToHero(items[0]);
    return mockHeroBanner;
  }

  async getCategoryPills(): Promise<CategoryPill[]> {
    const categories = await fetchFeaturedCategories();
    if (categories.length > 0) return categories.map(apiCategoryToPill);
    // Fallback: try all categories
    const all = await (await import("../api/home.api")).fetchAllCategories();
    if (all.length > 0) return all.slice(0, 16).map(apiCategoryToPill);
    return mockCategoryPills;
  }

  async getFreshCategories(): Promise<FreshCategory[]> {
    // Fresh Categories are stored as banners in slot "marketplace.home.promotional"
    // Each banner has meta: { title_highlight, price, bg_color, desktop_url, position }
    const banners = await fetchBannerSlot("marketplace.home.promotional");
    if (banners.length === 0) return mockFreshCategories;

    const defaultBgColors = ["#E8EDF3", "#EAF0E4", "#E3EEF0", "#F0EDE3", "#F0E8E3", "#E3F0EA"];

    return banners.map((b, i) => {
      // title_highlight contains something like "Everyday Fresh Meat"
      // title contains the same or similar — split into title + subtitle
      const highlight = b.title_highlight ?? b.title ?? "";
      const parts = highlight.split(/\s+/);
      // If title_highlight looks like "Everyday Fresh Meat", split at last word as subtitle
      // Otherwise use the full banner title as subtitle
      let title = "Everyday Fresh";
      let subtitle = b.title ?? highlight;

      if (parts.length >= 3) {
        // e.g. "Everyday Fresh Meat" → title="Everyday Fresh", subtitle="Meat"
        // or "Daily Fresh Vegetables" → title="Daily Fresh", subtitle="Vegetables"
        subtitle = parts[parts.length - 1];
        title = parts.slice(0, -1).join(" ");
      }

      return {
        id: Number(b.id) || i + 1,
        title,
        subtitle,
        price: b.price ?? undefined,
        image: b.media?.url ?? "/categories/placeholder.png",
        bgColor: b.bg_color ?? defaultBgColors[i % defaultBgColors.length],
        href: b.cta_url ?? undefined,
      };
    });
  }

  async getPromotionalDeals(): Promise<PromotionalDeal[]> {
    const result = await fetchHotDeals(2);
    if (result.items.length > 0 || result.banner) {
      const countdown = computeCountdown(
        result.countdown?.ends_at,
        result.countdown?.server_now
      );

      const deals: PromotionalDeal[] = [];

      if (result.banner) {
        // Prefer thumb_url (product thumbnail) over image_url (decorative shape)
        const bannerImage =
          result.banner.thumb_url ?? result.banner.image_url ?? "/promos/pasta.png";
        deals.push({
          id: 1,
          title: result.banner.title ?? "Offres du jour",
          subtitle: result.banner.subtitle ?? "Temps restant jusqu'à la fin de l'offre.",
          image: bannerImage,
          variant: "light",
          countdown,
          href: result.banner.cta_url ?? undefined,
        });
      }

      if (result.items.length > 0) {
        const firstItem = result.items[0];
        // Use real image if available, skip generic fallback-product.png
        const rawImage = firstItem.product.image?.url;
        const productImage =
          rawImage && !rawImage.includes("fallback-product")
            ? rawImage
            : "/promos/vegetables.png";
        deals.push({
          id: 2,
          title: firstItem.product.name,
          subtitle: "Temps restant jusqu'à la fin de l'offre.",
          image: productImage,
          variant: "dark",
          countdown,
          href: firstItem.product.slug ? `/product/${firstItem.product.slug}` : undefined,
        });
      }

      if (deals.length > 0) return deals;
    }
    return mockPromotionalDeals;
  }

  async getTrendingTags(): Promise<Tag[]> {
    const result = await fetchRecommended("all", 1);
    if (result.tabs.length > 1) {
      return result.tabs.map((t) => ({ label: t.label, slug: t.slug }));
    }
    return mockTrendingTags;
  }

  async getTrendingProducts(): Promise<ProductListItem[]> {
    const result = await fetchRecommended("all", 6);
    if (result.products.length > 0) return result.products.map(apiRecommendedToListItem);
    return getMockProducts(6);
  }

  async getOrderNowProducts(): Promise<ProductListItem[]> {
    const result = await fetchRecommended("all", 4);
    if (result.products.length > 0) return result.products.slice(0, 4).map(apiRecommendedToListItem);
    return getMockProducts(4);
  }

  async getDailyDealCard(): Promise<DailyDealCard> {
    const result = await fetchHotDeals(1);
    if (result.banner) {
      return {
        category: result.banner.badge_label ?? "Offres du jour",
        title: "Deals of the day",
        subtitle: result.banner.subtitle ?? "Save up to 50% off on your first order",
        expiry: result.countdown?.ends_at
          ? `Expire le ${new Date(result.countdown.ends_at).toLocaleDateString("fr-FR")}`
          : "Offre limitée",
        image: result.banner.thumb_url ?? result.banner.image_url ?? "/promos/grocery-basket.png",
        href: result.banner.cta_url ?? undefined,
      };
    }
    return mockDailyDealCard;
  }

  async getBrands(): Promise<Brand[]> {
    const apiBrands = await fetchHomeBrands(12);
    if (apiBrands.length > 0) {
      return apiBrands.map((b, i) => ({
        id: Number(b.id) || i + 1,
        name: b.name,
        image: b.logo?.url ?? "/brands/placeholder.png",
        href: b.slug ? `/search?brand=${b.slug}` : undefined,
      }));
    }
    console.warn("[Home] Brands API returned empty — using fallback mock brands");
    return mockBrands;
  }

  async getDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]> {
    const result = await fetchDailyBestSells(6);
    if (result.items.length > 0) return result.items.map(apiDailyBestSellToProduct);
    return mockDailyBestSaleProducts;
  }

  async getProduitsVedettes(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    if (result.featured.items.length > 0) return result.featured.items.map(apiProdListToColumnItem);
    return mockProduitsVedettes;
  }

  async getMeilleuresVentes(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    if (result.topSelling.items.length > 0) return result.topSelling.items.map(apiProdListToColumnItem);
    // Fallback: use featured products (real DB data) instead of mock when top_selling is empty
    if (result.featured.items.length > 0) return result.featured.items.map(apiProdListToColumnItem);
    return mockMeilleuresVentes;
  }

  async getEnPromotion(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    if (result.onSale.items.length > 0) return result.onSale.items.map(apiProdListToColumnItem);
    return mockEnPromotion;
  }

  async getWeeklyDeal(): Promise<WeeklyDeal> {
    const result = await fetchProductLists(6);
    if (result.dealOfWeek?.product) {
      const p = result.dealOfWeek.product as ApiDealOfWeekProduct;
      return {
        id: String(p.id),
        slug: p.slug || undefined,
        name: p.name,
        price: Math.round((p.pricing?.price ?? 0) / 100),
        originalPrice: p.pricing?.compare_at_price ? Math.round(p.pricing.compare_at_price / 100) : undefined,
        rating: p.rating?.avg ?? 5,
        reviews: p.rating?.count ?? 0,
        image: p.image?.url ?? undefined,
      };
    }
    return mockWeeklyDeal;
  }

  async getTrustBadges(): Promise<TrustBadge[]> {
    return mockTrustBadges;
  }
}
