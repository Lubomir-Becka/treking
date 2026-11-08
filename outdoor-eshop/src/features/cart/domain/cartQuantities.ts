export const MAX_CART_ITEM_QUANTITY = 99;

export function combinedCartQuantity(current: number, added: number): number {
  return current + added;
}

export function isAllowedCartQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_CART_ITEM_QUANTITY;
}
