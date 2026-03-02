import type { Store } from "../models/store";
import type { ProductListItem } from "@/features/product";

export interface StoreRepository {
  getBySlug(slug: string): Promise<Store | null>;
  getProducts(
    slug: string,
    category?: string,
    page?: number,
    perPage?: number,
  ): Promise<{ products: ProductListItem[]; total: number; totalPages: number }>;
}
