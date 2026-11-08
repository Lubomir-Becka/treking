import type { ProductRepository } from "../domain/ProductRepository";
import type { ProductDetail, ProductListItem, ProductSearchCriteria } from "../domain/product";
import { findProductDetailQuery } from "./queries/findProductDetailQuery";
import { searchCatalogQuery } from "./queries/searchCatalogQuery";
import { findCategoriesQuery, findCategoryQuery, findSubcategoriesQuery } from "./queries/categoryQueries";

export class DrizzleProductRepository implements ProductRepository {
  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return findProductDetailQuery(slug);
  }

  async search(criteria: ProductSearchCriteria): Promise<ProductListItem[]> {
    return searchCatalogQuery(criteria);
  }

  async findCategory(slug: string) {
    return findCategoryQuery(slug);
  }

  async findCategories() {
    return findCategoriesQuery();
  }

  async findSubcategories(parentId: number) {
    return findSubcategoriesQuery(parentId);
  }
}