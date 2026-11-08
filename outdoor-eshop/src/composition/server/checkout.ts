import { createOrder } from "../../application/checkout/CreateOrder";
import { getShippingOptions } from "../../application/checkout/GetShippingOptions";
import { DrizzleOrderRepository } from "../../infrastructure/checkout/DrizzleOrderRepository";
import { DrizzleShippingQuoteRepository } from "../../infrastructure/checkout/DrizzleShippingQuoteRepository";

export const createCheckoutOrder = createOrder(new DrizzleOrderRepository());
export const getCheckoutShippingOptions = getShippingOptions(
  new DrizzleShippingQuoteRepository(),
);
