/**
 * Cache Tags & Invalidation — centralized caching strategy.
 *
 * All cache tag definitions and invalidation helpers live here.
 * This ensures consistent tag naming and prevents typo-based cache bugs.
 *
 * NOTE: `revalidateTag` is imported dynamically to avoid breaking client
 * components that transitively import this module via the `@/lib/api` barrel.
 * `next/cache` is server-only and causes a build error if imported at the
 * top level of a module reachable from `"use client"` components.
 */

// ─── Tag Definitions ─────────────────────────────────────────

/** Cache tag builders — always use these, never raw strings */
export const CacheTags = {
  /** Public (SSR/ISR cacheable) */
  categories: () => "categories" as const,
  homeSections: () => "home-sections" as const,
  homeBanners: () => "home-banners" as const,
  products: () => "products" as const,
  product: (idOrSlug: string) => `product:${idOrSlug}` as const,
  category: (slug: string) => `category:${slug}` as const,
  categoryProducts: (slug: string) => `category:${slug}:products` as const,
  brands: () => "brands" as const,
  blogPosts: () => "blog-posts" as const,
  blogPost: (slug: string) => `blog-post:${slug}` as const,
  blogCategories: () => "blog-categories" as const,
  cmsPage: (slug: string) => `cms-page:${slug}` as const,
  faqs: () => "faqs" as const,
  branding: () => "branding" as const,
  vendors: () => "vendors" as const,
  store: (slug: string) => `store:${slug}` as const,
  storeProducts: (slug: string) => `store:${slug}:products` as const,
  storeReviews: (slug: string) => `store:${slug}:reviews` as const,
  search: (query: string) => `search:${query}` as const,
  searchPopular: () => "search:popular" as const,
  header: () => "header" as const,

  /** User-specific (no ISR cache — fetched fresh per request) */
  cart: () => "cart" as const,
  wishlist: () => "wishlist" as const,
  account: () => "account" as const,
  orders: () => "orders" as const,
  order: (id: string) => `order:${id}` as const,
  addresses: () => "addresses" as const,
  notifications: () => "notifications" as const,
} as const;

// ─── Revalidation Helpers ────────────────────────────────────

/**
 * Invalidate a single cache tag (server-side only).
 *
 * Uses dynamic `import("next/cache")` so this module can be safely
 * imported from client components without triggering a build error.
 */
export async function invalidateTag(tag: string): Promise<void> {
  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(tag, "default");
  } catch {
    // revalidateTag throws in client context — safe to ignore
    console.warn(`[Cache] Cannot invalidate tag "${tag}" outside server context.`);
  }
}

/** Invalidate multiple cache tags at once */
export async function invalidateTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    await invalidateTag(tag);
  }
}

// ─── Revalidation Presets ────────────────────────────────────

/** Revalidation times in seconds, by data type */
export const RevalidatePresets = {
  /** Static-ish data that rarely changes (categories, branding) */
  static: 600,
  /** Semi-dynamic public data (products list, blog) */
  standard: 300,
  /** Frequently updated data (home sections, banners) */
  frequent: 120,
  /** User-specific data — no caching */
  none: 0,
  /** Never revalidate automatically (only via tag) */
  infinite: false as const,
} as const;
