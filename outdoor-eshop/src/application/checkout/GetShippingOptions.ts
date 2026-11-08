import type { ShippingQuoteRepository } from "../../domain/checkout/ShippingQuoteRepository";

export function getShippingOptions(repository: ShippingQuoteRepository) {
  return async function execute(subtotal: number) {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("INVALID_SUBTOTAL");
    }

    const methods = await repository.findActiveMethods();
    return methods.map((method) => {
      const freeFromAmount = method.freeFromAmount === null
        ? null
        : Number(method.freeFromAmount);
      const basePrice = Number(method.price);
      return {
        code: method.code,
        name: method.name,
        price: freeFromAmount !== null && subtotal >= freeFromAmount
          ? 0
          : basePrice,
      };
    });
  };
}
