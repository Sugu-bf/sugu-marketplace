/**
 * Category Listing — mappers from API shapes to existing UI types.
 *
 * RULES:
 * - No price recalculation — all values from backend
 * - Maps to existing ProductListItem and Subcategory types
 * - Single source of truth for shape transformations
 */

import type { ProductListItem } from "@/features/product";
import type { Category, Subcategory } from "../models/category";
import type {
  ApiCategoryDetail,
  ApiCategoryChild,
  ApiProductListingItem,
} from "./category-listing.schemas";

// ─── Category → UI Category ─────────────────────────────────

export function mapApiCategoryToCategory(api: ApiCategoryDetail): Category {
  return {
    id: parseInt(api.id, 10) || 0,
    slug: api.slug,
    name: api.name,
    description: api.description ?? undefined,
    image: api.image ?? api.icon_url ?? "",
    parentId: api.parent ? parseInt(api.parent.id, 10) || null : null,
    productCount: api.product_count,
  };
}

// ─── Children → UI Subcategories ─────────────────────────────

export function mapApiChildToSubcategory(
  child: ApiCategoryChild,
  parentSlug: string
): Subcategory {
  return {
    id: parseInt(child.id, 10) || 0,
    slug: child.slug,
    name: child.name,
    image: child.icon_url ?? "",
    productCount: child.product_count,
    parentSlug,
  };
}

export function mapApiChildrenToSubcategories(
  children: ApiCategoryChild[],
  parentSlug: string
): Subcategory[] {
  return children.map((child) => mapApiChildToSubcategory(child, parentSlug));
}

// ─── Product Listing Item → UI ProductListItem ───────────────

export function mapApiProductToListItem(
  apiProduct: ApiProductListingItem
): ProductListItem {
  const thumbnail =
    apiProduct.thumbnail ??
    apiProduct.images?.[0]?.url ??
    "";

  return {
    id: parseInt(apiProduct.id, 10) || 0,
    slug: apiProduct.slug,
    name: apiProduct.name,
    price: apiProduct.sale_price ?? apiProduct.price,
    originalPrice: apiProduct.compare_price ?? undefined,
    discount: apiProduct.discount_percent ?? undefined,
    thumbnail,
    rating: apiProduct.avg_rating,
    reviewCount: apiProduct.review_count,
    stock: apiProduct.total_stock,
    sold: apiProduct.sales_count,
    vendorName: apiProduct.store?.name ?? "",
    categoryName: apiProduct.primary_category?.name ?? "",
  };
}

export function mapApiProductsToListItems(
  apiProducts: ApiProductListingItem[]
): ProductListItem[] {
  return apiProducts.map(mapApiProductToListItem);
}
