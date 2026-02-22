import type { Product, ProductListItem } from "../models/product";

/**
 * ProductRepository interface — contract for all product data access.
 * Implementations: MockProductRepository (now), ApiProductRepository (later).
 */
export interface ProductRepository {
  getAll(): Promise<ProductListItem[]>;
  getById(id: number): Promise<Product | null>;
  getBySlug(slug: string): Promise<Product | null>;
  getFeatured(limit?: number): Promise<ProductListItem[]>;
  getByCategory(categoryId: number, limit?: number): Promise<ProductListItem[]>;
  search(query: string): Promise<ProductListItem[]>;
  getRelated(productId: number, limit?: number): Promise<ProductListItem[]>;
}
