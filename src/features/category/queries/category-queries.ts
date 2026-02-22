import { MockCategoryService } from "../services/category-service";
import type { Category, Subcategory } from "../models/category";
import type { ProductListItem } from "@/features/product";

/**
 * Query functions for category data.
 * These are the ONLY entry points components should use to access category data.
 * They abstract away the data source (mock now, API later).
 */

const categoryService = new MockCategoryService();

export async function queryCategories(): Promise<Category[]> {
  return categoryService.getAll();
}

export async function queryCategoryBySlug(
  slug: string
): Promise<Category | null> {
  return categoryService.getBySlug(slug);
}

export async function queryTopCategories(): Promise<Category[]> {
  return categoryService.getTopLevel();
}

export async function querySubcategories(
  parentSlug: string
): Promise<Subcategory[]> {
  return categoryService.getSubcategories(parentSlug);
}

export async function queryCategoryProducts(
  categorySlug: string,
  count?: number
): Promise<ProductListItem[]> {
  return categoryService.getCategoryProducts(categorySlug, count);
}

export async function queryCategoryProductCount(
  categorySlug: string
): Promise<number> {
  return categoryService.getCategoryProductCount(categorySlug);
}
