import { and, asc, eq, ilike, inArray, max, min, or } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  attributes,
  categories,
  productAttributes,
  productColors,
  productImages,
  products,
  productVariants,
} from "../../../../drizzle/schema";
import type { ProductListItem, ProductSearchCriteria } from "../../../domain/products/product";
import { parseAudience } from "./helpers";
import { getCategoryListingIds } from "../../../application/products/categoryListing";

export async function searchCatalogQuery(criteria: ProductSearchCriteria): Promise<ProductListItem[]> {
  const searchTerm = criteria.query?.trim();
  const [selectedCategory] = criteria.categorySlug
    ? await db
        .select({ id: categories.id, parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.slug, criteria.categorySlug))
        .limit(1)
    : [];
  const childCategories = selectedCategory?.parentId === null
    ? await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, selectedCategory.id))
    : [];
  const categoryIds = selectedCategory
    ? getCategoryListingIds(selectedCategory, childCategories)
    : [];
  const filters = [
    eq(products.isActive, true),
    ...(searchTerm
      ? [
          or(
            ilike(products.name, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`),
            ilike(categories.name, `%${searchTerm}%`),
            ilike(productColors.colorName, `%${searchTerm}%`),
            ilike(attributes.name, `%${searchTerm}%`),
            ilike(productAttributes.value, `%${searchTerm}%`),
          ),
        ]
      : []),
    ...(criteria.categorySlug
      ? categoryIds.length > 0
        ? [inArray(products.categoryId, categoryIds)]
        : [eq(categories.slug, criteria.categorySlug)]
      : []),
    ...(criteria.audience
      ? [
          criteria.audience === "unisex"
            ? eq(products.audience, "unisex")
            : or(eq(products.audience, criteria.audience), eq(products.audience, "unisex")),
        ]
      : []),
  ];

  const rows = await db
    .select({
      id: products.id,
      colorId: productColors.id,
      name: products.name,
      slug: products.slug,
      colorName: productColors.colorName,
      hexCode: productColors.hexCode,
      description: products.description,
      brand: products.brand,
      category: categories.name,
      categorySlug: categories.slug,
      audience: products.audience,
      price: min(productVariants.price),
      imageUrl: productImages.imageUrl,
      stock: max(productVariants.stock),
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(productColors, eq(productColors.productId, products.id))
    .innerJoin(
      productVariants,
      and(
        eq(productVariants.productColorId, productColors.id),
        eq(productVariants.isActive, true),
      ),
    )
    .innerJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .leftJoin(
      productAttributes,
      eq(productAttributes.productId, products.id),
    )
    .leftJoin(
      attributes,
      eq(productAttributes.attributeId, attributes.id),
    )
    .where(and(...filters))
    .groupBy(
      products.id,
      productColors.id,
      productColors.colorName,
      productColors.hexCode,
      productImages.imageUrl,
      categories.name,
      categories.slug,
      products.audience,
    )
    .orderBy(asc(products.name))
    .limit(criteria.limit ?? 24);

  return rows.map((row) => ({
    ...row,
    audience: parseAudience(row.audience),
  }));
}