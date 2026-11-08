import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { categories, products } from "../../../../drizzle/schema";
import {
  isValidCategoryParent,
  type CategoryInput,
  type CategoryManagementRepository,
} from "../domain/CategoryManagement";

// All category-tree mutations must use this lock before checking tree invariants.
const CATEGORY_TREE_LOCK = 192853741;

export class DrizzleCategoryManagementRepository implements CategoryManagementRepository {
  async list() {
    const rows = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      productCount: sql<number>`(select count(*)::int from products where category_id = ${categories.id})`,
      childCount: sql<number>`(select count(*)::int from categories as child where child.parent_id = ${categories.id})`,
    }).from(categories).orderBy(asc(categories.name), asc(categories.id));
    return rows;
  }

  async save(input: CategoryInput, id?: number) {
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${CATEGORY_TREE_LOCK}, 1)`);
        const all = await tx.select({
          id: categories.id,
          parentId: categories.parentId,
        }).from(categories).for("update");
        const current = id === undefined ? undefined : all.find((category) => category.id === id);
        if (id !== undefined && !current) throw new Error("CATEGORY_NOT_FOUND");
        if (!isValidCategoryParent(all, input.parentId, id)) {
          throw new Error("INVALID_CATEGORY_PARENT");
        }
        if (id === undefined) {
          await tx.insert(categories).values(input);
        } else {
          await tx.update(categories).set(input).where(eq(categories.id, id));
        }
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause : error;
      if (
        typeof cause === "object" && cause !== null &&
        "code" in cause && cause.code === "23505" &&
        "constraint_name" in cause && cause.constraint_name === "categories_slug_key"
      ) {
        throw new Error("CATEGORY_SLUG_EXISTS");
      }
      throw error;
    }
  }

  async delete(id: number) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${CATEGORY_TREE_LOCK}, 1)`);
      const [category] = await tx.select({ id: categories.id }).from(categories)
        .where(eq(categories.id, id)).for("update");
      if (!category) throw new Error("CATEGORY_NOT_FOUND");
      const [child] = await tx.select({ id: categories.id }).from(categories)
        .where(eq(categories.parentId, id)).limit(1);
      const [product] = await tx.select({ id: products.id }).from(products)
        .where(eq(products.categoryId, id)).limit(1);
      if (child || product) throw new Error("CATEGORY_IN_USE");
      await tx.delete(categories).where(eq(categories.id, id));
    });
  }
}
