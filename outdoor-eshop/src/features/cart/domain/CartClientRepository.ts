import type { Cart } from "./Cart";

export interface CartClientRepository {
  fetchCart(): Promise<Cart>;
  addItemToCart(variantId: number, quantity?: number): Promise<Cart>;
  updateCartItem(itemId: number, quantity: number): Promise<Cart>;
  removeCartItem(itemId: number): Promise<Cart>;
}
