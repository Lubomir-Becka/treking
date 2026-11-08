import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { favorites, productColors, products } from "../../../../drizzle/schema";

export class DrizzleFavoriteColorRepository {
  async list(userId: number): Promise<number[]> {
    const rows = await db.select({ id: favorites.productColorId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return rows.map((row) => row.id);
  }

  async add(userId: number, colorId: number): Promise<boolean> {
    const result = await db.execute<{ id: number }>(sql`
      INSERT INTO favorites (user_id, product_color_id)
      SELECT ${userId}, ${productColors.id} FROM ${productColors}
      INNER JOIN ${products} ON ${productColors.productId} = ${products.id}
      WHERE ${productColors.id} = ${colorId} AND ${products.isActive} = true
      ON CONFLICT (user_id, product_color_id) DO UPDATE SET product_color_id = excluded.product_color_id
      RETURNING id
    `);
    return result.length > 0;
  }

  async remove(userId: number, colorId: number): Promise<void> {
    await db.delete(favorites).where(and(
      eq(favorites.userId, userId),
      eq(favorites.productColorId, colorId),
    ));
  }
}
