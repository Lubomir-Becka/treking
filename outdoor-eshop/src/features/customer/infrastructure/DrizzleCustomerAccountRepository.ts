import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { orderItems, orders } from "../../../../drizzle/schema";
import type {
  CustomerAccountData,
  CustomerAccountRepository,
  CustomerOrderDetail,
} from "../domain/CustomerAccountRepository";

export class DrizzleCustomerAccountRepository implements CustomerAccountRepository {
  async getAccountData(userId: number): Promise<CustomerAccountData> {
    const storedOrders = await db.select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalPrice: orders.totalPrice,
      createdAt: orders.createdAt,
    }).from(orders).where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt), desc(orders.id));

    return {
      orders: storedOrders.map((order) => ({
        ...order,
        status: order.status ?? "pending",
        totalPrice: Number(order.totalPrice),
        createdAt: order.createdAt ? new Date(order.createdAt) : null,
      })),
    };
  }

  async getOrderDetail(userId: number, orderNumber: string): Promise<CustomerOrderDetail | null> {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumber)))
      .limit(1);
    if (!order) return null;

    const items = await db.select({
        id: orderItems.id,
        productName: orderItems.productName,
        sku: orderItems.sku,
        colorName: orderItems.colorName,
        size: orderItems.size,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      }).from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id));

    return {
      orderNumber: order.orderNumber,
      status: order.status ?? "pending",
      totalPrice: Number(order.totalPrice),
      createdAt: order.createdAt ? new Date(order.createdAt) : null,
      customerEmail: order.customerEmail,
      recipient: order.shippingRecipient,
      street: order.shippingStreet,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
      phone: order.shippingPhone,
      note: order.note,
      itemsSubtotal: Number(order.itemsSubtotal),
      shippingCost: Number(order.shippingCost),
      shippingMethod: order.shippingMethod,
      items: items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    };
  }
}
