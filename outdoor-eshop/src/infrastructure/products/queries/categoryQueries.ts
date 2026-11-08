import { and, asc, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/db/client";
import {
  categories,
  productColors,
  productImages,
  products,
} from "../../../../drizzle/schema";
import type { ProductSearchCriteria } from "../../../domain/products/product";

function getAudienceFilter(audience?: ProductSearchCriteria["audience"]): SQL | undefined {
  if (!audience) return undefined;
  if (audience === "unisex") return eq(products.audience, "unisex");
  return or(eq(products.audience, audience), eq(products.audience, "unisex"));
}

export async function findCategoryQuery(slug: string) {
  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: sql<string | null>`min(${productImages.imageUrl})`,
      productCount: sql<number>`count(distinct case when ${productImages.id} is not null then ${productColors.id} end)`,
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .leftJoin(productColors, eq(productColors.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(eq(categories.slug, slug))
    .groupBy(categories.id)
    .limit(1);

  return category ? { ...category, productCount: Number(category.productCount) } : null;
}

export async function findCategoriesQuery(
  audience?: ProductSearchCriteria["audience"],
) {
  const audienceFilter = getAudienceFilter(audience);
  const childCategories = alias(categories, "child_categories");
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: sql<string | null>`min(${productImages.imageUrl})`,
      productCount: sql<number>`count(distinct case when ${productImages.id} is not null then ${productColors.id} end)`,
    })
    .from(categories)
    .leftJoin(childCategories, eq(childCategories.parentId, categories.id))
    .leftJoin(
      products,
      and(
        or(
          eq(products.categoryId, categories.id),
          eq(products.categoryId, childCategories.id),
        ),
        eq(products.isActive, true),
        ...(audienceFilter ? [audienceFilter] : []),
      ),
    )
    .leftJoin(productColors, eq(productColors.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(isNull(categories.parentId))
    .groupBy(categories.id)
    .orderBy(
      sql`CASE ${categories.slug}
        WHEN 'bundy' THEN 0
        WHEN 'nohavice' THEN 1
        WHEN 'obuv' THEN 2
        WHEN 'doplnky' THEN 3
        ELSE 4
      END`,
      asc(categories.name),
    );

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}

export async function findSubcategoriesQuery(
  parentId: number,
  audience?: ProductSearchCriteria["audience"],
) {
  const audienceFilter = getAudienceFilter(audience);
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      imageUrl: sql<string | null>`min(${productImages.imageUrl})`,
      productCount: sql<number>`count(distinct case when ${productImages.id} is not null then ${productColors.id} end)`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(
        eq(products.categoryId, categories.id),
        eq(products.isActive, true),
        ...(audienceFilter ? [audienceFilter] : []),
      ),
    )
    .leftJoin(productColors, eq(productColors.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(eq(categories.parentId, parentId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}