import type { CreateOrderInput, OrderRepository } from "../domain/OrderRepository";
import { isValidCreateOrderInput } from "../domain/OrderValidation";

export function createOrder(repository: OrderRepository) {
  return async function execute(input: CreateOrderInput) {
    if (!isValidCreateOrderInput(input)) {
      throw new Error("INVALID_SHIPPING_DATA");
    }
    return repository.create(input);
  };
}
