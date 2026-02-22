import type { Category, Subcategory } from "../models/category";
import type { ProductListItem } from "@/features/product";

/**
 * CategoryRepository interface — contract for all category data access.
 * Implementations: MockCategoryService (now), ApiCategoryService (later).
 */
export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getTopLevel(): Promise<Category[]>;
  getSubcategories(parentSlug: string): Promise<Subcategory[]>;
  getCategoryProducts(
    categorySlug: string,
    count?: number
  ): Promise<ProductListItem[]>;
  getCategoryProductCount(categorySlug: string): Promise<number>;
}
