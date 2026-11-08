import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { categories, products } from "../../../../../drizzle/schema";

export async function findCategoryQuery(slug: string) {
  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      productCount: sql<number>`count(distinct ${products.id})`,
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .where(eq(categories.slug, slug))
    .groupBy(categories.id)
    .limit(1);

  return category ? { ...category, productCount: Number(category.productCount) } : null;
}

export async function findCategoriesQuery() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      productCount: sql<number>`count(distinct ${products.id})`,
    })
    .from(categories)
    .innerJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .where(isNull(categories.parentId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}

export async function findSubcategoriesQuery(parentId: number) {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      productCount: sql<number>`count(distinct ${products.id})`,
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .where(eq(categories.parentId, parentId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }));
}