import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { addresses, orderItems, orders, shipping, shippingMethods } from "../../../../drizzle/schema";
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

    const storedAddresses = await db.select({
      label: addresses.addressLabel,
      recipientName: addresses.recipientName,
      street: addresses.street,
      city: addresses.city,
      postalCode: addresses.postalCode,
      country: addresses.country,
      isDefault: addresses.isDefault,
    }).from(addresses).where(eq(addresses.userId, userId));

    return {
      orders: storedOrders.map((order) => ({
        ...order,
        status: order.status ?? "pending",
        totalPrice: Number(order.totalPrice),
        createdAt: order.createdAt ? new Date(order.createdAt) : null,
      })),
      addresses: storedAddresses,
    };
  }

  async getOrderDetail(userId: number, orderNumber: string): Promise<CustomerOrderDetail | null> {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.orderNumber, orderNumber)))
      .limit(1);
    if (!order) return null;

    const [items, shipment] = await Promise.all([
      db.select({
        id: orderItems.id,
        productName: orderItems.productName,
        sku: orderItems.sku,
        colorName: orderItems.colorName,
        size: orderItems.size,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      }).from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)),
      db.select({ name: shippingMethods.name }).from(shipping)
        .innerJoin(shippingMethods, eq(shipping.shippingMethodId, shippingMethods.id))
        .where(eq(shipping.orderId, order.id)).orderBy(asc(shipping.id)).limit(1),
    ]);

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
      shippingMethod: shipment[0]?.name ?? null,
      items: items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    };
  }
}
