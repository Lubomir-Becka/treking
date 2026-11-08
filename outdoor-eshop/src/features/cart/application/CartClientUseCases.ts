import type { CartClientRepository } from "@/features/cart/domain/CartClientRepository";

export function createCartClientUseCases(repository: CartClientRepository) {
  return {
    fetchCart: () => repository.fetchCart(),
    addItemToCart: (variantId: number, quantity?: number) =>
      repository.addItemToCart(variantId, quantity),
    updateCartItem: (itemId: number, quantity: number) =>
      repository.updateCartItem(itemId, quantity),
    removeCartItem: (itemId: number) => repository.removeCartItem(itemId),
  };
}
