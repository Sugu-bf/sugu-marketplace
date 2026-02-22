import { MockProductService } from "../services/product-service";
import type { ProductListItem, Product } from "../models/product";

/**
 * Query functions for product data.
 * These are the ONLY entry points components should use to access product data.
 * They abstract away the data source (mock now, API later).
 */

const productService = new MockProductService();

export async function queryProducts(): Promise<ProductListItem[]> {
  return productService.getAll();
}

export async function queryFeaturedProducts(limit?: number): Promise<ProductListItem[]> {
  return productService.getFeatured(limit);
}

export async function queryProductBySlug(slug: string): Promise<Product | null> {
  return productService.getBySlug(slug);
}

export async function queryProductById(id: number): Promise<Product | null> {
  return productService.getById(id);
}

export async function queryProductsByCategory(
  categoryId: number,
  limit?: number
): Promise<ProductListItem[]> {
  return productService.getByCategory(categoryId, limit);
}

export async function querySearchProducts(query: string): Promise<ProductListItem[]> {
  return productService.search(query);
}

export async function queryRelatedProducts(
  productId: number,
  limit?: number
): Promise<ProductListItem[]> {
  return productService.getRelated(productId, limit);
}
