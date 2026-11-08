import { and, eq, gte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/shared/db/client";
import { isAllowedCartQuantity } from "@/features/cart/domain/cartQuantities";
import { calculateShippingPrice } from "@/features/checkout/domain/shippingPrice";
import { shippingMethods } from "@/features/checkout/domain/shippingMethods";
import {
  cartItems,
  carts,
  orders,
  orderItems,
  productColors,
  productVariants,
  products,
} from "../../../../drizzle/schema";
import type {
  CreatedOrder,
  CreateOrderInput,
  OrderRepository,
} from "../domain/OrderRepository";

export class DrizzleOrderRepository implements OrderRepository {
  async create(input: CreateOrderInput): Promise<CreatedOrder> {
    return db.transaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(carts)
        .where(eq(carts.userId, input.userId))
        .limit(1)
        .for("update");
      if (!cart) throw new Error("EMPTY_CART");

      const items = await tx
        .select({
          cartItemId: cartItems.id,
          variantId: productVariants.id,
          productName: products.name,
          sku: productVariants.sku,
          colorName: productColors.colorName,
          size: productVariants.size,
          price: productVariants.price,
          stock: productVariants.stock,
          quantity: cartItems.quantity,
          active: productVariants.isActive,
          productActive: products.isActive,
        })
        .from(cartItems)
        .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
        .innerJoin(productColors, eq(productVariants.productColorId, productColors.id))
        .innerJoin(products, eq(productColors.productId, products.id))
        .where(eq(cartItems.cartId, cart.id))
        .for("update");

      if (items.length === 0) throw new Error("EMPTY_CART");
      for (const item of items) {
        if (!isAllowedCartQuantity(item.quantity)) {
          throw new Error("INVALID_CART_QUANTITY");
        }
        if (!item.active || !item.productActive || (item.stock ?? 0) < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
      const shippingMethod = shippingMethods.find((method) => method.code === input.shippingMethod);

      if (!shippingMethod) throw new Error("SHIPPING_METHOD_NOT_FOUND");

      const shippingPrice = Number(shippingMethod.price);
      const freeFromAmount =
        shippingMethod.freeFromAmount === null
          ? null
          : Number(shippingMethod.freeFromAmount);
      const shippingCost = calculateShippingPrice(subtotal, shippingPrice, freeFromAmount);
      const totalPrice = subtotal + shippingCost;
      const orderNumber = `VT-${randomUUID().slice(0, 8).toUpperCase()}`;

      const [order] = await tx.insert(orders).values({
        userId: input.userId,
        customerEmail: input.email.trim().toLowerCase(),
        orderNumber,
        itemsSubtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        shippingMethod: shippingMethod.name,
        paymentMethod: input.paymentMethod,
        totalPrice: totalPrice.toFixed(2),
        shippingRecipient: `${input.firstName.trim()} ${input.lastName.trim()}`,
        shippingStreet: input.street.trim(),
        shippingCity: input.city.trim(),
        shippingPostalCode: input.postalCode.trim(),
        shippingCountry: input.country?.trim() || "SK",
        shippingPhone: input.phone.trim(),
        note: input.note?.trim() || null,
      }).returning({ id: orders.id });
      if (!order) throw new Error("ORDER_CREATION_FAILED");

      for (const item of items) {
        const updated = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(and(
            eq(productVariants.id, item.variantId),
            gte(productVariants.stock, item.quantity),
          ))
          .returning({ id: productVariants.id });
        if (updated.length === 0) throw new Error("INSUFFICIENT_STOCK");

        await tx.insert(orderItems).values({
          orderId: order.id,
          productVariantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          colorName: item.colorName,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
        });
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      return { orderNumber, totalPrice };
    });
  }
}
