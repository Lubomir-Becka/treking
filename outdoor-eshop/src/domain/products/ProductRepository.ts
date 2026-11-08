import type {
  ProductDetail,
  ProductListItem,
  ProductSearchCriteria,
  CategorySummary,
} from "./product";

export interface ProductRepository {
  findBySlug(slug: string): Promise<ProductDetail | null>;
  search(criteria: ProductSearchCriteria): Promise<ProductListItem[]>;
  findCategory(slug: string): Promise<CategorySummary | null>;
  findCategories(audience?: ProductSearchCriteria["audience"]): Promise<CategorySummary[]>;
  findSubcategories(
    parentId: number,
    audience?: ProductSearchCriteria["audience"],
  ): Promise<CategorySummary[]>;
}
