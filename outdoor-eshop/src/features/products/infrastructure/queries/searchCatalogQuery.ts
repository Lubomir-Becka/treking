import { and, asc, desc, eq, ilike, inArray, max, min, or, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
  categories,
  productColors,
  productImages,
  products,
  productVariants,
} from "../../../../../drizzle/schema";
import type { ProductListItem, ProductSearchCriteria } from "../../domain/product";
import { parseAudience } from "./helpers";
import { getCategoryListingIds } from "../../application/categoryListing";

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
    ...(criteria.colorIds ? [inArray(productColors.id, criteria.colorIds)] : []),
    ...(criteria.slugs ? [inArray(products.slug, criteria.slugs)] : []),
    ...(searchTerm
      ? [
          or(
            ilike(products.name, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`),
            ilike(categories.name, `%${searchTerm}%`),
            ilike(productColors.colorName, `%${searchTerm}%`),
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
    .leftJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
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
    .having(and(
      ...(criteria.maxPrice !== undefined && criteria.stockOnly
        ? [sql`count(*) filter (where ${productVariants.price} <= ${criteria.maxPrice}::numeric and ${productVariants.stock} > 0) > 0`]
        : [
            ...(criteria.maxPrice !== undefined ? [sql`min(${productVariants.price}) <= ${criteria.maxPrice}::numeric`] : []),
            ...(criteria.stockOnly ? [sql`max(${productVariants.stock}) > 0`] : []),
          ]),
    ))
    .orderBy(
      ...(criteria.sort === "price-asc"
        ? [asc(min(productVariants.price))]
        : criteria.sort === "price-desc"
          ? [desc(min(productVariants.price))]
          : []),
      asc(products.name),
      asc(products.id),
      asc(productColors.id),
    )
    .limit(criteria.limit ?? 24)
    .offset(criteria.offset ?? 0);

  return rows.map((row) => ({
    ...row,
    audience: parseAudience(row.audience),
  }));
}