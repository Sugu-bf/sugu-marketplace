/**
 * API Home Service — implements HomeRepository using real backend API.
 *
 * Transforms the *actual* API response shapes (nested pricing, rating, image
 * objects) into the flat front-end domain models expected by UI components.
 *
 * No stand-in content: when the API has nothing (or fails), a list is empty
 * and a single card is null; the page leaves the section out. Mock products,
 * deals and promises were served (and cached) as real ones.
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
  DailyBestSalesPromo,
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
  ApiProductListItem as ApiProdListItem,
  ApiDailyBestSellItem,
  ApiDealOfWeekProduct,
} from "../api/home.schemas";
import { TRUST_BADGES } from "../content/trust-badges";

/** Dead / legacy paths from banners → real marketplace routes */
function resolveHomeHref(url?: string | null, fallback = "/search"): string {
  if (!url || url === "#" || url === "/deals" || url === "/shop") return fallback;
  return url;
}

// ─── Transform Helpers ───────────────────────────────────────

function bannerItemToSlide(item: ApiBannerItem, index: number): BannerSlide {
  return {
    id: Number(item.id) || index + 1,
    image: item.media?.url ?? "/banners/placeholder.png",
    alt: item.media?.alt ?? item.title ?? "Banner",
    href: resolveHomeHref(item.cta_url, "/search"),
  };
}

function bannerItemToHero(item: ApiBannerItem): HeroBanner {
  return {
    image: item.media?.url ?? "/banners/placeholder.png",
    alt: item.media?.alt ?? item.title ?? "Hero Banner",
    href: resolveHomeHref(item.cta_url, "/search"),
  };
}

