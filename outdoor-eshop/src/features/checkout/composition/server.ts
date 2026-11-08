import { createOrder } from "../application/CreateOrder";
import { getShippingOptions } from "../application/GetShippingOptions";
import { DrizzleOrderRepository } from "../infrastructure/DrizzleOrderRepository";
import { shippingMethods } from "../domain/shippingMethods";

export const createCheckoutOrder = createOrder(new DrizzleOrderRepository());
export const getCheckoutShippingOptions = getShippingOptions(
  { findActiveMethods: async () => [...shippingMethods] },
);
