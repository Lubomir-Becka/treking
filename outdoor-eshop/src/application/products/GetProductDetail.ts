import type { ProductRepository } from "../../domain/products/ProductRepository";

export function createGetProductDetail(repository: ProductRepository) {
  return async function getProductDetail(slug: string) {
    return repository.findBySlug(slug);
  };
}