function apiCategoryToPill(cat: ApiCategory, index = 0): CategoryPill {
  const iconName = typeof cat.icon === "object" && cat.icon !== null
    ? (cat.icon as { name?: string }).name ?? null
    : null;
  const defaultBgColors = ["#E8EDF3", "#EAF0E4", "#E3EEF0", "#F0EDE3", "#F0E8E3", "#E3F0EA"];
  return {
    name: cat.name,
    icon: iconName ?? "tag",
    slug: cat.slug,
    image: cat.image ?? undefined,
    bgColor: defaultBgColors[index % defaultBgColors.length],
    productCount: cat.product_count,
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
    stock: p.stock?.available ?? ((p.stock?.in_stock ?? p.in_stock) ? 1 : 0),
    sold: 0,
    vendorName: p.store?.name ?? "",
    categoryName: p.category?.name ?? "",
    hasVariants: p.has_variants,
    defaultVariantId: p.default_variant_id,
    minOrderQuantity: p.min_order_quantity,
    isInStock: p.stock?.in_stock ?? p.in_stock,
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
    hasVariants: p.has_variants,
    defaultVariantId: p.default_variant_id,
    minOrderQuantity: p.min_order_quantity,
    isInStock: p.stock?.in_stock ?? p.in_stock,
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
    hasVariants: p.has_variants,
    defaultVariantId: p.default_variant_id,
    minOrderQuantity: p.min_order_quantity,
    isInStock: p.stock?.in_stock ?? p.in_stock,
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
    return items.map(bannerItemToSlide);
  }

  async getHeroBanner(): Promise<HeroBanner | null> {
    const items = await fetchBannerSlot("marketplace.home.hero");
    return items.length > 0 ? bannerItemToHero(items[0]) : null;
  }

  async getCategoryPills(): Promise<CategoryPill[]> {
    const categories = await fetchFeaturedCategories();
    if (categories.length > 0) return categories.map(apiCategoryToPill);
    // Fallback: try all categories
    const all = await (await import("../api/home.api")).fetchAllCategories();
    return all.slice(0, 16).map(apiCategoryToPill);
  }

  async getFreshCategories(): Promise<FreshCategory[]> {
    // Fresh Categories are stored as banners in slot "marketplace.home.promotional"
    // Prefer structured meta: title_highlight (eyebrow), subtitle (category), title fallback
    const banners = await fetchBannerSlot("marketplace.home.promotional");

    const defaultBgColors = ["#E8EDF3", "#EAF0E4", "#E3EEF0", "#F0EDE3", "#F0E8E3", "#E3F0EA"];

    return banners.map((b, i) => {
      const highlight = (b.title_highlight ?? "").trim();
      const bannerTitle = (b.title ?? "").trim();
      const bannerSubtitle = (b.subtitle ?? "").trim();

      let title = "Frais Tous les Jours";
      let subtitle = bannerSubtitle || bannerTitle || "Sélection";

      if (bannerSubtitle) {
        title = highlight || bannerTitle || title;
        subtitle = bannerSubtitle;
      } else if (highlight) {
        const parts = highlight.split(/\s+/);
        if (parts.length >= 3) {
          subtitle = parts[parts.length - 1]!;
          title = parts.slice(0, -1).join(" ");
        } else {
          title = highlight;
          subtitle = bannerTitle || subtitle;
        }
      } else if (bannerTitle) {
        title = bannerTitle;
      }

      const searchFallback = `/search?q=${encodeURIComponent(subtitle)}`;

      return {
        id: Number(b.id) || i + 1,
        title,
        subtitle,
        price: b.price ?? undefined,
        image: b.media?.url ?? "/categories/placeholder.png",
        bgColor: b.bg_color ?? defaultBgColors[i % defaultBgColors.length]!,
        href: resolveHomeHref(b.cta_url, searchFallback),
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
          href: resolveHomeHref(result.banner.cta_url, "/search"),
        });
      }

      if (result.items.length > 0) {
        const firstItem = result.items[0]!;
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
          href: firstItem.product.slug
            ? `/product/${firstItem.product.slug}`
            : "/search",
        });
      }

      return deals;
    }
    return [];
  }

  async getTrendingTags(): Promise<Tag[]> {
    const result = await fetchRecommended("all", 1);
    if (result.tabs.length > 1) {
      return result.tabs.map((t) => ({ label: t.label, slug: t.slug }));
    }
    return [];
  }

  async getTrendingProducts(): Promise<ProductListItem[]> {
    const result = await fetchRecommended("all", 6);
    return result.products.map(apiRecommendedToListItem);
  }

  async getOrderNowProducts(): Promise<ProductListItem[]> {
    const result = await fetchRecommended("all", 4);
    return result.products.slice(0, 4).map(apiRecommendedToListItem);
  }

  async getDailyDealCard(): Promise<DailyDealCard | null> {
    const result = await fetchHotDeals(1);
    if (result.banner) {
      return {
        category: result.banner.badge_label ?? "Offres du jour",
        title: result.banner.title ?? "Offres du jour",
        subtitle: result.banner.subtitle ?? "",
        expiry: result.countdown?.ends_at
          ? `Expire le ${new Date(result.countdown.ends_at).toLocaleDateString("fr-FR")}`
          : "Offre limitée",
        image:
          result.banner.thumb_url ??
          result.banner.image_url ??
          "/promos/grocery-basket.png",
        href: resolveHomeHref(result.banner.cta_url, "/search"),
        ctaLabel: result.banner.cta_label ?? "Explorer la boutique",
      };
    }
    return null;
  }

  async getBrands(): Promise<Brand[]> {
    const apiBrands = await fetchHomeBrands(12);
    return apiBrands.map((b, i) => ({
      id: Number(b.id) || i + 1,
      name: b.name,
      image: b.logo?.url ?? "/brands/placeholder.png",
      href: b.slug ? `/search?brand=${encodeURIComponent(b.slug)}` : undefined,
    }));
  }

  async getDailyBestSaleProducts(): Promise<DailyBestSaleProduct[]> {
    const result = await fetchDailyBestSells(6);
    return result.items.map(apiDailyBestSellToProduct);
  }

  async getDailyBestSalesPromo(): Promise<DailyBestSalesPromo | null> {
    const result = await fetchDailyBestSells(6);
    const banner = result.promoBanner;
    if (banner?.title) {
      return {
        title: banner.title,
        subtitle: banner.subtitle ?? banner.delivery_by_text ?? "Offre limitée",
        ctaLabel: banner.cta_label ?? "Acheter maintenant",
        href: resolveHomeHref(banner.cta_url, "/search"),
        image: banner.bg_image_url ?? undefined,
      };
    }
    return null;
  }

  async getProduitsVedettes(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    return result.featured.items.map(apiProdListToColumnItem);
  }

  async getMeilleuresVentes(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    if (result.topSelling.items.length > 0) return result.topSelling.items.map(apiProdListToColumnItem);
    return [];
  }

  async getEnPromotion(): Promise<ProductColumnItem[]> {
    const result = await fetchProductLists(6);
    return result.onSale.items.map(apiProdListToColumnItem);
  }

  async getWeeklyDeal(): Promise<WeeklyDeal | null> {
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
        hasVariants: p.has_variants,
        defaultVariantId: p.default_variant_id,
        minOrderQuantity: p.min_order_quantity,
        isInStock: p.in_stock,
      };
    }
    return null;
  }

  async getTrustBadges(): Promise<TrustBadge[]> {
    return TRUST_BADGES;
  }
}
