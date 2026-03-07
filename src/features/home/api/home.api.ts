/**
 * Home API — fetches real homepage data from https://api.mysugu.com
 *
 * Endpoints consumed:
 * - GET /api/v1/banners/slots/{key}       → Banners (hero, top-banners, deals)
 * - GET /api/v1/categories/featured       → Category pills
 * - GET /api/v1/home/brands?limit=12      → Brand logos
 * - GET /api/v1/home/recommended          → Trending / recommended products (with tabs)
 * - GET /api/v1/home/hot-deals?limit=10   → Hot deals + countdown
 * - GET /api/v1/home/product-lists?limit=6 → 3 columns + deal of week
 * - GET /api/v1/home/daily-best-sells     → Daily best sells + promo banner
 * - POST /api/v1/cart/items               → Add to cart
 * - POST /api/v1/public/newsletter/subscribe → Newsletter subscribe
 *
 * All fetches go through the central `api` client from `@/lib/api`.
 * Zod schemas validate all responses.
 */

import { api, v1Url, publicUrl, CacheTags, RevalidatePresets } from "@/lib/api";
import {
  BannerSlotResponseSchema,
  CategoriesResponseSchema,
  BrandsResponseSchema,
  RecommendedResponseSchema,
  HotDealsResponseSchema,
  ProductListsResponseSchema,
  DailyBestSellsResponseSchema,
  CartAddResponseSchema,
  NewsletterSubscribeResponseSchema,
  type ApiBannerItem,
  type ApiCategory,
  type ApiBrand,
  type ApiRecommendedTab,
  type ApiRecommendedProduct,
  type ApiHotDealItem,
  type ApiProductListItem,
  type ApiDealOfWeekProduct,
  type ApiDailyBestSellItem,
} from "./home.schemas";

// ─── Banner Slot Fetch ───────────────────────────────────────

export async function fetchBannerSlot(slotKey: string): Promise<ApiBannerItem[]> {
  try {
    const { data } = await api.get(
      v1Url(`banners/slots/${encodeURIComponent(slotKey)}`),
      {
        schema: BannerSlotResponseSchema,
        revalidate: RevalidatePresets.frequent,
        tags: [CacheTags.homeBanners(), CacheTags.homeSections()],
        skipCredentials: true,
      }
    );
    return data.items;
  } catch (error) {
    console.error(`[Home] Failed to fetch banner slot "${slotKey}":`, (error as Error).message);
    return [];
  }
}

// ─── Categories Fetch ────────────────────────────────────────

