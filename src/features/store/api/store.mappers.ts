import type {
  VendorProfile,
  VendorProductCard,
  ReviewsSummary,
  VendorCategory as ApiVendorCategory,
} from "./store.schemas";
import type {
  Store,
  StoreCategory,
  StoreReview,
  RatingDistribution,
} from "../models/store";
import type { ProductListItem } from "@/features/product";

// ─── Vendor Profile → Store (UI model) ──────────────────────

/**
 * Map the API VendorProfile + ReviewsSummary → the UI `Store` type.
 * Adapts snake_case API fields to camelCase UI fields.
 */
export function mapVendorToStore(
  vendor: VendorProfile,
  reviews?: ReviewsSummary,
): Store {
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    description: vendor.description,
    logoUrl: vendor.logo.url,
    coverUrl: vendor.cover.url,
    location: vendor.location_text,
    memberSince: vendor.member_since,
    rating: vendor.rating.avg,
    reviewCount: vendor.rating.count,
    totalProducts: vendor.products_count,
    totalSales: vendor.sales_count,
    followerCount: vendor.followers_count,
    categories: vendor.categories.map(mapVendorCategory),
    ratingDistribution: reviews
      ? mapRatingDistribution(reviews.distribution)
      : { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 },
    recentReviews: reviews?.latest.map(mapLatestReview) ?? [],
    contact: {
      phone: vendor.contact.phone || undefined,
      email: vendor.contact.email || undefined,
      address: vendor.contact.address_line || undefined,
      hours: vendor.hours || undefined,
    },
  };
}

// ─── Category mapping ────────────────────────────────────────

function mapVendorCategory(cat: ApiVendorCategory): StoreCategory {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat.product_count,
    icon: cat.icon ?? undefined,
  };
}

// ─── Rating distribution mapping ─────────────────────────────

function mapRatingDistribution(
  dist: Record<string, { count: number; percentage: number }>,
): RatingDistribution {
  return {
    stars5: dist["5"]?.percentage ?? 0,
    stars4: dist["4"]?.percentage ?? 0,
    stars3: dist["3"]?.percentage ?? 0,
    stars2: dist["2"]?.percentage ?? 0,
    stars1: dist["1"]?.percentage ?? 0,
  };
}

// ─── Latest review mapping ───────────────────────────────────

function mapLatestReview(r: {
  id: string;
  rating: number;
  comment: string;
  author: string;
  date_human: string;
}): StoreReview {
  return {
    id: r.id,
    author: r.author,
    rating: r.rating,
    comment: r.comment,
    date: r.date_human,
  };
}

// ─── Product Card → ProductListItem (UI model) ──────────────

/**
 * Map the API VendorProductCard → the UI `ProductListItem` type.
 * Handles the pricing/image structure differences.
 */
export function mapVendorProductToListItem(
  item: VendorProductCard,
  vendorName: string,
): ProductListItem {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: Math.round(item.pricing.price / 100),
    originalPrice: item.pricing.compare_at_price ? Math.round(item.pricing.compare_at_price / 100) : undefined,
    thumbnail: item.image.url,
    rating: item.rating.avg ?? 0,
    reviewCount: item.rating.count ?? 0,
    stock: item.in_stock ? 999 : 0, // backend doesn't expose exact stock
    sold: item.sold.qty,
    vendorName,
    categoryName: "", // Not returned by BFF — acceptable
  };
}
