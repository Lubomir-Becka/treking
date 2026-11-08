export function calculateShippingPrice(
  subtotal: number,
  basePrice: number,
  freeFromAmount: number | null,
): number {
  return freeFromAmount !== null && subtotal >= freeFromAmount ? 0 : basePrice;
}
