import type { Product, ProductListItem } from "../models/product";
import type { ProductRepository } from "../repositories/product-repository";
import { getMockProducts, getMockProductById, getMockProductBySlug, baseMockProducts } from "../mocks/products";

/**
 * Mock implementation of ProductRepository.
 * Returns static fixture data — no network calls.
 */
export class MockProductService implements ProductRepository {
  async getAll(): Promise<ProductListItem[]> {
    return getMockProducts();
  }

  async getById(id: number): Promise<Product | null> {
    return getMockProductById(id) ?? null;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return getMockProductBySlug(slug) ?? null;
  }

  async getFeatured(limit = 6): Promise<ProductListItem[]> {
    return getMockProducts()
      .filter((_, i) => baseMockProducts[i]?.isFeatured)
      .slice(0, limit);
  }

  async getByCategory(categoryId: number, limit = 20): Promise<ProductListItem[]> {
    return getMockProducts()
      .filter((_, i) => baseMockProducts[i]?.categoryId === categoryId)
      .slice(0, limit);
  }

  async search(query: string): Promise<ProductListItem[]> {
    const q = query.toLowerCase();
    return getMockProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }

  async getRelated(productId: number, limit = 4): Promise<ProductListItem[]> {
    const product = getMockProductById(productId);
    if (!product) return getMockProducts(limit);

    // Return products from the same category, excluding the current product
    return getMockProducts()
      .filter((p) => p.id !== productId)
      .slice(0, limit);
  }
}
