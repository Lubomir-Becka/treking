import type { ProductRepository } from "../../domain/products/ProductRepository";
import type {
  ProductListItem,
  ProductSearchCriteria,
} from "../../domain/products/product";

export const DEFAULT_PRODUCT_LIMIT = 24;
export const MAX_PRODUCT_LIMIT = 100;

export function normalizeProductLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit)) {
    return DEFAULT_PRODUCT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PRODUCT_LIMIT);
}

export function createSearchProducts(repository: ProductRepository) {
  return async function searchProducts(
    criteria: ProductSearchCriteria,
  ): Promise<ProductListItem[]> {
    const limit = normalizeProductLimit(criteria.limit);

    return repository.search({
      ...criteria,
      query: criteria.query?.trim() || undefined,
      categorySlug: criteria.categorySlug?.trim() || undefined,
      limit,
    });
  };
}
