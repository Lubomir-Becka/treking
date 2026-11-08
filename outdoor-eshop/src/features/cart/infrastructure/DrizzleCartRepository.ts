import { and, eq, sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
  cartItems,
  carts,
  productColors,
  productImages,
  products,
  productVariants,
} from "../../../../drizzle/schema";
import type { CartActor, Cart, CartItem } from "../domain/Cart";
import type { CartRepository } from "../domain/CartRepository";
import { combinedCartQuantity, isAllowedCartQuantity } from "../domain/cartQuantities";

async function findOrCreateCart(actor: CartActor) {
  const condition =
    actor.type === "guest"
      ? eq(carts.sessionId, actor.tokenHash)
      : eq(carts.userId, actor.userId);
  const [existing] = await db.select().from(carts).where(condition).limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(carts)
    .values(actor.type === "guest" ? { sessionId: actor.tokenHash } : { userId: actor.userId })
    .onConflictDoNothing({
      target: actor.type === "guest" ? carts.sessionId : carts.userId,
    })
    .returning();

  if (created) return created;

  const [concurrentCart] = await db
    .select()
    .from(carts)
    .where(condition)
    .limit(1);
  if (!concurrentCart) throw new Error("Unable to create or find cart.");
  return concurrentCart;
}

async function loadCart(cartId: number): Promise<Cart> {
  const rows = await db
    .select({
      id: cartItems.id,
      variantId: productVariants.id,
      productName: products.name,
      slug: products.slug,
      imageUrl: productImages.imageUrl,
      colorName: productColors.colorName,
      size: productVariants.size,
      sku: productVariants.sku,
      unitPrice: productVariants.price,
      stock: productVariants.stock,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
    .innerJoin(productColors, eq(productVariants.productColorId, productColors.id))
    .innerJoin(products, eq(productColors.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productColorId, productColors.id),
        eq(productImages.isPrimary, true),
      ),
    )
    .where(eq(cartItems.cartId, cartId));

  const items: CartItem[] = rows.map((row) => ({
    ...row,
    unitPrice: Number(row.unitPrice),
    stock: row.stock ?? 0,
  }));
  return { id: cartId, items };
}

export class DrizzleCartRepository implements CartRepository {
  async get(actor: CartActor) {
    const cart = await findOrCreateCart(actor);
    return loadCart(cart.id);
  }

  async addItem(actor: CartActor, variantId: number, quantity: number) {
    const cart = await findOrCreateCart(actor);
    await db.transaction(async (tx) => {
      await tx.select({ id: carts.id }).from(carts)
        .where(eq(carts.id, cart.id))
        .for("update");

      const [variant] = await tx
        .select({
          id: productVariants.id,
          stock: productVariants.stock,
          active: productVariants.isActive,
          productActive: products.isActive,
        })
        .from(productVariants)
        .innerJoin(productColors, eq(productVariants.productColorId, productColors.id))
        .innerJoin(products, eq(productColors.productId, products.id))
        .where(eq(productVariants.id, variantId))
        .limit(1)
        .for("update");

      if (!variant?.active || !variant.productActive || (variant.stock ?? 0) < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const [existing] = await tx
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productVariantId, variantId)))
        .limit(1);
      const nextQuantity = combinedCartQuantity(existing?.quantity ?? 0, quantity);

      if (!isAllowedCartQuantity(nextQuantity)) throw new Error("INVALID_QUANTITY");
      if (nextQuantity > (variant.stock ?? 0)) throw new Error("INSUFFICIENT_STOCK");
      if (existing) {
        await tx.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, existing.id));
      } else {
        await tx.insert(cartItems).values({ cartId: cart.id, productVariantId: variantId, quantity });
      }
    });
    return loadCart(cart.id);
  }

  async updateItem(actor: CartActor, itemId: number, quantity: number) {
    const cart = await findOrCreateCart(actor);
    await db.transaction(async (tx) => {
      await tx.select({ id: carts.id }).from(carts)
        .where(eq(carts.id, cart.id))
        .for("update");
      const [item] = await tx
        .select({
          itemId: cartItems.id,
          stock: productVariants.stock,
          active: productVariants.isActive,
          productActive: products.isActive,
        })
        .from(cartItems)
        .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
        .innerJoin(productColors, eq(productVariants.productColorId, productColors.id))
        .innerJoin(products, eq(productColors.productId, products.id))
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .limit(1)
        .for("update");
      if (!item) throw new Error("ITEM_NOT_FOUND");
      if (!item.active || !item.productActive || quantity > (item.stock ?? 0)) throw new Error("INSUFFICIENT_STOCK");
      await tx.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
    });
    return loadCart(cart.id);
  }

  async removeItem(actor: CartActor, itemId: number) {
    const cart = await findOrCreateCart(actor);
    await db.transaction(async (tx) => {
      await tx.select({ id: carts.id }).from(carts)
        .where(eq(carts.id, cart.id))
        .for("update");
      const deleted = await tx.delete(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .returning({ id: cartItems.id });
      if (deleted.length === 0) throw new Error("ITEM_NOT_FOUND");
    });
    return loadCart(cart.id);
  }

  async mergeGuestCart(guestTokenHash: string, userId: number) {
    await db.transaction(async (tx) => {
      const [guestCart] = await tx
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.sessionId, guestTokenHash))
        .limit(1)
        .for("update");
      if (!guestCart) return;

      await tx
        .insert(carts)
        .values({ userId })
        .onConflictDoNothing({ target: carts.userId });

      const [customerCart] = await tx
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1)
        .for("update");
      if (!customerCart) {
        throw new Error("Unable to resolve customer cart.");
      }

      const guestItems = await tx
        .select({
          variantId: cartItems.productVariantId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCart.id));

      for (const guestItem of guestItems) {
        const [existing] = await tx
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.cartId, customerCart.id),
              eq(cartItems.productVariantId, guestItem.variantId),
            ),
          )
          .limit(1);
        const quantity = combinedCartQuantity(existing?.quantity ?? 0, guestItem.quantity);

        if (existing) {
          await tx
            .update(cartItems)
            .set({ quantity })
            .where(eq(cartItems.id, existing.id));
        } else {
          await tx.insert(cartItems).values({
            cartId: customerCart.id,
            productVariantId: guestItem.variantId,
            quantity,
          });
        }
      }

      await tx.delete(carts).where(eq(carts.id, guestCart.id));
    });
  }
}
