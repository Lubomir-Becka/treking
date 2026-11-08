import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { favorites, productColors, productImages, products, productVariants } from "../../../../drizzle/schema";
import { compareSizes } from "../domain/compareSizes";
import { randomUUID } from "node:crypto";
import type { AdminColor, BatchVariantInput, ColorInput, VariantInput } from "../domain/AdminInventory";

export async function listAdminInventory(productId: number): Promise<AdminColor[] | null> {
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  if (!product) return null;

  const colors = await db.select({
    id: productColors.id,
    name: productColors.colorName,
    hexCode: productColors.hexCode,
    imageUrl: productImages.imageUrl,
  }).from(productColors).leftJoin(productImages, and(
    eq(productImages.productColorId, productColors.id),
    eq(productImages.isPrimary, true),
  )).where(eq(productColors.productId, productId)).orderBy(asc(productColors.id));

  const variants = await db.select({
    id: productVariants.id,
    colorId: productVariants.productColorId,
    sku: productVariants.sku,
    size: productVariants.size,
    price: productVariants.price,
    stock: productVariants.stock,
    isActive: productVariants.isActive,
  }).from(productVariants)
    .innerJoin(productColors, eq(productColors.id, productVariants.productColorId))
    .where(eq(productColors.productId, productId));

  const images = await db.select({
    id: productImages.id,
    colorId: productImages.productColorId,
    url: productImages.imageUrl,
    isPrimary: productImages.isPrimary,
  }).from(productImages)
    .innerJoin(productColors, eq(productColors.id, productImages.productColorId))
    .where(eq(productColors.productId, productId))
    .orderBy(asc(productImages.displayOrder), asc(productImages.id));

  return colors.map((color) => ({
    ...color,
    images: images.filter((image) => image.colorId === color.id).map((image) => ({
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary === true,
    })),
    variants: variants.filter((variant) => variant.colorId === color.id)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        price: variant.price,
        stock: variant.stock ?? 0,
        isActive: variant.isActive === true,
      })).sort((first, second) => compareSizes(first.size, second.size)),
  }));
}

export async function createAdminVariants(productId: number, colorId: number, input: BatchVariantInput) {
  return db.transaction(async (tx) => {
    const [color] = await tx.select({ id: productColors.id }).from(productColors)
      .where(and(eq(productColors.id, colorId), eq(productColors.productId, productId)))
      .for("update");
    if (!color) return false;
    await tx.insert(productVariants).values(input.sizes.map((size) => ({
      productColorId: colorId,
      sku: `VT-${randomUUID()}`,
      size,
      price: input.price,
      stock: 0,
      isActive: true,
    })));
    return true;
  });
}

export async function saveAdminColor(productId: number, input: ColorInput, colorId?: number) {
  if (colorId === undefined) {
    return db.transaction(async (tx) => {
      const [product] = await tx.select({ id: products.id }).from(products)
        .where(eq(products.id, productId)).for("update");
      if (!product) return false;
      await tx.insert(productColors).values({ productId, colorName: input.name, hexCode: input.hexCode });
      return true;
    });
  }
  const rows = await db.update(productColors)
    .set({ colorName: input.name, hexCode: input.hexCode })
    .where(and(eq(productColors.id, colorId), eq(productColors.productId, productId)))
    .returning({ id: productColors.id });
  return rows.length > 0;
}

export async function deleteEmptyAdminColor(productId: number, colorId: number) {
  return db.transaction(async (tx) => {
    const [color] = await tx.select({ id: productColors.id }).from(productColors)
      .where(and(eq(productColors.id, colorId), eq(productColors.productId, productId))).for("update");
    if (!color) return "not-found";
    const [used] = await tx.select({
      hasVariants: sql<boolean>`exists (select 1 from ${productVariants} where ${productVariants.productColorId} = ${colorId})`,
      hasImages: sql<boolean>`exists (select 1 from ${productImages} where ${productImages.productColorId} = ${colorId})`,
      hasFavorites: sql<boolean>`exists (select 1 from ${favorites} where ${favorites.productColorId} = ${colorId})`,
    }).from(productColors).where(eq(productColors.id, colorId));
    if (used.hasVariants || used.hasImages || used.hasFavorites) return "in-use";
    await tx.delete(productColors).where(eq(productColors.id, colorId));
    return "deleted";
  });
}

export async function saveAdminVariant(productId: number, colorId: number, input: VariantInput, variantId?: number) {
  return db.transaction(async (tx) => {
    const [color] = await tx.select({ id: productColors.id }).from(productColors)
      .where(and(eq(productColors.id, colorId), eq(productColors.productId, productId))).for("update");
    if (!color) return false;
    if (variantId === undefined) {
      await tx.insert(productVariants).values({ productColorId: colorId, ...input });
      return true;
    }
    const rows = await tx.update(productVariants).set(input)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productColorId, colorId)))
      .returning({ id: productVariants.id });
    return rows.length > 0;
  });
}
