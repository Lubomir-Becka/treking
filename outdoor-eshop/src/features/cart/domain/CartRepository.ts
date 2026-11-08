import type { Cart, CartActor } from "./Cart";

export interface CartRepository {
  get(actor: CartActor): Promise<Cart>;
  addItem(actor: CartActor, variantId: number, quantity: number): Promise<Cart>;
  updateItem(actor: CartActor, itemId: number, quantity: number): Promise<Cart>;
  removeItem(actor: CartActor, itemId: number): Promise<Cart>;
  mergeGuestCart(guestTokenHash: string, userId: number): Promise<void>;
}
