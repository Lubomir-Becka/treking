import type { ShippingQuoteRepository } from "../domain/ShippingQuoteRepository";
import { isShippingMethodCode } from "../domain/checkout";
import { calculateShippingPrice } from "../domain/shippingPrice";

export function getShippingOptions(repository: ShippingQuoteRepository) {
  return async function execute(subtotal: number) {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("INVALID_SUBTOTAL");
    }

    const methods = await repository.findActiveMethods();
    return methods.filter((method) => isShippingMethodCode(method.code)).map((method) => {
      const freeFromAmount = method.freeFromAmount === null
        ? null
        : Number(method.freeFromAmount);
      const basePrice = Number(method.price);
      return {
        code: method.code,
        name: method.name,
        price: calculateShippingPrice(subtotal, basePrice, freeFromAmount),
      };
    });
  };
}
