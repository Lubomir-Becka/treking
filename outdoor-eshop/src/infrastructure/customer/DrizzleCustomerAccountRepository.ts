import { desc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import {
  addresses,
  orderItems,
  orders,
  productColors,
  productImages,
  productVariants,
} from "../../../drizzle/schema";
import type {
  CustomerAccountData,
  CustomerAccountRepository,
} from "../../domain/customer/CustomerAccountRepository";

export class DrizzleCustomerAccountRepository
  implements CustomerAccountRepository
{
  async getAccountData(userId: number): Promise<CustomerAccountData> {
    const storedOrders = await db
      .select({
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        productName: orderItems.productName,
        colorName: orderItems.colorName,
        size: orderItems.size,
        imageUrl: productImages.imageUrl,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .leftJoin(productColors, eq(productColors.id, productVariants.productColorId))
      .leftJoin(productImages, eq(productImages.productColorId, productColors.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const orderMap = new Map<string, CustomerAccountData["orders"][number]>();
    for (const row of storedOrders) {
      if (!orderMap.has(row.orderNumber)) {
        orderMap.set(row.orderNumber, {
          orderNumber: row.orderNumber,
          status: row.status ?? "pending",
          totalPrice: Number(row.totalPrice),
          createdAt: row.createdAt ? new Date(row.createdAt) : null,
          item: row.productName
            ? {
                productName: row.productName,
                colorName: row.colorName,
                size: row.size,
                imageUrl: row.imageUrl,
              }
            : null,
        });
      }
    }

    const storedAddresses = await db
      .select({
        label: addresses.addressLabel,
        recipientName: addresses.recipientName,
        street: addresses.street,
        city: addresses.city,
        postalCode: addresses.postalCode,
        country: addresses.country,
        isDefault: addresses.isDefault,
      })
      .from(addresses)
      .where(eq(addresses.userId, userId));

    return {
      orders: [...orderMap.values()],
      addresses: storedAddresses,
    };
  }
}
