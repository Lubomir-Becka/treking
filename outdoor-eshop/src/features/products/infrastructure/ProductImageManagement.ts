import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { productColors, productImages, products } from "../../../../drizzle/schema";
import { removeStoredProductImage, saveProductImage } from "./ProductImageStorage";

export async function listProductImages() {
  return db.select({
    colorId: productColors.id,
    productName: products.name,
    colorName: productColors.colorName,
    imageUrl: productImages.imageUrl,
  }).from(productColors)
    .innerJoin(products, eq(products.id, productColors.productId))
    .leftJoin(productImages, and(
      eq(productImages.productColorId, productColors.id),
      eq(productImages.isPrimary, true),
    ))
    .orderBy(asc(products.name), asc(productColors.id));
}

async function updatePrimary(colorId: number, imageUrl: string | null) {
  return db.transaction(async (tx) => {
    const [color] = await tx.select({ id: productColors.id }).from(productColors)
      .where(eq(productColors.id, colorId)).for("update");
    if (!color) return { found: false, removed: null };
    const [old] = await tx.delete(productImages).where(and(
      eq(productImages.productColorId, colorId),
      eq(productImages.isPrimary, true),
    )).returning({ url: productImages.imageUrl });
    if (imageUrl) {
      await tx.insert(productImages).values({ productColorId: colorId, imageUrl, isPrimary: true, displayOrder: -1 });
    } else {
      const [next] = await tx.select({ id: productImages.id }).from(productImages)
        .where(eq(productImages.productColorId, colorId))
        .orderBy(asc(productImages.displayOrder), asc(productImages.id)).limit(1);
      if (next) await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
    }
    return { found: true, removed: old?.url ?? null };
  });
}

export async function changeProductImage(colorId: number, file: File | null) {
  const url = file ? await saveProductImage(file) : null;
  const result = await updatePrimary(colorId, url);
  if (!result.found && url) await removeStoredProductImage(url);
  if (result.removed) {
    try {
      await removeStoredProductImage(result.removed);
    } catch (error) {
      console.error("Could not remove old product image:", error);
    }
  }
  return result.found;
}

    export async function addProductImage(colorId: number, file: File) {
      const url = await saveProductImage(file);
      let saved = false;
      try {
        saved = await db.transaction(async (tx) => {
          const [color] = await tx.select({ id: productColors.id }).from(productColors)
            .where(eq(productColors.id, colorId)).for("update");
          if (!color) return false;
          const [state] = await tx.select({
            maxOrder: sql<number | null>`max(${productImages.displayOrder})`,
            primaryCount: sql<number>`count(*) filter (where ${productImages.isPrimary} = true)`,
          }).from(productImages).where(eq(productImages.productColorId, colorId));
          await tx.insert(productImages).values({
            productColorId: colorId,
            imageUrl: url,
            displayOrder: (state.maxOrder ?? -1) + 1,
            isPrimary: Number(state.primaryCount) === 0,
          });
          return true;
        });
        return saved;
      } finally {
        if (!saved) await removeStoredProductImage(url);
      }
    }

    export async function updateProductGallery(
      colorId: number,
      operation: { type: "order"; imageIds: number[] } | { type: "primary" | "delete"; imageId: number },
    ) {
      const result = await db.transaction(async (tx) => {
        const [color] = await tx.select({ id: productColors.id }).from(productColors)
          .where(eq(productColors.id, colorId)).for("update");
        if (!color) return { status: "not-found" as const, removed: null };
        const images = await tx.select({
          id: productImages.id,
          url: productImages.imageUrl,
          isPrimary: productImages.isPrimary,
        }).from(productImages).where(eq(productImages.productColorId, colorId))
          .orderBy(asc(productImages.displayOrder), asc(productImages.id));
        if (operation.type === "order") {
          if (operation.imageIds.length !== images.length ||
              new Set(operation.imageIds).size !== images.length ||
              operation.imageIds.some((id) => !images.some((image) => image.id === id))) {
            return { status: "conflict" as const, removed: null };
          }
          for (const [index, id] of operation.imageIds.entries()) {
            await tx.update(productImages).set({ displayOrder: index }).where(eq(productImages.id, id));
          }
          return { status: "ok" as const, removed: null };
        }
        const selected = images.find((image) => image.id === operation.imageId);
        if (!selected) return { status: "not-found" as const, removed: null };
        if (operation.type === "primary") {
          await tx.update(productImages).set({ isPrimary: false })
            .where(eq(productImages.productColorId, colorId));
          await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, selected.id));
          return { status: "ok" as const, removed: null };
        }
        await tx.delete(productImages).where(eq(productImages.id, selected.id));
        if (selected.isPrimary) {
          const next = images.find((image) => image.id !== selected.id);
          if (next) await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
        }
        return { status: "ok" as const, removed: selected.url };
      });
      if (result.removed) await removeStoredProductImage(result.removed);
      return result.status;
    }
