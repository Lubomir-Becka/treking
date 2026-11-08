import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { products, productColors, productVariants } from "../../../../drizzle/schema";
import { isTargetAudience } from "../domain/product";
import type { AdminProductInput } from "../domain/AdminProducts";

export async function listAdminProducts() {
  const rows = await db.select({
    id: products.id,
    name: products.name,
    brand: products.brand,
    slug: products.slug,
    description: products.description,
    categoryId: products.categoryId,
    audience: products.audience,
    isActive: products.isActive,
  }).from(products).orderBy(asc(products.name), asc(products.id));
  const variants = await db.select({
    productId: productColors.productId,
    sku: productVariants.sku,
    active: productVariants.isActive,
  }).from(productVariants).innerJoin(productColors, eq(productVariants.productColorId, productColors.id));
  return rows.map((row) => {
    if (!isTargetAudience(row.audience)) throw new Error("INVALID_PRODUCT_AUDIENCE");
    const productVariants = variants.filter((variant) => variant.productId === row.id);
    return {
      ...row,
      audience: row.audience,
      isActive: row.isActive === true,
      variantCount: productVariants.length,
      activeVariantCount: productVariants.filter((variant) => variant.active === true).length,
      skus: productVariants.map((variant) => variant.sku),
    };
  });
}

export async function saveAdminProduct(input: AdminProductInput, id: number) {
  const rows = await db.update(products).set(input).where(eq(products.id, id)).returning({ id: products.id });
  return rows.length > 0;
}

export async function createAdminProduct(input: AdminProductInput) {
  const [created] = await db.insert(products).values(input).returning({ id: products.id });
  if (!created) throw new Error("PRODUCT_CREATION_FAILED");
  return created.id;
}

export async function setProductActive(id: number, active: boolean) {
  const rows = await db.update(products).set({ isActive: active })
    .where(eq(products.id, id)).returning({ id: products.id });
  return rows.length > 0;
}
