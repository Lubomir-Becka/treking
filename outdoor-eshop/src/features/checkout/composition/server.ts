import { createOrder } from "../application/CreateOrder";
import { getShippingOptions } from "../application/GetShippingOptions";
import { DrizzleOrderRepository } from "../infrastructure/DrizzleOrderRepository";
import { DrizzleShippingQuoteRepository } from "../infrastructure/DrizzleShippingQuoteRepository";

export const createCheckoutOrder = createOrder(new DrizzleOrderRepository());
export const getCheckoutShippingOptions = getShippingOptions(
  new DrizzleShippingQuoteRepository(),
);
