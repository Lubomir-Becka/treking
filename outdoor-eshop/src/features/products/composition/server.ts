import { DrizzleProductRepository } from "../infrastructure/DrizzleProductRepository";
import { createGetProductDetail } from "../application/GetProductDetail";
import { createSearchProducts } from "../application/SearchProducts";
import { createCategoryManagement } from "../application/ManageCategories";
import { DrizzleCategoryManagementRepository } from "../infrastructure/DrizzleCategoryManagementRepository";
export { listProductImages, changeProductImage, addProductImage, updateProductGallery } from "../infrastructure/ProductImageManagement";
export { InvalidProductImage, MAX_IMAGE_BYTES, readProductImage } from "../infrastructure/ProductImageStorage";

const productRepository = new DrizzleProductRepository();
export const categoryManagement = createCategoryManagement(new DrizzleCategoryManagementRepository());

export const getProductDetail = createGetProductDetail(productRepository);
export const searchProducts = createSearchProducts(productRepository);
export const getCategory = (slug: string) => productRepository.findCategory(slug);
export const getCategories = (audience?: "men" | "women" | "unisex") =>
  productRepository.findCategories(audience);
export const getSubcategories = (parentId: number, audience?: "men" | "women" | "unisex") =>
  productRepository.findSubcategories(parentId, audience);
export { createAdminProduct, listAdminProducts, saveAdminProduct, setProductActive } from "../infrastructure/AdminProductManagement";
export { listAdminInventory, saveAdminColor, deleteEmptyAdminColor, saveAdminVariant, createAdminVariants } from "../infrastructure/AdminInventoryManagement";