export async function fetchFeaturedCategories(): Promise<ApiCategory[]> {
  try {
    const { data } = await api.get(v1Url("categories/featured"), {
      schema: CategoriesResponseSchema,
      revalidate: RevalidatePresets.static,
      tags: [CacheTags.categories(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return data.data.categories;
  } catch (error) {
    console.error("[Home] Failed to fetch featured categories:", (error as Error).message);
    return [];
  }
}

export async function fetchAllCategories(): Promise<ApiCategory[]> {
  try {
    const { data } = await api.get(v1Url("categories"), {
      schema: CategoriesResponseSchema,
      revalidate: RevalidatePresets.static,
      tags: [CacheTags.categories(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return data.data.categories;
  } catch (error) {
    console.error("[Home] Failed to fetch categories:", (error as Error).message);
    return [];
  }
}

// ─── Brands Fetch ────────────────────────────────────────────

export async function fetchHomeBrands(limit = 12): Promise<ApiBrand[]> {
  try {
    const { data } = await api.get(v1Url("home/brands", { limit }), {
      schema: BrandsResponseSchema,
      revalidate: RevalidatePresets.standard,
      tags: [CacheTags.brands(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return data.items;
  } catch (error) {
    console.error("[Home] Failed to fetch brands:", (error as Error).message);
    return [];
  }
}

// ─── Recommended / Trending Fetch ────────────────────────────

export interface RecommendedResult {
  tabs: ApiRecommendedTab[];
  products: ApiRecommendedProduct[];
}

export async function fetchRecommended(
  category = "all",
  limit = 12
): Promise<RecommendedResult> {
  try {
    const { data } = await api.get(
      v1Url("home/recommended", { category, limit }),
      {
        schema: RecommendedResponseSchema,
        revalidate: RevalidatePresets.frequent,
        tags: [CacheTags.products(), CacheTags.homeSections()],
        skipCredentials: true,
      }
    );
    return { tabs: data.tabs, products: data.items };
  } catch (error) {
    console.error("[Home] Failed to fetch recommended:", (error as Error).message);
    return { tabs: [{ label: "All", slug: "all" }], products: [] };
  }
}

// ─── Hot Deals Fetch ─────────────────────────────────────────

export interface HotDealsResult {
  banner: {
    badge_label?: string | null;
    title?: string | null;
    subtitle?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    image_url?: string | null;
    thumb_url?: string | null;
  } | null;
  countdown: {
    ends_at?: string | null;
    server_now?: string | null;
  } | null;
  items: ApiHotDealItem[];
}

export async function fetchHotDeals(limit = 10): Promise<HotDealsResult> {
  try {
    const { data } = await api.get(v1Url("home/hot-deals", { limit }), {
      schema: HotDealsResponseSchema,
      revalidate: 60, // Short revalidation since deals are time-sensitive
      tags: [CacheTags.products(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return {
      banner: data.banner ?? null,
      countdown: data.countdown ?? null,
      items: data.items,
    };
  } catch (error) {
    console.error("[Home] Failed to fetch hot deals:", (error as Error).message);
    return { banner: null, countdown: null, items: [] };
  }
}

// ─── Product Lists Fetch (3 columns + deal of week) ──────────

export interface ProductListsResult {
  featured: { title: string; items: ApiProductListItem[] };
  topSelling: { title: string; items: ApiProductListItem[] };
  onSale: { title: string; items: ApiProductListItem[] };
  dealOfWeek: {
    title?: string;
    subtitle?: string | null;
    product: ApiDealOfWeekProduct | null;
  } | null;
}

export async function fetchProductLists(limit = 6): Promise<ProductListsResult> {
  try {
    const { data } = await api.get(v1Url("home/product-lists", { limit }), {
      schema: ProductListsResponseSchema,
      revalidate: RevalidatePresets.frequent,
      tags: [CacheTags.products(), CacheTags.homeSections()],
      skipCredentials: true,
    });
    return {
      featured: data.lists.featured,
      topSelling: data.lists.top_selling,
      onSale: data.lists.on_sale,
      dealOfWeek: data.deal_of_week
        ? {
            title: data.deal_of_week.title,
            subtitle: data.deal_of_week.subtitle,
            product: data.deal_of_week.product ?? null,
          }
        : null,
    };
  } catch (error) {
    console.error("[Home] Failed to fetch product lists:", (error as Error).message);
    return {
      featured: { title: "Produits Vedettes", items: [] },
      topSelling: { title: "Meilleures Ventes", items: [] },
      onSale: { title: "En Promotion", items: [] },
      dealOfWeek: null,
    };
  }
}

// ─── Daily Best Sells Fetch ──────────────────────────────────

export interface DailyBestSellsResult {
  items: ApiDailyBestSellItem[];
  promoBanner: {
    logo_url?: string | null;
    title?: string | null;
    subtitle?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    bg_image_url?: string | null;
  } | null;
}

export async function fetchDailyBestSells(limit = 6): Promise<DailyBestSellsResult> {
  try {
    const { data } = await api.get(
      v1Url("home/daily-best-sells", { limit }),
      {
        schema: DailyBestSellsResponseSchema,
        revalidate: 60,
        tags: [CacheTags.products(), CacheTags.homeSections()],
        skipCredentials: true,
      }
    );
    return {
      items: data.items,
      promoBanner: data.promo_banner ?? null,
    };
  } catch (error) {
    console.error("[Home] Failed to fetch daily best sells:", (error as Error).message);
    return { items: [], promoBanner: null };
  }
}

// ─── Cart Add (Mutation) ─────────────────────────────────────

export interface AddToCartParams {
  product_id: string | number;
  qty?: number;
  variant_id?: string | number;
}

export interface AddToCartResult {
  success: boolean;
  message?: string;
  warnings?: string[];
}

export async function addToCart(params: AddToCartParams): Promise<AddToCartResult> {
  try {
    // Import cart token utilities (lazy to avoid circular deps)
    const { saveCartToken, withCartTokenHeader } = await import(
      "@/features/cart/api/cart-token"
    );

    const { data } = await api.post(v1Url("cart/items"), {
      body: {
        product_id: String(params.product_id),
        qty: params.qty ?? 1,
        ...(params.variant_id ? { variant_id: String(params.variant_id) } : {}),
      },
      schema: CartAddResponseSchema,
      headers: withCartTokenHeader(),
      revalidate: 0,
    });

    // Persist cart token so subsequent requests (GET /cart) find the right cart
    const meta = data.meta as Record<string, unknown> | undefined;
    if (meta?.cart_token && typeof meta.cart_token === "string") {
      saveCartToken(meta.cart_token);
    }

    return {
      success: data.success,
      message: data.message,
      warnings: data.warnings ?? [],
    };
  } catch (error) {
    console.error("[Cart] Add to cart failed:", (error as Error).message);
    return {
      success: false,
      message: (error as Error).message || "Erreur lors de l'ajout au panier.",
    };
  }
}

// ─── Newsletter Subscribe ────────────────────────────────────

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { data } = await api.post(publicUrl("newsletter/subscribe"), {
      body: { email },
      schema: NewsletterSubscribeResponseSchema,
      revalidate: 0,
    });
    return {
      success: data.success ?? true,
      message: data.message,
    };
  } catch (error) {
    console.error("[Newsletter] Subscribe failed:", (error as Error).message);
    return {
      success: false,
      message: (error as Error).message || "Erreur lors de l'abonnement.",
    };
  }
}
