import { calculateShippingPrice } from "./shippingPrice";

const MAX_ORDER_CENTS = 9_999_999_999;

function toCents(value: string): number {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("INVALID_ORDER_PRICE");
  }
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function calculateOrderAmounts(
  items: ReadonlyArray<{ price: string; quantity: number }>,
  shippingPrice: string,
  freeFromAmount: string | null,
) {
  let subtotalCents = 0;
  for (const item of items) {
    subtotalCents += toCents(item.price) * item.quantity;
    if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_ORDER_CENTS) {
      throw new Error("ORDER_TOTAL_TOO_HIGH");
    }
  }
  const shippingCents = calculateShippingPrice(
    subtotalCents,
    toCents(shippingPrice),
    freeFromAmount === null ? null : toCents(freeFromAmount),
  );
  const totalCents = subtotalCents + shippingCents;
  if (totalCents > MAX_ORDER_CENTS) throw new Error("ORDER_TOTAL_TOO_HIGH");
  return { subtotalCents, shippingCents, totalCents };
}

export function centsToDecimal(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
