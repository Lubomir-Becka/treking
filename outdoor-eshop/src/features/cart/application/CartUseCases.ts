import type { CartActor } from "../domain/Cart";
import type { CartRepository } from "../domain/CartRepository";
import { isAllowedCartQuantity } from "../domain/cartQuantities";

function assertQuantity(quantity: number) {
  if (!isAllowedCartQuantity(quantity)) {
    throw new Error("INVALID_QUANTITY");
  }
}

function validId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= 2_147_483_647;
}

export function createCartUseCases(repository: CartRepository) {
  return {
    getCart(actor: CartActor) {
      return repository.get(actor);
    },
    addItem(actor: CartActor, variantId: number, quantity: number) {
      assertQuantity(quantity);
      if (!validId(variantId)) {
        throw new Error("INVALID_VARIANT");
      }
      return repository.addItem(actor, variantId, quantity);
    },
    updateItem(actor: CartActor, itemId: number, quantity: number) {
      assertQuantity(quantity);
      if (!validId(itemId)) {
        throw new Error("INVALID_ITEM");
      }
      return repository.updateItem(actor, itemId, quantity);
    },
    removeItem(actor: CartActor, itemId: number) {
      if (!validId(itemId)) {
        throw new Error("INVALID_ITEM");
      }
      return repository.removeItem(actor, itemId);
    },
    mergeGuestCart(guestTokenHash: string, userId: number) {
      return repository.mergeGuestCart(guestTokenHash, userId);
    },
  };
}
