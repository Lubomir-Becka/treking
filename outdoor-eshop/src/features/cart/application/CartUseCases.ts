import type { CartActor } from "../domain/Cart";
import type { CartRepository } from "../domain/CartRepository";
import { isAllowedCartQuantity } from "../domain/cartQuantities";

function assertQuantity(quantity: number) {
  if (!isAllowedCartQuantity(quantity)) {
    throw new Error("INVALID_QUANTITY");
  }
}

export function createCartUseCases(repository: CartRepository) {
  return {
    getCart(actor: CartActor) {
      return repository.get(actor);
    },
    addItem(actor: CartActor, variantId: number, quantity: number) {
      assertQuantity(quantity);
      if (!Number.isInteger(variantId) || variantId < 1) {
        throw new Error("INVALID_VARIANT");
      }
      return repository.addItem(actor, variantId, quantity);
    },
    updateItem(actor: CartActor, itemId: number, quantity: number) {
      assertQuantity(quantity);
      if (!Number.isInteger(itemId) || itemId < 1) {
        throw new Error("INVALID_ITEM");
      }
      return repository.updateItem(actor, itemId, quantity);
    },
    removeItem(actor: CartActor, itemId: number) {
      if (!Number.isInteger(itemId) || itemId < 1) {
        throw new Error("INVALID_ITEM");
      }
      return repository.removeItem(actor, itemId);
    },
    mergeGuestCart(guestTokenHash: string, userId: number) {
      return repository.mergeGuestCart(guestTokenHash, userId);
    },
  };
}
