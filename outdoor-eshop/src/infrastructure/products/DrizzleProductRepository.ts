import type { ProductRepository } from "../../domain/products/ProductRepository";
import type { ProductDetail, ProductListItem, ProductSearchCriteria } from "../../domain/products/product";
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

  async findCategories(audience?: ProductSearchCriteria["audience"]) {
    return findCategoriesQuery(audience);
  }

  async findSubcategories(
    parentId: number,
    audience?: ProductSearchCriteria["audience"],
  ) {
    return findSubcategoriesQuery(parentId, audience);
  }
}