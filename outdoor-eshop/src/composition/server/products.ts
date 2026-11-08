import { DrizzleProductRepository } from "../../infrastructure/products/DrizzleProductRepository";
import { createGetProductDetail } from "../../application/products/GetProductDetail";
import { createSearchProducts } from "../../application/products/SearchProducts";

const productRepository = new DrizzleProductRepository();

export const getProductDetail = createGetProductDetail(productRepository);
export const searchProducts = createSearchProducts(productRepository);
export const getCategory = (slug: string) => productRepository.findCategory(slug);
export const getCategories = (audience?: "men" | "women" | "unisex") =>
  productRepository.findCategories(audience);
export const getSubcategories = (parentId: number, audience?: "men" | "women" | "unisex") =>
  productRepository.findSubcategories(parentId, audience);
