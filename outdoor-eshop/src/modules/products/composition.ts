import { DrizzleProductRepository } from "./infrastructure/DrizzleProductRepository";
import { createGetProductDetail } from "./application/GetProductDetail";
import { createSearchProducts } from "./application/SearchProducts";

const productRepository = new DrizzleProductRepository();

export const getProductDetail = createGetProductDetail(productRepository);
export const searchProducts = createSearchProducts(productRepository);
export const getCategory = (slug: string) => productRepository.findCategory(slug);
export const getSubcategories = (parentId: number) =>
  productRepository.findSubcategories(parentId);
