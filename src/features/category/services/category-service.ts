import type { Category, Subcategory } from "../models/category";
import type { ProductListItem } from "@/features/product";
import type { CategoryRepository } from "../repositories/category-repository";
import {
  getMockCategories,
  getMockCategoryBySlug,
  getMockSubcategories,
  getMockCategoryProducts,
  getMockCategoryProductCount,
} from "../mocks/categories";

/**
 * Mock implementation of CategoryRepository.
 * Returns static fixture data — no network calls.
 */
export class MockCategoryService implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return getMockCategories();
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return getMockCategoryBySlug(slug) ?? null;
  }

  async getTopLevel(): Promise<Category[]> {
    return getMockCategories().filter((c) => c.parentId === null);
  }

  async getSubcategories(parentSlug: string): Promise<Subcategory[]> {
    return getMockSubcategories(parentSlug);
  }

  async getCategoryProducts(
    categorySlug: string,
    count?: number
  ): Promise<ProductListItem[]> {
    return getMockCategoryProducts(categorySlug, count);
  }

  async getCategoryProductCount(categorySlug: string): Promise<number> {
    return getMockCategoryProductCount(categorySlug);
  }
}
