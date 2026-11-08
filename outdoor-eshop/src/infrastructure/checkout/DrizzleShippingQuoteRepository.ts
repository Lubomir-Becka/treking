import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { shippingMethods } from "../../../drizzle/schema";
import type { ShippingQuoteRepository } from "../../domain/checkout/ShippingQuoteRepository";

export class DrizzleShippingQuoteRepository implements ShippingQuoteRepository {
  async findActiveMethods() {
    return db
      .select({
        code: shippingMethods.code,
        name: shippingMethods.name,
        price: shippingMethods.price,
        freeFromAmount: shippingMethods.freeFromAmount,
      })
      .from(shippingMethods)
      .where(eq(shippingMethods.isActive, true));
  }
}
